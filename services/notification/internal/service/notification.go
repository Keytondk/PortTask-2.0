package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/navo/services/notification/internal/model"
	"github.com/navo/services/notification/internal/repository"
)

// NotificationService handles notification operations
type NotificationService struct {
	emailService     *EmailService
	notificationRepo *repository.NotificationRepository
	templateRepo     *repository.TemplateRepository
	redis            *redis.Client
}

// NewNotificationService creates a new notification service
func NewNotificationService(
	emailService *EmailService,
	notificationRepo *repository.NotificationRepository,
	templateRepo *repository.TemplateRepository,
	redisClient *redis.Client,
) *NotificationService {
	return &NotificationService{
		emailService:     emailService,
		notificationRepo: notificationRepo,
		templateRepo:     templateRepo,
		redis:            redisClient,
	}
}

// Send sends a notification
func (s *NotificationService) Send(ctx context.Context, req *model.SendNotificationRequest) (*model.Notification, error) {
	// Create notification record
	now := time.Now().UTC()
	notification := &model.Notification{
		ID:           uuid.New().String(),
		Type:         req.Type,
		Category:     req.Category,
		Priority:     req.Priority,
		Status:       model.NotificationStatusPending,
		UserID:       req.UserID,
		Email:        req.Email,
		Subject:      req.Subject,
		Title:        req.Title,
		Body:         req.Body,
		TemplateName: req.TemplateName,
		TemplateData: req.TemplateData,
		EntityType:   req.EntityType,
		EntityID:     req.EntityID,
		ActionURL:    req.ActionURL,
		Metadata:     req.Metadata,
		ScheduledFor: req.ScheduledFor,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Set default priority
	if notification.Priority == "" {
		notification.Priority = model.NotificationPriorityNormal
	}

	// If scheduled for later, just save and return
	if notification.ScheduledFor != nil && notification.ScheduledFor.After(now) {
		notification.Status = model.NotificationStatusQueued
		if err := s.notificationRepo.Save(ctx, notification); err != nil {
			return nil, fmt.Errorf("failed to save notification: %w", err)
		}
		return notification, nil
	}

	// Process immediately
	if err := s.processNotification(ctx, notification); err != nil {
		notification.Status = model.NotificationStatusFailed
		notification.FailureReason = err.Error()
		notification.FailedAt = &now
	}

	// Save notification
	if err := s.notificationRepo.Save(ctx, notification); err != nil {
		return nil, fmt.Errorf("failed to save notification: %w", err)
	}

	// Publish in-app notification event
	if notification.Type == model.NotificationTypeInApp || notification.Type == model.NotificationTypeEmail {
		s.publishNotificationEvent(ctx, notification)
	}

	return notification, nil
}

// SendBatch sends multiple notifications
func (s *NotificationService) SendBatch(ctx context.Context, req *model.BatchNotificationRequest) ([]*model.Notification, error) {
	results := make([]*model.Notification, 0, len(req.Notifications))
	for _, notifReq := range req.Notifications {
		notification, err := s.Send(ctx, &notifReq)
		if err != nil {
			log.Printf("[NotificationService] Failed to send notification: %v", err)
			continue
		}
		results = append(results, notification)
	}
	return results, nil
}

// processNotification handles the actual notification delivery
func (s *NotificationService) processNotification(ctx context.Context, notification *model.Notification) error {
	notification.Status = model.NotificationStatusSending

	switch notification.Type {
	case model.NotificationTypeEmail:
		return s.sendEmailNotification(ctx, notification)
	case model.NotificationTypeInApp:
		return s.sendInAppNotification(ctx, notification)
	case model.NotificationTypePush:
		return s.sendPushNotification(ctx, notification)
	default:
		return fmt.Errorf("unsupported notification type: %s", notification.Type)
	}
}

// sendEmailNotification sends an email notification
func (s *NotificationService) sendEmailNotification(ctx context.Context, notification *model.Notification) error {
	if notification.Email == "" {
		return fmt.Errorf("email address is required for email notifications")
	}

	var emailMsg *model.EmailMessage

	// Check if using a template
	if notification.TemplateName != "" {
		tmpl, err := s.templateRepo.Get(notification.TemplateName)
		if err != nil {
			return fmt.Errorf("failed to get template: %w", err)
		}

		// Prepare template data
		data := notification.TemplateData
		if data == nil {
			data = make(map[string]any)
		}
		data["Title"] = notification.Title
		data["Body"] = notification.Body
		data["ActionURL"] = notification.ActionURL
		data["Year"] = time.Now().Year()

		emailMsg, err = s.emailService.RenderTemplate(tmpl, data)
		if err != nil {
			return fmt.Errorf("failed to render template: %w", err)
		}
		emailMsg.To = []string{notification.Email}
	} else {
		// Use direct content
		subject := notification.Subject
		if subject == "" {
			subject = notification.Title
		}

		emailMsg = &model.EmailMessage{
			To:       []string{notification.Email},
			Subject:  subject,
			TextBody: notification.Body,
			HTMLBody: notification.HTMLBody,
		}

		// If no HTML body, wrap text in basic HTML
		if emailMsg.HTMLBody == "" {
			emailMsg.HTMLBody = s.wrapInHTMLTemplate(notification.Title, notification.Body, notification.ActionURL)
		}
	}

	// Send the email
	if err := s.emailService.SendEmail(ctx, emailMsg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	now := time.Now().UTC()
	notification.Status = model.NotificationStatusSent
	notification.SentAt = &now

	return nil
}

// sendInAppNotification sends an in-app notification
func (s *NotificationService) sendInAppNotification(ctx context.Context, notification *model.Notification) error {
	now := time.Now().UTC()
	notification.Status = model.NotificationStatusDelivered
	notification.DeliveredAt = &now
	return nil
}

// sendPushNotification sends a push notification
func (s *NotificationService) sendPushNotification(ctx context.Context, notification *model.Notification) error {
	// Push notification implementation would go here
	// For now, just mark as sent
	now := time.Now().UTC()
	notification.Status = model.NotificationStatusSent
	notification.SentAt = &now
	return nil
}

// publishNotificationEvent publishes a real-time notification event
func (s *NotificationService) publishNotificationEvent(ctx context.Context, notification *model.Notification) {
	event := model.NotificationEvent{
		Type:           "notification:new",
		NotificationID: notification.ID,
		UserID:         notification.UserID,
		Category:       string(notification.Category),
		Title:          notification.Title,
		Body:           notification.Body,
		ActionURL:      notification.ActionURL,
		Timestamp:      time.Now().UTC(),
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("[NotificationService] Failed to marshal event: %v", err)
		return
	}

	// Publish to user-specific channel
	channel := fmt.Sprintf("navo:user:%s:notifications", notification.UserID)
	if err := s.redis.Publish(ctx, channel, eventJSON).Err(); err != nil {
		log.Printf("[NotificationService] Failed to publish event: %v", err)
	}
}

// Get retrieves a notification by ID
func (s *NotificationService) Get(ctx context.Context, id string) (*model.Notification, error) {
	return s.notificationRepo.Get(ctx, id)
}

// GetByUser retrieves notifications for a user
func (s *NotificationService) GetByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Notification, error) {
	return s.notificationRepo.GetByUser(ctx, userID, limit, offset)
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, id string) error {
	notification, err := s.notificationRepo.Get(ctx, id)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	notification.Status = model.NotificationStatusRead
	notification.ReadAt = &now
	notification.UpdatedAt = now

	return s.notificationRepo.Save(ctx, notification)
}

// MarkAllAsRead marks all notifications for a user as read
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID string) error {
	return s.notificationRepo.MarkAllAsRead(ctx, userID)
}

