package repository

import (
	"fmt"

	"github.com/navo/services/notification/internal/model"
)

// TemplateRepository manages email templates
type TemplateRepository struct {
	templates map[string]*model.Template
}

// NewTemplateRepository creates a new template repository with pre-defined templates
func NewTemplateRepository() *TemplateRepository {
	repo := &TemplateRepository{
		templates: make(map[string]*model.Template),
	}
	repo.loadTemplates()
	return repo
}

// Get retrieves a template by name
func (r *TemplateRepository) Get(name string) (*model.Template, error) {
	tmpl, ok := r.templates[name]
	if !ok {
		return nil, fmt.Errorf("template not found: %s", name)
	}
	return tmpl, nil
}

// List returns all available templates
func (r *TemplateRepository) List() []*model.Template {
	templates := make([]*model.Template, 0, len(r.templates))
	for _, tmpl := range r.templates {
		templates = append(templates, tmpl)
	}
	return templates
}

// loadTemplates initializes the pre-defined templates
func (r *TemplateRepository) loadTemplates() {
	// Port Call Templates
	r.templates["port_call_created"] = &model.Template{
		Name:        "port_call_created",
		Subject:     "New Port Call Created - {{.VesselName}} at {{.PortName}}",
		Category:    model.CategoryPortCall,
		Description: "Sent when a new port call is created",
		Variables: []model.TemplateVariable{
			{Name: "VesselName", Description: "Name of the vessel", Required: true},
			{Name: "PortName", Description: "Name of the port", Required: true},
			{Name: "ETA", Description: "Expected time of arrival", Required: true},
			{Name: "Reference", Description: "Port call reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view the port call", Required: false},
		},
		HTMLBody: portCallCreatedHTML,
		TextBody: portCallCreatedText,
	}

	r.templates["port_call_status_changed"] = &model.Template{
		Name:        "port_call_status_changed",
		Subject:     "Port Call Status Update - {{.VesselName}} is now {{.NewStatus}}",
		Category:    model.CategoryPortCall,
		Description: "Sent when a port call status changes",
		Variables: []model.TemplateVariable{
			{Name: "VesselName", Description: "Name of the vessel", Required: true},
			{Name: "PortName", Description: "Name of the port", Required: true},
			{Name: "OldStatus", Description: "Previous status", Required: true},
			{Name: "NewStatus", Description: "New status", Required: true},
			{Name: "Reference", Description: "Port call reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view the port call", Required: false},
		},
		HTMLBody: portCallStatusChangedHTML,
		TextBody: portCallStatusChangedText,
	}

	// RFQ Templates
	r.templates["rfq_invitation"] = &model.Template{
		Name:        "rfq_invitation",
		Subject:     "You've been invited to quote - {{.ServiceType}} at {{.PortName}}",
		Category:    model.CategoryRFQ,
		Description: "Sent to vendors when invited to submit a quote",
		Variables: []model.TemplateVariable{
			{Name: "VendorName", Description: "Name of the vendor", Required: true},
			{Name: "ServiceType", Description: "Type of service requested", Required: true},
			{Name: "PortName", Description: "Port location", Required: true},
			{Name: "VesselName", Description: "Vessel name", Required: true},
			{Name: "Deadline", Description: "Quote submission deadline", Required: true},
			{Name: "Reference", Description: "RFQ reference number", Required: true},
			{Name: "ActionURL", Description: "Link to submit quote", Required: false},
		},
		HTMLBody: rfqInvitationHTML,
		TextBody: rfqInvitationText,
	}

	r.templates["quote_received"] = &model.Template{
		Name:        "quote_received",
		Subject:     "New Quote Received - {{.ServiceType}} from {{.VendorName}}",
		Category:    model.CategoryRFQ,
		Description: "Sent when a new quote is received for an RFQ",
		Variables: []model.TemplateVariable{
			{Name: "VendorName", Description: "Name of the vendor", Required: true},
			{Name: "ServiceType", Description: "Type of service", Required: true},
			{Name: "Amount", Description: "Quote amount", Required: true},
			{Name: "Currency", Description: "Quote currency", Required: true},
			{Name: "Reference", Description: "RFQ reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view quote", Required: false},
		},
		HTMLBody: quoteReceivedHTML,
		TextBody: quoteReceivedText,
	}

	r.templates["quote_awarded"] = &model.Template{
		Name:        "quote_awarded",
		Subject:     "Congratulations! Your quote has been accepted - {{.Reference}}",
		Category:    model.CategoryRFQ,
		Description: "Sent to vendor when their quote is accepted",
		Variables: []model.TemplateVariable{
			{Name: "VendorName", Description: "Name of the vendor", Required: true},
			{Name: "ServiceType", Description: "Type of service", Required: true},
			{Name: "VesselName", Description: "Vessel name", Required: true},
			{Name: "PortName", Description: "Port location", Required: true},
			{Name: "Amount", Description: "Awarded amount", Required: true},
			{Name: "Currency", Description: "Currency", Required: true},
			{Name: "Reference", Description: "RFQ reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view order", Required: false},
		},
		HTMLBody: quoteAwardedHTML,
		TextBody: quoteAwardedText,
	}

	// Service Order Templates
	r.templates["service_order_created"] = &model.Template{
		Name:        "service_order_created",
		Subject:     "New Service Order - {{.ServiceType}} for {{.VesselName}}",
		Category:    model.CategoryServiceOrder,
		Description: "Sent when a new service order is created",
		Variables: []model.TemplateVariable{
			{Name: "VendorName", Description: "Vendor name", Required: true},
			{Name: "ServiceType", Description: "Type of service", Required: true},
			{Name: "VesselName", Description: "Vessel name", Required: true},
			{Name: "PortName", Description: "Port location", Required: true},
			{Name: "ScheduledDate", Description: "Scheduled date", Required: true},
			{Name: "Reference", Description: "Order reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view order", Required: false},
		},
		HTMLBody: serviceOrderCreatedHTML,
		TextBody: serviceOrderCreatedText,
	}

	r.templates["service_order_completed"] = &model.Template{
		Name:        "service_order_completed",
		Subject:     "Service Completed - {{.ServiceType}} for {{.VesselName}}",
		Category:    model.CategoryServiceOrder,
		Description: "Sent when a service order is marked as completed",
		Variables: []model.TemplateVariable{
			{Name: "ServiceType", Description: "Type of service", Required: true},
			{Name: "VesselName", Description: "Vessel name", Required: true},
			{Name: "VendorName", Description: "Vendor who completed service", Required: true},
			{Name: "CompletedAt", Description: "Completion time", Required: true},
			{Name: "Reference", Description: "Order reference number", Required: true},
			{Name: "ActionURL", Description: "Link to view order", Required: false},
		},
		HTMLBody: serviceOrderCompletedHTML,
		TextBody: serviceOrderCompletedText,
	}

	// Approval Templates
	r.templates["approval_requested"] = &model.Template{
		Name:        "approval_requested",
		Subject:     "Approval Required - {{.ItemType}} {{.Reference}}",
		Category:    model.CategoryApproval,
		Description: "Sent when an approval is requested",
		Variables: []model.TemplateVariable{
			{Name: "ApproverName", Description: "Name of the approver", Required: true},
			{Name: "RequesterName", Description: "Name of the requester", Required: true},
			{Name: "ItemType", Description: "Type of item requiring approval", Required: true},
			{Name: "Description", Description: "Description of the request", Required: true},
			{Name: "Reference", Description: "Reference number", Required: true},
			{Name: "ActionURL", Description: "Link to approve/reject", Required: false},
		},
		HTMLBody: approvalRequestedHTML,
		TextBody: approvalRequestedText,
	}

	// Vessel Alert Templates
	r.templates["vessel_arrival_alert"] = &model.Template{
		Name:        "vessel_arrival_alert",
		Subject:     "Vessel Arrival Alert - {{.VesselName}} approaching {{.PortName}}",
		Category:    model.CategoryVessel,
		Description: "Sent when a vessel is approaching a port",
		Variables: []model.TemplateVariable{
			{Name: "VesselName", Description: "Name of the vessel", Required: true},
			{Name: "PortName", Description: "Port name", Required: true},
			{Name: "ETA", Description: "Estimated time of arrival", Required: true},
			{Name: "Distance", Description: "Distance to port", Required: true},
			{Name: "ActionURL", Description: "Link to track vessel", Required: false},
		},
		HTMLBody: vesselArrivalAlertHTML,
		TextBody: vesselArrivalAlertText,
	}
}

