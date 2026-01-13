package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/services/notification/internal/model"
	"github.com/navo/services/notification/internal/service"
)

// NotificationWorker handles background notification processing
type NotificationWorker struct {
	notificationService *service.NotificationService
	redis               *redis.Client
	processingInterval  time.Duration
}

// NewNotificationWorker creates a new notification worker
func NewNotificationWorker(
	notificationService *service.NotificationService,
	redisClient *redis.Client,
) *NotificationWorker {
	return &NotificationWorker{
		notificationService: notificationService,
		redis:               redisClient,
		processingInterval:  30 * time.Second,
	}
}

// Start starts the notification worker
func (w *NotificationWorker) Start(ctx context.Context) {
	log.Println("[NotificationWorker] Starting...")

	// Start scheduled notification processor
	go w.processScheduledNotifications(ctx)

	// Start event listener for real-time triggers
	go w.listenForEvents(ctx)

	<-ctx.Done()
	log.Println("[NotificationWorker] Stopped")
}

// processScheduledNotifications processes notifications scheduled for delivery
func (w *NotificationWorker) processScheduledNotifications(ctx context.Context) {
	ticker := time.NewTicker(w.processingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := w.notificationService.ProcessPendingNotifications(ctx); err != nil {
				log.Printf("[NotificationWorker] Error processing pending notifications: %v", err)
			}
		}
	}
}

// listenForEvents listens for notification trigger events from other services
func (w *NotificationWorker) listenForEvents(ctx context.Context) {
	// Subscribe to notification trigger channels
	pubsub := w.redis.Subscribe(ctx,
		"navo:notifications:trigger",
		"navo:port_call:events",
		"navo:rfq:events",
		"navo:service_order:events",
	)
	defer pubsub.Close()

	ch := pubsub.Channel()

	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			w.handleEvent(ctx, msg)
		}
	}
}

// handleEvent processes incoming notification trigger events
func (w *NotificationWorker) handleEvent(ctx context.Context, msg *redis.Message) {
	var event struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse event: %v", err)
		return
	}

	switch event.Type {
	case "port_call:created":
		w.handlePortCallCreated(ctx, event.Data)
	case "port_call:status_changed":
		w.handlePortCallStatusChanged(ctx, event.Data)
	case "rfq:published":
		w.handleRFQPublished(ctx, event.Data)
	case "rfq:quote_submitted":
		w.handleQuoteSubmitted(ctx, event.Data)
	case "rfq:quote_awarded":
		w.handleQuoteAwarded(ctx, event.Data)
	case "service_order:created":
		w.handleServiceOrderCreated(ctx, event.Data)
	case "service_order:completed":
		w.handleServiceOrderCompleted(ctx, event.Data)
	case "notification:send":
		w.handleDirectNotification(ctx, event.Data)
	}
}

// Event handlers

func (w *NotificationWorker) handlePortCallCreated(ctx context.Context, data json.RawMessage) {
	var portCall struct {
		ID          string `json:"id"`
		Reference   string `json:"reference"`
		VesselName  string `json:"vessel_name"`
		PortName    string `json:"port_name"`
		ETA         string `json:"eta"`
		AssignedTo  string `json:"assigned_to"`
		AssignedEmail string `json:"assigned_email"`
		ActionURL   string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &portCall); err != nil {
		log.Printf("[NotificationWorker] Failed to parse port call event: %v", err)
		return
	}

	if portCall.AssignedTo == "" {
		return
	}

	_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
		Type:         model.NotificationTypeEmail,
		Category:     model.CategoryPortCall,
		Priority:     model.NotificationPriorityNormal,
		UserID:       portCall.AssignedTo,
		Email:        portCall.AssignedEmail,
		Title:        "New Port Call Created",
		Body:         "A new port call has been created for " + portCall.VesselName + " at " + portCall.PortName,
		TemplateName: "port_call_created",
		TemplateData: map[string]any{
			"VesselName": portCall.VesselName,
			"PortName":   portCall.PortName,
			"ETA":        portCall.ETA,
			"Reference":  portCall.Reference,
			"ActionURL":  portCall.ActionURL,
		},
		EntityType: "port_call",
		EntityID:   portCall.ID,
		ActionURL:  portCall.ActionURL,
	})

	if err != nil {
		log.Printf("[NotificationWorker] Failed to send port call notification: %v", err)
	}
}

