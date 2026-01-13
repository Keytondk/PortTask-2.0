/**
 * PDF Export Utility
 * Uses jsPDF for client-side PDF generation
 */

import jsPDF from 'jspdf';

export interface ReportData {
  title: string;
  dateRange: string;
  generatedAt: Date;
  metrics: {
    totalPortCalls: number;
    portCallsChange: number;
    avgTurnaroundTime: number;
    turnaroundChange: number;
    totalServiceCost: number;
    costChange: number;
    onTimeArrival: number;
    onTimeChange: number;
  };
  portCallsByPort: Array<{ port: string; count: number; percentage: number }>;
  serviceBreakdown: Array<{
    service: string;
    amount: number;
    percentage: number;
  }>;
  vesselPerformance: Array<{
    vessel: string;
    portCalls: number;
    avgTurnaround: number;
    onTime: number;
  }>;
}

export async function exportReportPDF(data: ReportData): Promise<void> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper functions
  const addText = (
    text: string,
    x: number,
    fontSize = 12,
    style: 'normal' | 'bold' = 'normal'
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', style);
    pdf.text(text, x, y);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Navo Maritime', margin, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Fleet Performance Report', margin, 33);

  // Reset text color
  pdf.setTextColor(0, 0, 0);
  y = 55;

  // Title and meta
  addText(data.title, margin, 18, 'bold');
  y += 8;
  pdf.setTextColor(100, 116, 139);
  addText(`Date Range: ${data.dateRange}`, margin, 10);
  y += 5;
  addText(`Generated: ${formatDate(data.generatedAt)}`, margin, 10);
  y += 15;

  // Key Metrics Section
  pdf.setTextColor(0, 0, 0);
  addText('Key Performance Metrics', margin, 14, 'bold');
  y += 10;

  // Draw metrics boxes
  const boxWidth = (pageWidth - margin * 2 - 30) / 4;
  const metrics = [
    {
      label: 'Total Port Calls',
      value: data.metrics.totalPortCalls.toString(),
      change: `${data.metrics.portCallsChange >= 0 ? '+' : ''}${data.metrics.portCallsChange}%`,
    },
    {
      label: 'Avg Turnaround',
      value: `${data.metrics.avgTurnaroundTime}d`,
      change: `${data.metrics.turnaroundChange >= 0 ? '+' : ''}${data.metrics.turnaroundChange}d`,
    },
    {
      label: 'Service Costs',
      value: `$${(data.metrics.totalServiceCost / 1000000).toFixed(2)}M`,
      change: `${data.metrics.costChange >= 0 ? '+' : ''}${data.metrics.costChange}%`,
    },
    {
      label: 'On-Time Arrival',
      value: `${data.metrics.onTimeArrival}%`,
      change: `${data.metrics.onTimeChange >= 0 ? '+' : ''}${data.metrics.onTimeChange}%`,
    },
  ];

  metrics.forEach((metric, i) => {
    const x = margin + i * (boxWidth + 10);

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x, y, boxWidth, 30, 3, 3, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(metric.label.toUpperCase(), x + 5, y + 8);

    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metric.value, x + 5, y + 20);

    pdf.setFontSize(8);
    pdf.setTextColor(
      metric.change.startsWith('-') ? 239 : 34,
      metric.change.startsWith('-') ? 68 : 197,
      metric.change.startsWith('-') ? 68 : 94
    );
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.change, x + 5, y + 27);
  });

  y += 45;

  // Port Calls by Location
  pdf.setTextColor(0, 0, 0);
  addText('Port Calls by Location', margin, 14, 'bold');
  y += 10;

  data.portCallsByPort.forEach((item) => {
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(item.port, margin, y);
    pdf.text(`${item.count} calls (${item.percentage}%)`, pageWidth - margin - 50, y);

    y += 4;
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 4, 2, 2, 'F');

    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(
      margin,
      y,
      ((pageWidth - margin * 2) * item.percentage) / 100,
      4,
      2,
      2,
      'F'
    );

    y += 10;
  });

  y += 10;

  // Service Cost Breakdown
  addText('Service Cost Breakdown', margin, 14, 'bold');
  y += 10;

  data.serviceBreakdown.forEach((item) => {
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(item.service, margin, y);
    pdf.text(formatCurrency(item.amount), pageWidth - margin - 50, y);

    y += 4;
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 4, 2, 2, 'F');

    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(
      margin,
      y,
      ((pageWidth - margin * 2) * item.percentage) / 100,
      4,
      2,
      2,
      'F'
    );

    y += 10;
  });

  // New page for vessel performance
  pdf.addPage();
  y = 30;

  addText('Vessel Performance', margin, 14, 'bold');
  y += 10;

  // Table header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, pageWidth - margin * 2, 10, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VESSEL', margin + 5, y + 7);
  pdf.text('PORT CALLS', margin + 80, y + 7);
  pdf.text('AVG TURNAROUND', margin + 110, y + 7);
  pdf.text('ON-TIME %', margin + 150, y + 7);

  y += 15;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  data.vesselPerformance.forEach((vessel) => {
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.text(vessel.vessel, margin + 5, y);
    pdf.text(vessel.portCalls.toString(), margin + 85, y);
    pdf.text(`${vessel.avgTurnaround} days`, margin + 115, y);

    // On-time badge
    const onTimeColor =
      vessel.onTime >= 95
        ? { r: 34, g: 197, b: 94 }
        : vessel.onTime >= 85
          ? { r: 245, g: 158, b: 11 }
          : { r: 239, g: 68, b: 68 };

    pdf.setTextColor(onTimeColor.r, onTimeColor.g, onTimeColor.b);
    pdf.text(`${vessel.onTime}%`, margin + 155, y);

    y += 10;

    // Divider line
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  // Footer
  y = pdf.internal.pageSize.getHeight() - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `© ${new Date().getFullYear()} Navo Maritime. All rights reserved.`,
    margin,
    y
  );
  pdf.text(`Page 2 of 2`, pageWidth - margin - 20, y);

  // Add page number to first page
  pdf.setPage(1);
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `© ${new Date().getFullYear()} Navo Maritime. All rights reserved.`,
    margin,
    pdf.internal.pageSize.getHeight() - 10
  );
  pdf.text(
    `Page 1 of 2`,
    pageWidth - margin - 20,
    pdf.internal.pageSize.getHeight() - 10
  );

  // Download
  const filename = `navo-fleet-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

export function exportPortCallPDF(portCall: {
  reference: string;
  vessel: { name: string; imo: string; flag: string; type: string };
  port: { name: string; country: string; terminal: string };
  eta: string;
  etd: string;
  ata: string | null;
  atd: string | null;
  status: string;
  services: Array<{
    type: string;
    status: string;
    vendor: string | null;
    cost: number | null;
  }>;
}): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 35, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Navo Maritime', margin, 22);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Port Call Details', margin, 30);

  pdf.setTextColor(0, 0, 0);
  y = 50;

  // Port Call Reference
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(portCall.reference, margin, y);

  // Status badge
  pdf.setFontSize(10);
  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    planned: { r: 59, g: 130, b: 246 },
    confirmed: { r: 139, g: 92, b: 246 },
    arrived: { r: 34, g: 197, b: 94 },
    alongside: { r: 245, g: 158, b: 11 },
    departed: { r: 107, g: 114, b: 128 },
    completed: { r: 34, g: 197, b: 94 },
  };
  const statusColor = statusColors[portCall.status] || { r: 107, g: 114, b: 128 };
  pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
  pdf.text(
    portCall.status.charAt(0).toUpperCase() + portCall.status.slice(1),
    pageWidth - margin - 30,
    y
  );

  y += 20;

  // Vessel Information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vessel Information', margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const vesselInfo = [
    { label: 'Name', value: portCall.vessel.name },
    { label: 'IMO', value: portCall.vessel.imo },
    { label: 'Flag', value: portCall.vessel.flag },
    { label: 'Type', value: portCall.vessel.type },
  ];

  vesselInfo.forEach((info) => {
    pdf.setTextColor(100, 116, 139);
    pdf.text(info.label, margin, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(info.value, margin + 40, y);
    y += 7;
  });

  y += 10;

  // Port Information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Port Information', margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const portInfo = [
    { label: 'Port', value: portCall.port.name },
    { label: 'Country', value: portCall.port.country },
    { label: 'Terminal', value: portCall.port.terminal || 'N/A' },
  ];

  portInfo.forEach((info) => {
    pdf.setTextColor(100, 116, 139);
    pdf.text(info.label, margin, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(info.value, margin + 40, y);
    y += 7;
  });

  y += 10;

  // Schedule
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Schedule', margin, y);
  y += 10;

  const scheduleInfo = [
    { label: 'ETA', value: portCall.eta || 'N/A' },
    { label: 'ATA', value: portCall.ata || 'N/A' },
    { label: 'ETD', value: portCall.etd || 'N/A' },
    { label: 'ATD', value: portCall.atd || 'N/A' },
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  scheduleInfo.forEach((info) => {
    pdf.setTextColor(100, 116, 139);
    pdf.text(info.label, margin, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(info.value, margin + 30, y);
    y += 7;
  });

  y += 10;

  // Services
  if (portCall.services.length > 0) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Services', margin, y);
    y += 10;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('SERVICE', margin + 5, y + 6);
    pdf.text('STATUS', margin + 60, y + 6);
    pdf.text('VENDOR', margin + 100, y + 6);
    pdf.text('COST', pageWidth - margin - 30, y + 6);

    y += 12;

    pdf.setFont('helvetica', 'normal');
    portCall.services.forEach((service) => {
      pdf.setTextColor(15, 23, 42);
      pdf.text(service.type, margin + 5, y);
      pdf.text(service.status, margin + 60, y);
      pdf.text(service.vendor || 'TBD', margin + 100, y);
      pdf.text(
        service.cost ? `$${service.cost.toLocaleString()}` : '-',
        pageWidth - margin - 30,
        y
      );
      y += 8;
    });

    // Total
    y += 5;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const totalCost = portCall.services.reduce((sum, s) => sum + (s.cost || 0), 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total', margin + 5, y);
    pdf.text(`$${totalCost.toLocaleString()}`, pageWidth - margin - 30, y);
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    margin,
    pdf.internal.pageSize.getHeight() - 10
  );
  pdf.text(
    `© ${new Date().getFullYear()} Navo Maritime`,
    pageWidth - margin - 50,
    pdf.internal.pageSize.getHeight() - 10
  );

  // Download
  pdf.save(`port-call-${portCall.reference}.pdf`);
}