// Template HTML/Text content
const portCallCreatedHTML = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">New Port Call Created</h2>
							<p style="color: #475569; margin: 0 0 24px 0; line-height: 1.6;">A new port call has been created and requires your attention.</p>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
								<tr>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Vessel</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.VesselName}}</p>
									</td>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Port</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.PortName}}</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">ETA</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.ETA}}</p>
									</td>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Reference</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.Reference}}</p>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Port Call</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">
								&copy; {{.Year}} Navo Maritime. All rights reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const portCallCreatedText = `New Port Call Created

A new port call has been created:

Vessel: {{.VesselName}}
Port: {{.PortName}}
ETA: {{.ETA}}
Reference: {{.Reference}}

{{if .ActionURL}}View details: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const portCallStatusChangedHTML = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 16px 0;">Port Call Status Update</h2>
							<p style="color: #475569; margin: 0 0 24px 0;">The status of a port call has been updated.</p>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
								<tr>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px;">VESSEL</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.VesselName}}</p>
									</td>
									<td style="padding: 8px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px;">PORT</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.PortName}}</p>
									</td>
								</tr>
								<tr>
									<td colspan="2" style="padding: 16px;">
										<div style="display: flex; align-items: center; justify-content: center;">
											<span style="background-color: #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 4px;">{{.OldStatus}}</span>
											<span style="margin: 0 12px; color: #94a3b8;">&rarr;</span>
											<span style="background-color: #22c55e; color: #ffffff; padding: 8px 16px; border-radius: 4px;">{{.NewStatus}}</span>
										</div>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Port Call</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const portCallStatusChangedText = `Port Call Status Update