func (w *NotificationWorker) handlePortCallStatusChanged(ctx context.Context, data json.RawMessage) {
	var event struct {
		ID          string `json:"id"`
		Reference   string `json:"reference"`
		VesselName  string `json:"vessel_name"`
		PortName    string `json:"port_name"`
		OldStatus   string `json:"old_status"`
		NewStatus   string `json:"new_status"`
		NotifyUsers []struct {
			UserID string `json:"user_id"`
			Email  string `json:"email"`
		} `json:"notify_users"`
		ActionURL string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse status change event: %v", err)
		return
	}

	for _, user := range event.NotifyUsers {
		_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
			Type:         model.NotificationTypeEmail,
			Category:     model.CategoryPortCall,
			Priority:     model.NotificationPriorityNormal,
			UserID:       user.UserID,
			Email:        user.Email,
			Title:        "Port Call Status Update",
			Body:         event.VesselName + " status changed from " + event.OldStatus + " to " + event.NewStatus,
			TemplateName: "port_call_status_changed",
			TemplateData: map[string]any{
				"VesselName": event.VesselName,
				"PortName":   event.PortName,
				"OldStatus":  event.OldStatus,
				"NewStatus":  event.NewStatus,
				"Reference":  event.Reference,
				"ActionURL":  event.ActionURL,
			},
			EntityType: "port_call",
			EntityID:   event.ID,
			ActionURL:  event.ActionURL,
		})

		if err != nil {
			log.Printf("[NotificationWorker] Failed to send status change notification: %v", err)
		}
	}
}

func (w *NotificationWorker) handleRFQPublished(ctx context.Context, data json.RawMessage) {
	var event struct {
		ID          string `json:"id"`
		Reference   string `json:"reference"`
		ServiceType string `json:"service_type"`
		VesselName  string `json:"vessel_name"`
		PortName    string `json:"port_name"`
		Deadline    string `json:"deadline"`
		Vendors     []struct {
			VendorID   string `json:"vendor_id"`
			VendorName string `json:"vendor_name"`
			Email      string `json:"email"`
		} `json:"vendors"`
		ActionURL string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse RFQ published event: %v", err)
		return
	}

	for _, vendor := range event.Vendors {
		_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
			Type:         model.NotificationTypeEmail,
			Category:     model.CategoryRFQ,
			Priority:     model.NotificationPriorityHigh,
			UserID:       vendor.VendorID,
			Email:        vendor.Email,
			Title:        "You've been invited to quote",
			Body:         "You've been invited to submit a quote for " + event.ServiceType + " at " + event.PortName,
			TemplateName: "rfq_invitation",
			TemplateData: map[string]any{
				"VendorName":  vendor.VendorName,
				"ServiceType": event.ServiceType,
				"VesselName":  event.VesselName,
				"PortName":    event.PortName,
				"Deadline":    event.Deadline,
				"Reference":   event.Reference,
				"ActionURL":   event.ActionURL,
			},
			EntityType: "rfq",
			EntityID:   event.ID,
			ActionURL:  event.ActionURL,
		})

		if err != nil {
			log.Printf("[NotificationWorker] Failed to send RFQ invitation: %v", err)
		}
	}
}

func (w *NotificationWorker) handleQuoteSubmitted(ctx context.Context, data json.RawMessage) {
	var event struct {
		RFQID       string `json:"rfq_id"`
		Reference   string `json:"reference"`
		ServiceType string `json:"service_type"`
		VendorName  string `json:"vendor_name"`
		Amount      string `json:"amount"`
		Currency    string `json:"currency"`
		NotifyUsers []struct {
			UserID string `json:"user_id"`
			Email  string `json:"email"`
		} `json:"notify_users"`
		ActionURL string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse quote submitted event: %v", err)
		return
	}

	for _, user := range event.NotifyUsers {
		_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
			Type:         model.NotificationTypeEmail,
			Category:     model.CategoryRFQ,
			Priority:     model.NotificationPriorityNormal,
			UserID:       user.UserID,
			Email:        user.Email,
			Title:        "New Quote Received",
			Body:         event.VendorName + " has submitted a quote for " + event.ServiceType,
			TemplateName: "quote_received",
			TemplateData: map[string]any{
				"VendorName":  event.VendorName,
				"ServiceType": event.ServiceType,
				"Amount":      event.Amount,
				"Currency":    event.Currency,
				"Reference":   event.Reference,
				"ActionURL":   event.ActionURL,
			},
			EntityType: "rfq",
			EntityID:   event.RFQID,
			ActionURL:  event.ActionURL,
		})

		if err != nil {
			log.Printf("[NotificationWorker] Failed to send quote received notification: %v", err)
		}
	}
}

