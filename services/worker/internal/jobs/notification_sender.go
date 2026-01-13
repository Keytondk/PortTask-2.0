package jobs

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/smtp"
	"strings"
	"time"

	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

// NotificationSenderJob processes and sends pending notifications
type NotificationSenderJob struct {
	db           *sql.DB
	smtpHost     string
	smtpPort     int
	smtpUser     string
	smtpPassword string
	fromEmail    string
	fromName     string
}

// NotificationSenderConfig holds email configuration
type NotificationSenderConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

// NewNotificationSenderJob creates a new notification sender job
func NewNotificationSenderJob(db *sql.DB, cfg NotificationSenderConfig) *NotificationSenderJob {
	return &NotificationSenderJob{
		db:           db,
		smtpHost:     cfg.SMTPHost,
		smtpPort:     cfg.SMTPPort,
		smtpUser:     cfg.SMTPUser,
		smtpPassword: cfg.SMTPPassword,
		fromEmail:    cfg.FromEmail,
		fromName:     cfg.FromName,
	}
}

// Name returns the job name
func (j *NotificationSenderJob) Name() string {
	return "notification_sender"
}

// Notification represents a pending notification
type Notification struct {
	ID       string
	UserID   string
	Type     string
	Title    string
	Message  string
	Data     map[string]interface{}
	Channels []string
	Email    string // Joined from user
}

// Run processes and sends pending notifications
func (j *NotificationSenderJob) Run(ctx context.Context) error {
	// Get pending notifications that need email delivery
	query := `
		SELECT n.id, n.user_id, n.type, n.title, n.message, n.data, n.channels, u.email
		FROM notifications n
		JOIN users u ON n.user_id = u.id
		WHERE n.sent_at IS NULL
		AND n.channels::text LIKE '%email%'
		LIMIT 100
	`

	rows, err := j.db.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var n Notification
		var dataJSON, channelsJSON []byte

		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &dataJSON, &channelsJSON, &n.Email); err != nil {
			logger.Error("Failed to scan notification", zap.Error(err))
			continue
		}

		json.Unmarshal(dataJSON, &n.Data)
		json.Unmarshal(channelsJSON, &n.Channels)
		notifications = append(notifications, n)
	}

	if len(notifications) == 0 {
		return nil
	}

	logger.Info("Processing notifications", zap.Int("count", len(notifications)))

	// Send each notification
	sentCount := 0
	for _, n := range notifications {
		if err := j.sendEmail(ctx, n); err != nil {
			logger.Error("Failed to send notification email",
				zap.String("notification_id", n.ID),
				zap.Error(err),
			)
			continue
		}

		// Mark as sent
		if _, err := j.db.ExecContext(ctx, `
			UPDATE notifications SET sent_at = $1 WHERE id = $2
		`, time.Now(), n.ID); err != nil {
			logger.Error("Failed to mark notification as sent",
				zap.String("notification_id", n.ID),
				zap.Error(err),
			)
		}

		sentCount++
	}

	if sentCount > 0 {
		logger.Info("Sent notification emails", zap.Int("count", sentCount))
	}

	return nil
}

// sendEmail sends an email notification
func (j *NotificationSenderJob) sendEmail(ctx context.Context, n Notification) error {
	if j.smtpHost == "" {
		logger.Debug("SMTP not configured, skipping email", zap.String("notification_id", n.ID))
		return nil
	}

	// Build email
	subject := n.Title
	body := buildEmailBody(n)

	msg := []byte(fmt.Sprintf("From: %s <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n",
		j.fromName, j.fromEmail, n.Email, subject, body))

	// Send email
	auth := smtp.PlainAuth("", j.smtpUser, j.smtpPassword, j.smtpHost)
	addr := fmt.Sprintf("%s:%d", j.smtpHost, j.smtpPort)

	if err := smtp.SendMail(addr, auth, j.fromEmail, []string{n.Email}, msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// buildEmailBody creates an HTML email body
func buildEmailBody(n Notification) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Navo</h1>
        </div>
        <div class="content">
            <h2>%s</h2>
            <p>%s</p>
        </div>
        <div class="footer">
            <p>This email was sent by Navo Maritime Operations Platform</p>
            <p>&copy; 2024 Navo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, n.Title, strings.ReplaceAll(n.Message, "\n", "<br>"))
}