// Delete deletes a notification
func (s *NotificationService) Delete(ctx context.Context, id string) error {
	return s.notificationRepo.Delete(ctx, id)
}

// GetTemplate retrieves a template by name
func (s *NotificationService) GetTemplate(name string) (*model.Template, error) {
	return s.templateRepo.Get(name)
}

// ListTemplates lists all available templates
func (s *NotificationService) ListTemplates() []*model.Template {
	return s.templateRepo.List()
}

// PreviewTemplate previews a rendered template
func (s *NotificationService) PreviewTemplate(name string, data map[string]any) (*model.EmailMessage, error) {
	tmpl, err := s.templateRepo.Get(name)
	if err != nil {
		return nil, err
	}

	return s.emailService.RenderTemplate(tmpl, data)
}

// ProcessPendingNotifications processes notifications that are scheduled
func (s *NotificationService) ProcessPendingNotifications(ctx context.Context) error {
	notifications, err := s.notificationRepo.GetPending(ctx)
	if err != nil {
		return err
	}

	for _, notification := range notifications {
		if err := s.processNotification(ctx, notification); err != nil {
			log.Printf("[NotificationService] Failed to process notification %s: %v", notification.ID, err)
			notification.RetryCount++
			if notification.RetryCount >= 3 {
				now := time.Now().UTC()
				notification.Status = model.NotificationStatusFailed
				notification.FailureReason = err.Error()
				notification.FailedAt = &now
			}
		}
		s.notificationRepo.Save(ctx, notification)
	}

	return nil
}

// wrapInHTMLTemplate wraps plain text in a basic HTML email template
func (s *NotificationService) wrapInHTMLTemplate(title, body, actionURL string) string {
	actionButton := ""
	if actionURL != "" {
		actionButton = fmt.Sprintf(`
			<tr>
				<td style="padding: 24px 0;">
					<a href="%s" style="background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
						View Details
					</a>
				</td>
			</tr>`, actionURL)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>%s</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
					<!-- Header -->
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Navo Maritime</h1>
						</td>
					</tr>
					<!-- Content -->
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">%s</h2>
							<p style="color: #475569; margin: 0; line-height: 1.6; font-size: 16px;">%s</p>
						</td>
					</tr>
					<!-- Action Button -->
					%s
					<!-- Footer -->
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">
								This is an automated message from Navo Maritime Platform.<br>
								&copy; %d Navo Maritime. All rights reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`, title, title, body, actionButton, time.Now().Year())
}
