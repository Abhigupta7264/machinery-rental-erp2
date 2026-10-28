import io
from decimal import Decimal
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from apps.common.models import CompanySettings

def generate_logsheet_pdf(logsheet) -> io.BytesIO:
    """
    Generates a high-quality, pixel-perfect A4 Machinery Daily Logsheet PDF
    using ReportLab Flowables.
    """
    buffer = io.BytesIO()
    
    # 15mm margins on A4 (595.27 x 841.89 pt)
    # Printable width = 595.27 - (2 * 15 * 2.83465) ~= 510 pt
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=f"Logsheet_{logsheet.logsheet_number}",
        author="Machinery ERP System"
    )

    styles = getSampleStyleSheet()
    
    # Custom typography styles
    style_company = ParagraphStyle(
        'CompanyHeading',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e3a63'),
        alignment=1 # Center
    )
    style_sub = ParagraphStyle(
        'CompanySub',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#475569'),
        alignment=1 # Center
    )
    style_doc_title = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    style_section_hdr = ParagraphStyle(
        'SectionHdr',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e3a63')
    )
    style_label = ParagraphStyle(
        'CellLabel',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#334155')
    )
    style_val = ParagraphStyle(
        'CellVal',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a')
    )
    style_val_bold = ParagraphStyle(
        'CellValBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )
    style_center = ParagraphStyle(
        'CenterText',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    style_footer = ParagraphStyle(
        'FooterText',
        fontName='Helvetica',
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )

    company = CompanySettings.get_settings()
    elements = []

    # 1. Company Header Block
    elements.append(Paragraph(company.company_name.upper(), style_company))
    elements.append(Spacer(1, 1 * mm))
    tagline_text = f"{company.tagline} | {company.registration_no} | GSTIN: {company.gstin}"
    elements.append(Paragraph(tagline_text, style_sub))
    contact_text = f"Regd Office: {company.registered_address} | Phone: {company.phone} | Email: {company.email}"
    elements.append(Paragraph(contact_text, style_sub))
    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e3a63'), spaceAfter=4))

    # 2. Document Title & Document Meta Strip
    status_color = '#15803d' if logsheet.status == 'APPROVED' else ('#b91c1c' if logsheet.status == 'REJECTED' else '#0369a1')
    meta_data = [
        [
            Paragraph("<b>MACHINERY DAILY WORK LOGSHEET</b>", style_doc_title),
            Paragraph(f"<b>STATUS:</b> <font color='{status_color}'><b>{logsheet.get_status_display().upper()}</b></font>", style_val_bold)
        ],
        [
            Paragraph(f"<b>LOGSHEET NO:</b> <font color='#1e3a63'><b>{logsheet.logsheet_number}</b></font>", style_val_bold),
            Paragraph(f"<b>DATE:</b> {logsheet.date.strftime('%d-%b-%Y')} &nbsp;&nbsp;|&nbsp;&nbsp; <b>SHIFT:</b> {logsheet.get_shift_display()}", style_val)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[280, 230])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 3 * mm))

    # 3. Two-Column Information: Machine Details & Site / Client Details
    machine = logsheet.machine
    customer = logsheet.customer
    project = logsheet.project
    site = logsheet.site
    operator = logsheet.operator

    info_data = [
        [
            Paragraph("<b>1. MACHINERY & OPERATOR DETAILS</b>", style_section_hdr),
            Paragraph("<b>2. CLIENT & SITE DEPLOYMENT DETAILS</b>", style_section_hdr)
        ],
        [
            Paragraph(f"<b>Machine ID:</b> {machine.asset_code}<br/>"
                      f"<b>Machine Name:</b> {machine.name}<br/>"
                      f"<b>Make & Model:</b> {machine.make_model}<br/>"
                      f"<b>Reg / Serial:</b> {machine.registration_number or 'N/A'} / {machine.serial_number or 'N/A'}<br/>"
                      f"<b>Category:</b> {machine.category.name}<br/>"
                      f"<b>Assigned Operator:</b> {operator.name} (ID: {operator.employee_id})<br/>"
                      f"<b>Operator Mobile:</b> {operator.phone} | Lic: {operator.license_number or 'N/A'}", style_val),
            Paragraph(f"<b>Customer / Client:</b> {customer.name} ({customer.code})<br/>"
                      f"<b>Project:</b> {project.name}<br/>"
                      f"<b>Site Location:</b> {site.name} - {site.location}<br/>"
                      f"<b>Site Incharge:</b> {site.site_incharge or 'N/A'} (Ph: {site.site_contact or 'N/A'})<br/>"
                      f"<b>Contract Ref:</b> {logsheet.rental_contract.contract_number if logsheet.rental_contract else 'Standard Rental Order'}<br/>"
                      f"<b>Client Supervisor:</b> {logsheet.customer_rep_name or 'N/A'}<br/>"
                      f"<b>Company Supervisor:</b> {logsheet.supervisor.get_full_name() if logsheet.supervisor else 'Assigned In-charge'}", style_val)
        ]
    ]
    info_table = Table(info_data, colWidths=[255, 255])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 3 * mm))

    # 4. Working Hours & Meter Reading Table
    open_mtr = f"{logsheet.opening_meter:.2f}"
    close_mtr = f"{logsheet.closing_meter:.2f}"
    run_hrs = f"{logsheet.working_hours:.2f}"
    idle_hrs = f"{logsheet.idle_hours:.2f}"
    brk_hrs = f"{logsheet.breakdown_hours:.2f}"
    ot_hrs = f"{logsheet.overtime_hours:.2f}"
    
    start_t = logsheet.start_time.strftime('%H:%M') if logsheet.start_time else '--:--'
    end_t = logsheet.end_time.strftime('%H:%M') if logsheet.end_time else '--:--'

    hours_data = [
        [
            Paragraph("<b>3. WORKING HOURS & HOUR-METER RECORD (HMR)</b>", style_section_hdr),
            "", "", "", "", ""
        ],
        [
            Paragraph("<b>Opening Meter (HMR)</b>", style_center),
            Paragraph("<b>Closing Meter (HMR)</b>", style_center),
            Paragraph("<b>Net Run Hours</b>", style_center),
            Paragraph("<b>Idle Hours</b>", style_center),
            Paragraph("<b>Breakdown Hrs</b>", style_center),
            Paragraph("<b>Overtime Hrs</b>", style_center),
        ],
        [
            Paragraph(f"<b>{open_mtr}</b>", style_center),
            Paragraph(f"<b>{close_mtr}</b>", style_center),
            Paragraph(f"<b><font color='#1e3a63' size='9'>{run_hrs} Hrs</font></b>", style_center),
            Paragraph(f"{idle_hrs} Hrs", style_center),
            Paragraph(f"{brk_hrs} Hrs", style_center),
            Paragraph(f"{ot_hrs} Hrs", style_center),
        ],
        [
            Paragraph(f"<b>Time Window:</b> {start_t} to {end_t}", style_val),
            "",
            Paragraph("<b>Total Effective Billed:</b>", style_label),
            Paragraph(f"<b>{run_hrs} Working Hours</b>", style_val_bold),
            Paragraph("<b>Equip Condition:</b>", style_label),
            Paragraph(logsheet.get_equipment_condition_display(), style_val)
        ]
    ]
    hours_table = Table(hours_data, colWidths=[85, 85, 85, 85, 85, 85])
    hours_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f1f5f9')),
        ('BACKGROUND', (2, 2), (2, 2), colors.HexColor('#eff6ff')),
        ('SPAN', (0, 3), (1, 3)),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(hours_table)
    elements.append(Spacer(1, 3 * mm))

    # 5. Diesel & Fuel Details
    open_fuel = f"{logsheet.opening_fuel_litres:.1f} L" if logsheet.opening_fuel_litres is not None else "--"
    rec_fuel = f"{logsheet.diesel_received_litres:.1f} L" if logsheet.diesel_received_litres else "0.0 L"
    cons_fuel = f"{logsheet.diesel_consumed_litres:.1f} L" if logsheet.diesel_consumed_litres else "0.0 L"
    close_fuel = f"{logsheet.closing_fuel_litres:.1f} L" if logsheet.closing_fuel_litres is not None else "--"
    
    # Calculate fuel burn rate (Litres per run hour)
    burn_rate_str = "--"
    if logsheet.working_hours and logsheet.working_hours > 0 and logsheet.diesel_consumed_litres > 0:
        burn_rate = float(logsheet.diesel_consumed_litres) / float(logsheet.working_hours)
        burn_rate_str = f"{burn_rate:.2f} Litres / Hr"

    fuel_data = [
        [
            Paragraph("<b>4. DIESEL / FUEL CONSUMPTION RECORD</b>", style_section_hdr),
            "", "", "", ""
        ],
        [
            Paragraph("<b>Opening Fuel Level</b>", style_center),
            Paragraph("<b>Diesel Filled / Issued</b>", style_center),
            Paragraph("<b>Diesel Consumed</b>", style_center),
            Paragraph("<b>Closing Fuel Level</b>", style_center),
            Paragraph("<b>Consumption Rate</b>", style_center),
        ],
        [
            Paragraph(open_fuel, style_center),
            Paragraph(f"<b>{rec_fuel}</b>", style_center),
            Paragraph(f"<b><font color='#b45309'>{cons_fuel}</font></b>", style_center),
            Paragraph(close_fuel, style_center),
            Paragraph(burn_rate_str, style_center),
        ],
        [
            Paragraph(f"<b>Fuel / Slip Remarks:</b> {logsheet.fuel_remarks or 'No slip voucher attached'}", style_val),
            "", "", "", ""
        ]
    ]
    fuel_table = Table(fuel_data, colWidths=[102, 102, 102, 102, 102])
    fuel_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#fef3c7')),
        ('SPAN', (0, 3), (-1, 3)),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(fuel_table)
    elements.append(Spacer(1, 3 * mm))

    # 6. Operational Work Description, Breakdown & Remarks
    ops_data = [
        [
            Paragraph("<b>5. WORK DESCRIPTION & OPERATIONAL NOTES</b>", style_section_hdr)
        ],
        [
            Paragraph(f"<b>Work Carried Out:</b><br/>{logsheet.work_description or 'Regular site operations.'}", style_val)
        ],
        [
            Paragraph(f"<b>Breakdown / Idle Details:</b> {logsheet.breakdown_details or 'No breakdown logged.'} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Remarks:</b> {logsheet.remarks or 'Operations completed normally.'}", style_val)
        ]
    ]
    ops_table = Table(ops_data, colWidths=[510])
    ops_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(ops_table)
    elements.append(Spacer(1, 3 * mm))

    # 7. Tri-Party Sign-Off & Verification Blocks
    prep_by = logsheet.prepared_by.get_full_name() if logsheet.prepared_by else (logsheet.prepared_by.username if logsheet.prepared_by else "System")
    appr_by = logsheet.approved_by.get_full_name() if logsheet.approved_by else (logsheet.approved_by.username if logsheet.approved_by else "--")
    appr_date = logsheet.approved_at.strftime('%d-%b-%Y %H:%M') if logsheet.approved_at else "--"
    cust_rep = logsheet.customer_rep_name or "Client Site Representative"

    sign_data = [
        [
            Paragraph("<b>OPERATOR SIGNATURE</b>", style_center),
            Paragraph("<b>SITE SUPERVISOR APPROVAL</b>", style_center),
            Paragraph("<b>CUSTOMER / CLIENT SIGN-OFF</b>", style_center)
        ],
        [
            Paragraph("<br/><br/>_______________________<br/>"
                      f"<b>Operator:</b> {operator.name}<br/>"
                      f"<b>Date:</b> {logsheet.date.strftime('%d-%b-%Y')}", style_center),
            Paragraph("<br/><br/>_______________________<br/>"
                      f"<b>Approved By:</b> {appr_by}<br/>"
                      f"<b>Date & Time:</b> {appr_date}", style_center),
            Paragraph("<br/><br/>_______________________<br/>"
                      f"<b>Client Rep:</b> {cust_rep}<br/>"
                      f"<b>Status:</b> {'Acknowledged' if logsheet.customer_signature_confirmed else 'Pending Sign'}", style_center)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[170, 170, 170])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(KeepTogether([sign_table]))
    elements.append(Spacer(1, 3 * mm))

    # 8. Security & System Audit Footer
    now_str = timezone.now().strftime('%d-%b-%Y %I:%M:%S %p IST')
    doc_hash = f"SYS-AUTH-REF-{logsheet.id.hex[:12].upper()}"
    footer_text = f"Official Machinery ERP Digital Logsheet &bull; Document Reference: {doc_hash} &bull; Generated: {now_str} &bull; Prepared by: {prep_by}"
    elements.append(Paragraph(footer_text, style_footer))

    doc.build(elements)
    buffer.seek(0)
    return buffer