The status of port call {{.Reference}} has changed:

Vessel: {{.VesselName}}
Port: {{.PortName}}
Status: {{.OldStatus}} → {{.NewStatus}}

{{if .ActionURL}}View details: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const rfqInvitationHTML = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 8px 0;">You've Been Invited to Quote</h2>
							<p style="color: #475569; margin: 0 0 24px 0;">Hello {{.VendorName}}, you have been invited to submit a quote for the following service request.</p>

							<table width="100%" style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
								<tr>
									<td>
										<p style="margin: 0; color: #92400e; font-weight: 600;">Deadline: {{.Deadline}}</p>
									</td>
								</tr>
							</table>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px;">
								<tr>
									<td style="padding: 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px;">SERVICE TYPE</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600; font-size: 18px;">{{.ServiceType}}</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 0 16px 16px 16px;">
										<table width="100%">
											<tr>
												<td style="width: 50%;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">VESSEL</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.VesselName}}</p>
												</td>
												<td style="width: 50%;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">PORT</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.PortName}}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								<tr>
									<td style="padding: 0 16px 16px 16px;">
										<p style="margin: 0; color: #64748b; font-size: 12px;">REFERENCE</p>
										<p style="margin: 4px 0 0 0; color: #0f172a;">{{.Reference}}</p>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Submit Your Quote</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const rfqInvitationText = `You've Been Invited to Quote

Hello {{.VendorName}},

You have been invited to submit a quote for the following service request:

Service: {{.ServiceType}}
Vessel: {{.VesselName}}
Port: {{.PortName}}
Reference: {{.Reference}}
Deadline: {{.Deadline}}

{{if .ActionURL}}Submit your quote: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const quoteReceivedHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 16px 0;">New Quote Received</h2>
							<p style="color: #475569; margin: 0 0 24px 0;">A new quote has been submitted for RFQ {{.Reference}}.</p>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
								<tr>
									<td>
										<p style="margin: 0; color: #64748b; font-size: 12px;">VENDOR</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a; font-weight: 600;">{{.VendorName}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">SERVICE</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a;">{{.ServiceType}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">QUOTED AMOUNT</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600; font-size: 24px;">{{.Currency}} {{.Amount}}</p>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Quote</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const quoteReceivedText = `New Quote Received

A new quote has been submitted for RFQ {{.Reference}}:

Vendor: {{.VendorName}}
Service: {{.ServiceType}}
Amount: {{.Currency}} {{.Amount}}

{{if .ActionURL}}View quote: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const quoteAwardedHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: center;">
							<h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px;">Congratulations!</h1>
							<p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your quote has been accepted</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<p style="color: #475569; margin: 0 0 24px 0;">Hello {{.VendorName}}, we're pleased to inform you that your quote for {{.ServiceType}} has been accepted.</p>

							<table width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
								<tr>
									<td>
										<table width="100%">
											<tr>
												<td style="width: 50%; padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">VESSEL</p>
													<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.VesselName}}</p>
												</td>
												<td style="width: 50%; padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">PORT</p>
													<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.PortName}}</p>
												</td>
											</tr>
											<tr>
												<td style="padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">SERVICE</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.ServiceType}}</p>
												</td>
												<td style="padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">AWARDED AMOUNT</p>
													<p style="margin: 4px 0 0 0; color: #16a34a; font-weight: 600; font-size: 20px;">{{.Currency}} {{.Amount}}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Service Order</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const quoteAwardedText = `Congratulations! Your Quote Has Been Accepted

Hello {{.VendorName}},

We're pleased to inform you that your quote has been accepted:

Reference: {{.Reference}}
Service: {{.ServiceType}}
Vessel: {{.VesselName}}
Port: {{.PortName}}
Awarded Amount: {{.Currency}} {{.Amount}}

{{if .ActionURL}}View service order: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const serviceOrderCreatedHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<h2 style="color: #0f172a; margin: 0 0 16px 0;">New Service Order</h2>
							<p style="color: #475569; margin: 0 0 24px 0;">A new service order has been created and assigned to you.</p>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
								<tr>
									<td style="padding: 8px;">
										<p style="margin: 0; color: #64748b; font-size: 12px;">SERVICE</p>
										<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600; font-size: 18px;">{{.ServiceType}}</p>
									</td>
								</tr>
								<tr>
									<td>
										<table width="100%">
											<tr>
												<td style="width: 50%; padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">VESSEL</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.VesselName}}</p>
												</td>
												<td style="width: 50%; padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">PORT</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.PortName}}</p>
												</td>
											</tr>
											<tr>
												<td style="padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">SCHEDULED</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.ScheduledDate}}</p>
												</td>
												<td style="padding: 8px;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">REFERENCE</p>
													<p style="margin: 4px 0 0 0; color: #0f172a;">{{.Reference}}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Order</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const serviceOrderCreatedText = `New Service Order

