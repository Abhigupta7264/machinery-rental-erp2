from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.models import User, UserAuthToken
from apps.common.models import CompanySettings, AuditLog
from apps.fleet.models import Machine, MachineCategory
from apps.customers.models import Customer, Project, Site
from apps.operators.models import Operator
from apps.rentals.models import RentalContract
from apps.logsheets.models import Logsheet, LogsheetAudit
from apps.fuel.models import FuelRecord
from apps.maintenance.models import MaintenanceRecord
from apps.billing.models import Invoice, InvoiceItem

class Command(BaseCommand):
    help = 'Seeds initial demonstration data for Machinery Rental & Operations ERP'

    def handle(self, *args, **options):
        self.stdout.write("Initializing company settings...")
        company = CompanySettings.get_settings()
        company.save()

        self.stdout.write("Creating demonstration users with roles...")
        users_info = [
            ('admin', 'admin@infra-equip.com', 'AdminPassword123!', 'Vikram', 'Malhotra', User.Role.ADMINISTRATOR, 'EMP-001'),
            ('ops_manager', 'ops@infra-equip.com', 'OpsPassword123!', 'Rajesh', 'Sharma', User.Role.OPERATIONS_MANAGER, 'EMP-002'),
            ('supervisor', 'supervisor@infra-equip.com', 'SupervisorPassword123!', 'Amit', 'Deshmukh', User.Role.SITE_SUPERVISOR, 'EMP-003'),
            ('operator_ravi', 'ravi@infra-equip.com', 'OperatorPassword123!', 'Ravi', 'Kumar', User.Role.OPERATOR, 'EMP-004'),
            ('accountant', 'accounts@infra-equip.com', 'AccountantPassword123!', 'Sneha', 'Patel', User.Role.ACCOUNTANT, 'EMP-005'),
        ]

        users = {}
        for username, email, pwd, first, last, role, emp_code in users_info:
            user, created = User.objects.get_or_create(username=username, defaults={
                'email': email,
                'first_name': first,
                'last_name': last,
                'role': role,
                'employee_code': emp_code,
                'is_staff': True,
                'is_superuser': (role == User.Role.ADMINISTRATOR)
            })
            user.set_password(pwd)
            user.save()
            UserAuthToken.generate_token(user)
            users[username] = user
            self.stdout.write(f"  User: {username} ({role})")

        self.stdout.write("Creating equipment categories...")
        cat_data = [
            ('Excavators', 'EXC', 'Heavy crawler & wheeled hydraulic excavators'),
            ('Cranes & Lifting', 'CRN', 'Crawler, mobile telescopic and rough-terrain cranes'),
            ('Wheel Loaders', 'LDR', 'Front-end wheel loaders for quarry and earthworks'),
            ('Compaction Rollers', 'RLR', 'Soil compactors and tandem asphalt rollers'),
            ('Concrete Machinery', 'CNC', 'Boom pumps, stationary pumps, and transit mixers'),
            ('Haulage & Tippers', 'TIP', 'Heavy duty multi-axle dumpers and tipper trucks'),
        ]
        categories = {}
        for name, code, desc in cat_data:
            cat, _ = MachineCategory.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
            categories[code] = cat

        self.stdout.write("Creating customers, projects, and sites...")
        cust1, _ = Customer.objects.get_or_create(code='CUST-LT', defaults={
            'name': 'Larsen & Toubro Construction Ltd (Heavy Civil Infra)',
            'contact_person': 'Sanjay Kulkarni (Project Director)',
            'phone': '+91 98201 55432',
            'email': 'sanjay.k@intecc.com',
            'gstin': '27AAACL0123F1ZV',
            'billing_address': 'L&T House, Ballard Estate, Mumbai 400001'
        })
        cust2, _ = Customer.objects.get_or_create(code='CUST-SP', defaults={
            'name': 'Shapoorji Pallonji & Co. Pvt Ltd',
            'contact_person': 'Pradeep Nair (Plant & Machinery Head)',
            'phone': '+91 98199 87654',
            'email': 'pnair@shapoorji.com',
            'gstin': '27AAACS4455F1Z9',
            'billing_address': 'SP Centre, 41/44 Minoo Desai Marg, Colaba, Mumbai 400005'
        })
        cust3, _ = Customer.objects.get_or_create(code='CUST-TATA', defaults={
            'name': 'Tata Projects Infrastructure Ltd',
            'contact_person': 'Anand Verma',
            'phone': '+91 97690 12345',
            'email': 'anand.v@tataprojects.com',
            'gstin': '27AAACT9988D1Z2',
            'billing_address': 'One Forbes, Fort, Mumbai 400001'
        })

        proj1, _ = Project.objects.get_or_create(code='PRJ-METRO-4', defaults={
            'name': 'Mumbai Metro Line 4 (Wadala - Kasarvadavali)',
            'customer': cust1,
            'start_date': date(2025, 1, 10),
            'end_date': date(2027, 12, 31),
            'description': 'Elevated viaduct and 32 stations packages'
        })
        proj2, _ = Project.objects.get_or_create(code='PRJ-MAHSR-C4', defaults={
            'name': 'Mumbai-Ahmedabad High Speed Rail (Package C4)',
            'customer': cust1,
            'start_date': date(2024, 6, 1),
            'end_date': date(2028, 3, 31),
            'description': 'Bullet train viaduct & station casting yard'
        })
        proj3, _ = Project.objects.get_or_create(code='PRJ-COASTAL-RD', defaults={
            'name': 'Mumbai Coastal Road Project (South Section)',
            'customer': cust2,
            'start_date': date(2024, 9, 15),
            'end_date': date(2027, 6, 30),
            'description': 'Reclamation, sea-wall and bridge interchange package'
        })

        site1, _ = Site.objects.get_or_create(name='Metro 4 - Pier Casting Yard', defaults={
            'project': proj1,
            'location': 'Kasarvadavali Yard, Ghodbunder Road, Thane',
            'site_incharge': 'Ramesh Sawant',
            'site_contact': '+91 98334 11223',
            'supervisor': users['supervisor']
        })
        site2, _ = Site.objects.get_or_create(name='MAHSR Bullet Train Casting Yard 2', defaults={
            'project': proj2,
            'location': 'Near Vapi Flyover Highway Yard, Gujarat Border',
            'site_incharge': 'K. S. Rao',
            'site_contact': '+91 98450 44556',
            'supervisor': users['supervisor']
        })
        site3, _ = Site.objects.get_or_create(name='Coastal Road Interchange South', defaults={
            'project': proj3,
            'location': 'Worli Seaface Interchange Area, Mumbai',
            'site_incharge': 'Mahesh Joshi',
            'site_contact': '+91 98202 77889',
            'supervisor': users['supervisor']
        })

        self.stdout.write("Creating operators...")
        op1, _ = Operator.objects.get_or_create(employee_id='OP-101', defaults={
            'name': 'Ravi Kumar',
            'phone': '+91 98200 44332',
            'license_number': 'MH04/DL/2018/00918',
            'license_type': 'Heavy Hydraulic Excavator & Crane Class 1',
            'license_expiry': date(2028, 5, 20),
            'experience_years': 7
        })
        op2, _ = Operator.objects.get_or_create(employee_id='OP-102', defaults={
            'name': 'Santosh Yadav',
            'phone': '+91 98199 55667',
            'license_number': 'MH06/DL/2019/04512',
            'license_type': 'Crawler & Telescopic Heavy Crane Operator',
            'license_expiry': date(2029, 2, 14),
            'experience_years': 9
        })
        op3, _ = Operator.objects.get_or_create(employee_id='OP-103', defaults={
            'name': 'Dharmendra Singh',
            'phone': '+91 97690 88771',
            'license_number': 'MH12/DL/2021/08129',
            'license_type': 'Wheel Loader & Compactor Operator',
            'license_expiry': date(2031, 8, 30),
            'experience_years': 5
        })
        op4, _ = Operator.objects.get_or_create(employee_id='OP-104', defaults={
            'name': 'Manoj Patil',
            'phone': '+91 99201 33445',
            'license_number': 'MH43/DL/2020/03319',
            'license_type': 'Concrete Boom Pump Operator',
            'license_expiry': date(2030, 11, 10),
            'experience_years': 6
        })

        self.stdout.write("Creating machinery fleet...")
        machines_data = [
            ('EXC-0101', 'Komatsu PC210-10M0 Hydraulic Excavator', 'EXC', 'Komatsu PC210-10M0', 'MH-04-EK-9182', 'KM210-98124', 2023, Machine.Status.RENTED, Decimal('2450.50'), Machine.BillingType.HOURLY, Decimal('1850.00'), cust1, site1, op1),
            ('EXC-0102', 'Tata Hitachi EX200LC Super Hydraulic Excavator', 'EXC', 'Tata Hitachi EX200LC', 'MH-46-AR-2291', 'TH200-77142', 2022, Machine.Status.RENTED, Decimal('3820.00'), Machine.BillingType.HOURLY, Decimal('1800.00'), cust1, site2, op1),
            ('CRN-0201', 'Sany SCC800C 80-Ton Crawler Crane', 'CRN', 'Sany SCC800C', 'MH-06-BW-5510', 'SN800-44129', 2023, Machine.Status.RENTED, Decimal('1540.00'), Machine.BillingType.HOURLY, Decimal('3500.00'), cust1, site1, op2),
            ('CRN-0202', 'ACE 25-Ton Mobile Hydra Crane', 'CRN', 'ACE FX250', 'MH-04-HY-1144', 'AC25-99214', 2024, Machine.Status.AVAILABLE, Decimal('890.00'), Machine.BillingType.SHIFT, Decimal('7500.00'), None, None, None),
            ('LDR-0301', 'Caterpillar 950GC Heavy Wheel Loader', 'LDR', 'Caterpillar 950GC', 'MH-12-PQ-4482', 'CAT950-88190', 2023, Machine.Status.RENTED, Decimal('2110.00'), Machine.BillingType.HOURLY, Decimal('2200.00'), cust2, site3, op3),
            ('RLR-0401', 'HAMM 311 Compactor (11-Ton Soil Roller)', 'RLR', 'HAMM 311', 'MH-04-DX-7711', 'HM311-66231', 2022, Machine.Status.RENTED, Decimal('1980.00'), Machine.BillingType.HOURLY, Decimal('1200.00'), cust2, site3, op3),
            ('PMP-0501', 'Schwing Stetter S36X 36m Concrete Boom Pump', 'CNC', 'Schwing Stetter S36X', 'MH-43-BB-8890', 'SS36-33120', 2023, Machine.Status.UNDER_MAINTENANCE, Decimal('3100.00'), Machine.BillingType.HOURLY, Decimal('4000.00'), cust1, site1, op4),
            ('TXM-0601', 'Tata Prima 2830.K 7 Cu.M Transit Mixer', 'CNC', 'Tata Prima 2830.K', 'MH-46-CL-3321', 'TP2830-11029', 2024, Machine.Status.AVAILABLE, Decimal('640.00'), Machine.BillingType.MONTHLY, Decimal('195000.00'), None, None, None),
        ]

        machines = {}
        for code, name, cat_code, mm, reg, ser, yr, stat, hmr, btype, rate, cust, site, op in machines_data:
            m, _ = Machine.objects.get_or_create(asset_code=code, defaults={
                'name': name,
                'category': categories[cat_code],
                'make_model': mm,
                'registration_number': reg,
                'serial_number': ser,
                'year_of_manufacture': yr,
                'status': stat,
                'current_hour_meter': hmr,
                'billing_type': btype,
                'rental_rate': rate,
                'current_customer': cust,
                'current_site': site,
                'current_operator': op,
                'insurance_expiry': date(2027, 4, 15),
                'fitness_expiry': date(2027, 6, 30),
                'pollution_expiry': date(2026, 12, 31),
                'remarks': 'Operational & certified for mega-infrastructure contracts.'
            })
            machines[code] = m

        self.stdout.write("Creating rental contracts...")
        rc1, _ = RentalContract.objects.get_or_create(contract_number='RC-2025-0042', defaults={
            'customer': cust1,
            'project': proj1,
            'site': site1,
            'machine': machines['EXC-0101'],
            'start_date': date(2025, 2, 1),
            'billing_type': 'HOURLY',
            'rate': Decimal('1850.00'),
            'minimum_guaranteed_hours': Decimal('240.00'),
            'overtime_rate': Decimal('1850.00'),
            'diesel_scope': RentalContract.DieselScope.CLIENT_SCOPE,
            'status': RentalContract.Status.ACTIVE,
            'terms': 'Client supplies diesel on-site. Minimum 240 hours guaranteed per month. Daily logsheets signed by site engineer.'
        })

        rc2, _ = RentalContract.objects.get_or_create(contract_number='RC-2025-0043', defaults={
            'customer': cust1,
            'project': proj1,
            'site': site1,
            'machine': machines['CRN-0201'],
            'start_date': date(2025, 2, 1),
            'billing_type': 'HOURLY',
            'rate': Decimal('3500.00'),
            'minimum_guaranteed_hours': Decimal('200.00'),
            'overtime_rate': Decimal('3500.00'),
            'diesel_scope': RentalContract.DieselScope.CLIENT_SCOPE,
            'status': RentalContract.Status.ACTIVE,
            'terms': '80-ton crawler crane for pier cap erection and segment lifting.'
        })

        self.stdout.write("Creating demonstration logsheets across lifecycle states...")
        today = date.today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        three_days_ago = today - timedelta(days=3)

        # Logsheet 1: Approved
        l1, _ = Logsheet.objects.get_or_create(logsheet_number='LOG-2026-00001', defaults={
            'date': three_days_ago,
            'shift': Logsheet.Shift.DAY,
            'customer': cust1,
            'project': proj1,
            'site': site1,
            'machine': machines['EXC-0101'],
            'operator': op1,
            'supervisor': users['supervisor'],
            'rental_contract': rc1,
            'opening_meter': Decimal('2432.50'),
            'closing_meter': Decimal('2441.50'),
            'working_hours': Decimal('9.00'),
            'idle_hours': Decimal('1.00'),
            'breakdown_hours': Decimal('0.00'),
            'overtime_hours': Decimal('1.00'),
            'start_time': '08:00',
            'end_time': '18:30',
            'work_description': 'Deep basement foundation excavation, rock trenching for pier footing P-12, and loading 14 tippers with excavated boulder soil.',
            'opening_fuel_litres': Decimal('180.00'),
            'diesel_received_litres': Decimal('120.00'),
            'diesel_consumed_litres': Decimal('115.00'),
            'closing_fuel_litres': Decimal('185.00'),
            'fuel_remarks': 'Filled from Site Bowser Slip #BS-9021',
            'equipment_condition': Logsheet.EquipmentCondition.NORMAL,
            'customer_rep_name': 'K. N. Murthy (L&T Senior Site Engineer)',
            'customer_signature_confirmed': True,
            'status': Logsheet.Status.APPROVED,
            'prepared_by': users['operator_ravi'],
            'submitted_at': timezone.now() - timedelta(days=3),
            'approved_by': users['supervisor'],
            'approved_at': timezone.now() - timedelta(days=3, hours=2),
            'billed': True,
            'invoice_number': 'INV-2026-0001'
        })
        LogsheetAudit.objects.get_or_create(logsheet=l1, action='APPROVED', defaults={
            'performed_by': users['supervisor'],
            'performed_by_name': 'Amit Deshmukh',
            'notes': 'Verified hour-meter and diesel slip. Approved for contract billing.'
        })

        # Logsheet 2: Approved
        l2, _ = Logsheet.objects.get_or_create(logsheet_number='LOG-2026-00002', defaults={
            'date': two_days_ago,
            'shift': Logsheet.Shift.DAY,
            'customer': cust1,
            'project': proj1,
            'site': site1,
            'machine': machines['EXC-0101'],
            'operator': op1,
            'supervisor': users['supervisor'],
            'rental_contract': rc1,
            'opening_meter': Decimal('2441.50'),
            'closing_meter': Decimal('2450.50'),
            'working_hours': Decimal('9.00'),
            'idle_hours': Decimal('0.50'),
            'breakdown_hours': Decimal('0.00'),
            'overtime_hours': Decimal('1.00'),
            'start_time': '08:00',
            'end_time': '18:00',
            'work_description': 'Slope dressing and trimming on cutting zone C-4. Shifting concrete barrier blocks along service lane.',
            'opening_fuel_litres': Decimal('185.00'),
            'diesel_received_litres': Decimal('100.00'),
            'diesel_consumed_litres': Decimal('108.00'),
            'closing_fuel_litres': Decimal('177.00'),
            'fuel_remarks': 'Bowser Slip #BS-9088',
            'equipment_condition': Logsheet.EquipmentCondition.EXCELLENT,
            'customer_rep_name': 'K. N. Murthy',
            'customer_signature_confirmed': True,
            'status': Logsheet.Status.APPROVED,
            'prepared_by': users['operator_ravi'],
            'submitted_at': timezone.now() - timedelta(days=2),
            'approved_by': users['supervisor'],
            'approved_at': timezone.now() - timedelta(days=2, hours=1),
            'billed': False
        })
        LogsheetAudit.objects.get_or_create(logsheet=l2, action='APPROVED', defaults={
            'performed_by': users['supervisor'],
            'performed_by_name': 'Amit Deshmukh',
            'notes': 'Hours and diesel checked. Approved.'
        })

        # Logsheet 3: Submitted (Awaiting Approval)
        l3, _ = Logsheet.objects.get_or_create(logsheet_number='LOG-2026-00003', defaults={
            'date': yesterday,
            'shift': Logsheet.Shift.DAY,
            'customer': cust1,
            'project': proj1,
            'site': site1,
            'machine': machines['CRN-0201'],
            'operator': op2,
            'supervisor': users['supervisor'],
            'rental_contract': rc2,
            'opening_meter': Decimal('1532.00'),
            'closing_meter': Decimal('1540.00'),
            'working_hours': Decimal('8.00'),
            'idle_hours': Decimal('1.50'),
            'breakdown_hours': Decimal('0.00'),
            'overtime_hours': Decimal('0.00'),
            'start_time': '08:30',
            'end_time': '18:00',
            'work_description': 'Erection of precast concrete U-girder segment SG-44 on pier P-19 using 80T crawler rigging.',
            'opening_fuel_litres': Decimal('220.00'),
            'diesel_received_litres': Decimal('150.00'),
            'diesel_consumed_litres': Decimal('95.00'),
            'closing_fuel_litres': Decimal('275.00'),
            'fuel_remarks': 'IOCL Dispenser Slip #7712',
            'equipment_condition': Logsheet.EquipmentCondition.NORMAL,
            'customer_rep_name': 'Sunil Varma (Rigging In-charge)',
            'customer_signature_confirmed': True,
            'status': Logsheet.Status.SUBMITTED,
            'prepared_by': users['operator_ravi'],
            'submitted_at': timezone.now() - timedelta(days=1),
            'billed': False
        })
        LogsheetAudit.objects.get_or_create(logsheet=l3, action='SUBMITTED', defaults={
            'performed_by': users['operator_ravi'],
            'performed_by_name': 'Ravi Kumar',
            'notes': 'Submitted by operator for supervisor review.'
        })

        # Logsheet 4: Draft (In progress)
        l4, _ = Logsheet.objects.get_or_create(logsheet_number='LOG-2026-00004', defaults={
            'date': today,
            'shift': Logsheet.Shift.DAY,
            'customer': cust2,
            'project': proj3,
            'site': site3,
            'machine': machines['LDR-0301'],
            'operator': op3,
            'supervisor': users['supervisor'],
            'opening_meter': Decimal('2102.00'),
            'closing_meter': Decimal('2110.00'),
            'working_hours': Decimal('8.00'),
            'idle_hours': Decimal('0.50'),
            'breakdown_hours': Decimal('0.00'),
            'start_time': '08:00',
            'end_time': '17:00',
            'work_description': 'Stockpile aggregate handling, 20mm metal loading into batching plant hopper.',
            'diesel_consumed_litres': Decimal('70.00'),
            'status': Logsheet.Status.DRAFT,
            'prepared_by': users['supervisor'],
            'billed': False
        })

        # Logsheet 5: Rejected (Requires Correction)
        l5, _ = Logsheet.objects.get_or_create(logsheet_number='LOG-2026-00005', defaults={
            'date': two_days_ago,
            'shift': Logsheet.Shift.NIGHT,
            'customer': cust2,
            'project': proj3,
            'site': site3,
            'machine': machines['RLR-0401'],
            'operator': op3,
            'supervisor': users['supervisor'],
            'opening_meter': Decimal('1975.00'),
            'closing_meter': Decimal('1980.00'),
            'working_hours': Decimal('5.00'),
            'idle_hours': Decimal('2.00'),
            'breakdown_hours': Decimal('2.00'),
            'start_time': '20:00',
            'end_time': '05:00',
            'work_description': 'Sub-grade compaction on carriageway km 12+400.',
            'breakdown_details': 'Hydraulic hose leak identified at 01:30 AM; site mechanic rectified at 03:30 AM.',
            'status': Logsheet.Status.REJECTED,
            'rejection_reason': 'Breakdown hours do not match mechanic job card entry (reported 3.5 hrs breakdown, not 2 hrs). Please verify with mechanical incharge and update.',
            'prepared_by': users['operator_ravi'],
            'submitted_at': timezone.now() - timedelta(days=2),
            'approved_by': users['supervisor'],
            'approved_at': timezone.now() - timedelta(days=1, hours=20),
            'billed': False
        })
        LogsheetAudit.objects.get_or_create(logsheet=l5, action='REJECTED', defaults={
            'performed_by': users['supervisor'],
            'performed_by_name': 'Amit Deshmukh',
            'notes': 'Rejection Reason: Breakdown hours do not match mechanic job card entry. Please correct.'
        })

        self.stdout.write("Creating fuel issues...")
        FuelRecord.objects.get_or_create(fuel_slip_number='FS-9011', defaults={
            'issue_date': yesterday,
            'machine': machines['EXC-0101'],
            'site': site1,
            'litres_issued': Decimal('120.00'),
            'dispensed_by': 'Bharat Bowser Operator (Ramesh)',
            'hour_meter_reading': Decimal('2441.50'),
            'fuel_rate': Decimal('92.50'),
            'total_cost': Decimal('11100.00'),
            'bowser_source': 'Site Bowser #02',
            'remarks': 'Issued before starting day shift'
        })
        FuelRecord.objects.get_or_create(fuel_slip_number='FS-9012', defaults={
            'issue_date': yesterday,
            'machine': machines['CRN-0201'],
            'site': site1,
            'litres_issued': Decimal('150.00'),
            'dispensed_by': 'Bharat Bowser Operator (Ramesh)',
            'hour_meter_reading': Decimal('1532.00'),
            'fuel_rate': Decimal('92.50'),
            'total_cost': Decimal('13875.00'),
            'bowser_source': 'Site Bowser #02',
            'remarks': 'Crawler tank full top-up'
        })

        self.stdout.write("Creating maintenance job cards...")
        MaintenanceRecord.objects.get_or_create(job_card_number='JC-2026-0001', defaults={
            'machine': machines['PMP-0501'],
            'service_type': MaintenanceRecord.ServiceType.BREAKDOWN_REPAIR,
            'hour_meter': Decimal('3100.00'),
            'start_date': yesterday,
            'status': MaintenanceRecord.Status.IN_PROGRESS,
            'technician_name': 'Sanjay Thorat (Hydraulic Specialist)',
            'service_vendor': 'Schwing Stetter Authorized Service Team',
            'spares_cost': Decimal('18500.00'),
            'labour_cost': Decimal('4500.00'),
            'total_cost': Decimal('23000.00'),
            'problem_reported': 'Hydraulic pressure drop in boom section 3 cylinder during maximum reach placement.',
            'action_taken': 'Disassembled counterbalance valve, replaced hydraulic seal kit and pressure tested to 320 bar.',
            'parts_replaced': 'Main seal kit (Part #SS-8910), Hydraulic high pressure hose 1/2" 4SP'
        })

        self.stdout.write("Creating sample billing invoice...")
        inv1, _ = Invoice.objects.get_or_create(invoice_number='INV-2026-0001', defaults={
            'customer': cust1,
            'project': proj1,
            'invoice_date': three_days_ago,
            'due_date': three_days_ago + timedelta(days=30),
            'status': Invoice.Status.ISSUED,
            'tax_percent': Decimal('18.00'),
            'notes': 'Rental billing for Metro 4 Project machinery deployment.'
        })
        InvoiceItem.objects.get_or_create(invoice=inv1, logsheet=l1, defaults={
            'description': f"Logsheet {l1.logsheet_number} ({l1.date}) - Machine {machines['EXC-0101'].asset_code} (9.0 Run Hrs @ ₹1,850/hr)",
            'quantity_hours': Decimal('9.00'),
            'unit_rate': Decimal('1850.00'),
            'amount': Decimal('16650.00')
        })
        inv1.calculate_totals()

        self.stdout.write(self.style.SUCCESS("Successfully seeded comprehensive demonstration ERP dataset!"))
