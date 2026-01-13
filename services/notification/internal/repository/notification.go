package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/services/notification/internal/model"
)

const (
	notificationKeyPrefix = "notification:"
	userNotificationsKey  = "user:notifications:"
	pendingNotificationsKey = "notifications:pending"
	notificationTTL       = 30 * 24 * time.Hour // 30 days
)

// NotificationRepository handles notification persistence
type NotificationRepository struct {
	redis *redis.Client
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(redisClient *redis.Client) *NotificationRepository {
	return &NotificationRepository{
		redis: redisClient,
	}
}

// Save saves a notification
func (r *NotificationRepository) Save(ctx context.Context, notification *model.Notification) error {
	notification.UpdatedAt = time.Now().UTC()

	data, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	// Save notification
	key := notificationKeyPrefix + notification.ID
	if err := r.redis.Set(ctx, key, data, notificationTTL).Err(); err != nil {
		return fmt.Errorf("failed to save notification: %w", err)
	}

	// Add to user's notification list
	userKey := userNotificationsKey + notification.UserID
	score := float64(notification.CreatedAt.Unix())
	if err := r.redis.ZAdd(ctx, userKey, &redis.Z{
		Score:  score,
		Member: notification.ID,
	}).Err(); err != nil {
		return fmt.Errorf("failed to add to user notifications: %w", err)
	}

	// If pending/scheduled, add to pending set
	if notification.Status == model.NotificationStatusQueued || notification.Status == model.NotificationStatusPending {
		var scheduleTime float64
		if notification.ScheduledFor != nil {
			scheduleTime = float64(notification.ScheduledFor.Unix())
		} else {
			scheduleTime = float64(time.Now().Unix())
		}
		if err := r.redis.ZAdd(ctx, pendingNotificationsKey, &redis.Z{
			Score:  scheduleTime,
			Member: notification.ID,
		}).Err(); err != nil {
			return fmt.Errorf("failed to add to pending notifications: %w", err)
		}
	} else {
		// Remove from pending if status changed
		r.redis.ZRem(ctx, pendingNotificationsKey, notification.ID)
	}

	return nil
}

// Get retrieves a notification by ID
func (r *NotificationRepository) Get(ctx context.Context, id string) (*model.Notification, error) {
	key := notificationKeyPrefix + id
	data, err := r.redis.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("notification not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get notification: %w", err)
	}

	var notification model.Notification
	if err := json.Unmarshal(data, &notification); err != nil {
		return nil, fmt.Errorf("failed to unmarshal notification: %w", err)
	}

	return &notification, nil
}

// GetByUser retrieves notifications for a user
func (r *NotificationRepository) GetByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Notification, error) {
	userKey := userNotificationsKey + userID

	// Get notification IDs (newest first)
	ids, err := r.redis.ZRevRange(ctx, userKey, int64(offset), int64(offset+limit-1)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get user notification IDs: %w", err)
	}

	notifications := make([]*model.Notification, 0, len(ids))
	for _, id := range ids {
		notification, err := r.Get(ctx, id)
		if err != nil {
			continue // Skip if notification not found
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

// GetPending retrieves pending notifications that are ready to be sent
func (r *NotificationRepository) GetPending(ctx context.Context) ([]*model.Notification, error) {
	now := float64(time.Now().Unix())

	// Get notifications scheduled for now or earlier
	ids, err := r.redis.ZRangeByScore(ctx, pendingNotificationsKey, &redis.ZRangeBy{
		Min: "-inf",
		Max: fmt.Sprintf("%f", now),
	}).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get pending notifications: %w", err)
	}

	notifications := make([]*model.Notification, 0, len(ids))
	for _, id := range ids {
		notification, err := r.Get(ctx, id)
		if err != nil {
			continue
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

// MarkAllAsRead marks all notifications for a user as read
func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID string) error {
	userKey := userNotificationsKey + userID
	now := time.Now().UTC()

	// Get all notification IDs for the user
	ids, err := r.redis.ZRange(ctx, userKey, 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to get user notifications: %w", err)
	}

	// Update each notification
	for _, id := range ids {
		notification, err := r.Get(ctx, id)
		if err != nil {
			continue
		}

		if notification.ReadAt == nil {
			notification.Status = model.NotificationStatusRead
			notification.ReadAt = &now
			r.Save(ctx, notification)
		}
	}

	return nil
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(ctx context.Context, id string) error {
	notification, err := r.Get(ctx, id)
	if err != nil {
		return err
	}

	// Remove from all sets
	key := notificationKeyPrefix + id
	userKey := userNotificationsKey + notification.UserID

	pipe := r.redis.Pipeline()
	pipe.Del(ctx, key)
	pipe.ZRem(ctx, userKey, id)
	pipe.ZRem(ctx, pendingNotificationsKey, id)

	_, err = pipe.Exec(ctx)
	return err
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	notifications, err := r.GetByUser(ctx, userID, 100, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, n := range notifications {
		if n.ReadAt == nil {
			count++
		}
	}
	return count, nil
}

// Cleanup removes expired notifications
func (r *NotificationRepository) Cleanup(ctx context.Context) error {
	// This would be called periodically to clean up old notifications
	// Redis TTL handles most of this, but we need to clean up sorted sets
	return nil
}