A new service order has been created:

Service: {{.ServiceType}}
Vessel: {{.VesselName}}
Port: {{.PortName}}
Scheduled: {{.ScheduledDate}}
Reference: {{.Reference}}

{{if .ActionURL}}View order: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const serviceOrderCompletedHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #22c55e; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
							<h1 style="color: #ffffff; margin: 0;">Service Completed</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<p style="color: #475569; margin: 0 0 24px 0;">The following service has been marked as completed.</p>

							<table width="100%" style="background-color: #f0fdf4; border-radius: 8px; padding: 16px;">
								<tr>
									<td>
										<p style="margin: 0; color: #64748b; font-size: 12px;">SERVICE</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a; font-weight: 600;">{{.ServiceType}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">VESSEL</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a;">{{.VesselName}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">COMPLETED BY</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a;">{{.VendorName}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">COMPLETION TIME</p>
										<p style="margin: 4px 0 0 0; color: #0f172a;">{{.CompletedAt}}</p>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Details</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const serviceOrderCompletedText = `Service Completed

The following service has been completed:

Service: {{.ServiceType}}
Vessel: {{.VesselName}}
Completed By: {{.VendorName}}
Completion Time: {{.CompletedAt}}
Reference: {{.Reference}}

{{if .ActionURL}}View details: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const approvalRequestedHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
							<h1 style="color: #ffffff; margin: 0;">Navo Maritime</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
								<p style="margin: 0; color: #92400e; font-weight: 600;">Approval Required</p>
							</div>

							<p style="color: #475569; margin: 0 0 24px 0;">Hello {{.ApproverName}}, {{.RequesterName}} has submitted a request that requires your approval.</p>

							<table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
								<tr>
									<td>
										<p style="margin: 0; color: #64748b; font-size: 12px;">TYPE</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a; font-weight: 600;">{{.ItemType}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">DESCRIPTION</p>
										<p style="margin: 4px 0 16px 0; color: #0f172a;">{{.Description}}</p>
										<p style="margin: 0; color: #64748b; font-size: 12px;">REFERENCE</p>
										<p style="margin: 4px 0 0 0; color: #0f172a;">{{.Reference}}</p>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">Review Request</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const approvalRequestedText = `Approval Required

Hello {{.ApproverName}},

{{.RequesterName}} has submitted a request that requires your approval:

Type: {{.ItemType}}
Description: {{.Description}}
Reference: {{.Reference}}

{{if .ActionURL}}Review request: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`

const vesselArrivalAlertHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
	<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="background-color: #3b82f6; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
							<h1 style="color: #ffffff; margin: 0;">Vessel Arrival Alert</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 32px 24px;">
							<p style="color: #475569; margin: 0 0 24px 0;">A vessel in your fleet is approaching port.</p>

							<table width="100%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
								<tr>
									<td>
										<p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 20px;">{{.VesselName}}</p>
										<p style="margin: 8px 0 0 0; color: #475569;">Approaching {{.PortName}}</p>
									</td>
								</tr>
								<tr>
									<td style="padding-top: 16px;">
										<table width="100%">
											<tr>
												<td style="width: 50%;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">ETA</p>
													<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.ETA}}</p>
												</td>
												<td style="width: 50%;">
													<p style="margin: 0; color: #64748b; font-size: 12px;">DISTANCE</p>
													<p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">{{.Distance}}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>

							{{if .ActionURL}}
							<table width="100%" style="margin-top: 24px;">
								<tr>
									<td align="center">
										<a href="{{.ActionURL}}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Vessel</a>
									</td>
								</tr>
							</table>
							{{end}}
						</td>
					</tr>
					<tr>
						<td style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
							<p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">&copy; {{.Year}} Navo Maritime</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

const vesselArrivalAlertText = `Vessel Arrival Alert

A vessel in your fleet is approaching port:

Vessel: {{.VesselName}}
Port: {{.PortName}}
ETA: {{.ETA}}
Distance: {{.Distance}}

{{if .ActionURL}}Track vessel: {{.ActionURL}}{{end}}

---
Navo Maritime Platform`