func (w *NotificationWorker) handleQuoteAwarded(ctx context.Context, data json.RawMessage) {
	var event struct {
		RFQID       string `json:"rfq_id"`
		Reference   string `json:"reference"`
		ServiceType string `json:"service_type"`
		VesselName  string `json:"vessel_name"`
		PortName    string `json:"port_name"`
		VendorID    string `json:"vendor_id"`
		VendorName  string `json:"vendor_name"`
		VendorEmail string `json:"vendor_email"`
		Amount      string `json:"amount"`
		Currency    string `json:"currency"`
		ActionURL   string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse quote awarded event: %v", err)
		return
	}

	_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
		Type:         model.NotificationTypeEmail,
		Category:     model.CategoryRFQ,
		Priority:     model.NotificationPriorityHigh,
		UserID:       event.VendorID,
		Email:        event.VendorEmail,
		Title:        "Your Quote Has Been Accepted",
		Body:         "Congratulations! Your quote for " + event.ServiceType + " has been accepted.",
		TemplateName: "quote_awarded",
		TemplateData: map[string]any{
			"VendorName":  event.VendorName,
			"ServiceType": event.ServiceType,
			"VesselName":  event.VesselName,
			"PortName":    event.PortName,
			"Amount":      event.Amount,
			"Currency":    event.Currency,
			"Reference":   event.Reference,
			"ActionURL":   event.ActionURL,
		},
		EntityType: "rfq",
		EntityID:   event.RFQID,
		ActionURL:  event.ActionURL,
	})

	if err != nil {
		log.Printf("[NotificationWorker] Failed to send quote awarded notification: %v", err)
	}
}

func (w *NotificationWorker) handleServiceOrderCreated(ctx context.Context, data json.RawMessage) {
	var event struct {
		ID            string `json:"id"`
		Reference     string `json:"reference"`
		ServiceType   string `json:"service_type"`
		VesselName    string `json:"vessel_name"`
		PortName      string `json:"port_name"`
		ScheduledDate string `json:"scheduled_date"`
		VendorID      string `json:"vendor_id"`
		VendorName    string `json:"vendor_name"`
		VendorEmail   string `json:"vendor_email"`
		ActionURL     string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse service order event: %v", err)
		return
	}

	_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
		Type:         model.NotificationTypeEmail,
		Category:     model.CategoryServiceOrder,
		Priority:     model.NotificationPriorityNormal,
		UserID:       event.VendorID,
		Email:        event.VendorEmail,
		Title:        "New Service Order",
		Body:         "A new service order has been created for " + event.ServiceType,
		TemplateName: "service_order_created",
		TemplateData: map[string]any{
			"VendorName":    event.VendorName,
			"ServiceType":   event.ServiceType,
			"VesselName":    event.VesselName,
			"PortName":      event.PortName,
			"ScheduledDate": event.ScheduledDate,
			"Reference":     event.Reference,
			"ActionURL":     event.ActionURL,
		},
		EntityType: "service_order",
		EntityID:   event.ID,
		ActionURL:  event.ActionURL,
	})

	if err != nil {
		log.Printf("[NotificationWorker] Failed to send service order notification: %v", err)
	}
}

func (w *NotificationWorker) handleServiceOrderCompleted(ctx context.Context, data json.RawMessage) {
	var event struct {
		ID          string `json:"id"`
		Reference   string `json:"reference"`
		ServiceType string `json:"service_type"`
		VesselName  string `json:"vessel_name"`
		VendorName  string `json:"vendor_name"`
		CompletedAt string `json:"completed_at"`
		NotifyUsers []struct {
			UserID string `json:"user_id"`
			Email  string `json:"email"`
		} `json:"notify_users"`
		ActionURL string `json:"action_url"`
	}

	if err := json.Unmarshal(data, &event); err != nil {
		log.Printf("[NotificationWorker] Failed to parse service order completed event: %v", err)
		return
	}

	for _, user := range event.NotifyUsers {
		_, err := w.notificationService.Send(ctx, &model.SendNotificationRequest{
			Type:         model.NotificationTypeEmail,
			Category:     model.CategoryServiceOrder,
			Priority:     model.NotificationPriorityNormal,
			UserID:       user.UserID,
			Email:        user.Email,
			Title:        "Service Completed",
			Body:         event.ServiceType + " for " + event.VesselName + " has been completed",
			TemplateName: "service_order_completed",
			TemplateData: map[string]any{
				"ServiceType": event.ServiceType,
				"VesselName":  event.VesselName,
				"VendorName":  event.VendorName,
				"CompletedAt": event.CompletedAt,
				"Reference":   event.Reference,
				"ActionURL":   event.ActionURL,
			},
			EntityType: "service_order",
			EntityID:   event.ID,
			ActionURL:  event.ActionURL,
		})

		if err != nil {
			log.Printf("[NotificationWorker] Failed to send service completed notification: %v", err)
		}
	}
}

func (w *NotificationWorker) handleDirectNotification(ctx context.Context, data json.RawMessage) {
	var req model.SendNotificationRequest
	if err := json.Unmarshal(data, &req); err != nil {
		log.Printf("[NotificationWorker] Failed to parse direct notification: %v", err)
		return
	}

	_, err := w.notificationService.Send(ctx, &req)
	if err != nil {
		log.Printf("[NotificationWorker] Failed to send direct notification: %v", err)
	}
}
