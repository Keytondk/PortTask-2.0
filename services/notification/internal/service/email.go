package service

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"strings"
	"time"

	"github.com/navo/services/notification/internal/model"
)

// EmailConfig holds email service configuration
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromAddress  string
	FromName     string
	UseTLS       bool
}

// EmailService handles email sending
type EmailService struct {
	config EmailConfig
}

// NewEmailService creates a new email service
func NewEmailService(config EmailConfig) *EmailService {
	return &EmailService{
		config: config,
	}
}

// SendEmail sends an email message
func (s *EmailService) SendEmail(ctx context.Context, msg *model.EmailMessage) error {
	if s.config.SMTPHost == "" {
		// Log mode - don't actually send
		fmt.Printf("[EmailService] Would send email to %v: %s\n", msg.To, msg.Subject)
		return nil
	}

	// Build email headers and body
	var emailBuffer bytes.Buffer

	// From header
	from := s.config.FromAddress
	if s.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromAddress)
	}
	emailBuffer.WriteString(fmt.Sprintf("From: %s\r\n", from))

	// To header
	emailBuffer.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(msg.To, ", ")))

	// CC header
	if len(msg.CC) > 0 {
		emailBuffer.WriteString(fmt.Sprintf("Cc: %s\r\n", strings.Join(msg.CC, ", ")))
	}

	// Subject
	emailBuffer.WriteString(fmt.Sprintf("Subject: %s\r\n", msg.Subject))

	// Date
	emailBuffer.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))

	// Message-ID
	emailBuffer.WriteString(fmt.Sprintf("Message-ID: <%d.%s@navo.io>\r\n", time.Now().UnixNano(), s.config.FromAddress))

	// Reply-To
	if msg.ReplyTo != "" {
		emailBuffer.WriteString(fmt.Sprintf("Reply-To: %s\r\n", msg.ReplyTo))
	}

	// Custom headers
	for key, value := range msg.Headers {
		emailBuffer.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}

	// MIME headers for HTML email
	if msg.HTMLBody != "" {
		boundary := fmt.Sprintf("----=_Part_%d", time.Now().UnixNano())
		emailBuffer.WriteString("MIME-Version: 1.0\r\n")
		emailBuffer.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
		emailBuffer.WriteString("\r\n")

		// Text part
		emailBuffer.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		emailBuffer.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
		emailBuffer.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		emailBuffer.WriteString("\r\n")
		emailBuffer.WriteString(msg.TextBody)
		emailBuffer.WriteString("\r\n\r\n")

		// HTML part
		emailBuffer.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		emailBuffer.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		emailBuffer.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		emailBuffer.WriteString("\r\n")
		emailBuffer.WriteString(msg.HTMLBody)
		emailBuffer.WriteString("\r\n\r\n")

		// End boundary
		emailBuffer.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		// Plain text only
		emailBuffer.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
		emailBuffer.WriteString("\r\n")
		emailBuffer.WriteString(msg.TextBody)
	}

	// Collect all recipients
	recipients := make([]string, 0, len(msg.To)+len(msg.CC)+len(msg.BCC))
	recipients = append(recipients, msg.To...)
	recipients = append(recipients, msg.CC...)
	recipients = append(recipients, msg.BCC...)

	// Send email
	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)

	var auth smtp.Auth
	if s.config.SMTPUsername != "" {
		auth = smtp.PlainAuth("", s.config.SMTPUsername, s.config.SMTPPassword, s.config.SMTPHost)
	}

	// Use TLS if configured
	if s.config.UseTLS || s.config.SMTPPort == 465 {
		return s.sendWithTLS(addr, auth, s.config.FromAddress, recipients, emailBuffer.Bytes())
	}

	return smtp.SendMail(addr, auth, s.config.FromAddress, recipients, emailBuffer.Bytes())
}

// sendWithTLS sends email using explicit TLS
func (s *EmailService) sendWithTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
	tlsConfig := &tls.Config{
		ServerName: s.config.SMTPHost,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect with TLS: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP auth failed: %w", err)
		}
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("MAIL command failed: %w", err)
	}

	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("RCPT command failed for %s: %w", recipient, err)
		}
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA command failed: %w", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("failed to write email data: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	return client.Quit()
}

// RenderTemplate renders an email template with data
func (s *EmailService) RenderTemplate(tmpl *model.Template, data map[string]any) (*model.EmailMessage, error) {
	// Parse and execute subject template
	subjectTmpl, err := template.New("subject").Parse(tmpl.Subject)
	if err != nil {
		return nil, fmt.Errorf("failed to parse subject template: %w", err)
	}

	var subjectBuf bytes.Buffer
	if err := subjectTmpl.Execute(&subjectBuf, data); err != nil {
		return nil, fmt.Errorf("failed to execute subject template: %w", err)
	}

	// Parse and execute HTML template
	htmlTmpl, err := template.New("html").Parse(tmpl.HTMLBody)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var htmlBuf bytes.Buffer
	if err := htmlTmpl.Execute(&htmlBuf, data); err != nil {
		return nil, fmt.Errorf("failed to execute HTML template: %w", err)
	}

	// Parse and execute text template
	textTmpl, err := template.New("text").Parse(tmpl.TextBody)
	if err != nil {
		return nil, fmt.Errorf("failed to parse text template: %w", err)
	}

	var textBuf bytes.Buffer
	if err := textTmpl.Execute(&textBuf, data); err != nil {
		return nil, fmt.Errorf("failed to execute text template: %w", err)
	}

	return &model.EmailMessage{
		Subject:  subjectBuf.String(),
		HTMLBody: htmlBuf.String(),
		TextBody: textBuf.String(),
	}, nil
}

// HealthCheck checks if the email service is configured
func (s *EmailService) HealthCheck() error {
	if s.config.SMTPHost == "" {
		return fmt.Errorf("SMTP not configured")
	}
	return nil
}
