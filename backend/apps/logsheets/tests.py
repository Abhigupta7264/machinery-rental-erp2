from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.fleet.models import Machine, MachineCategory
from apps.customers.models import Customer, Project, Site
from apps.operators.models import Operator
from apps.logsheets.models import Logsheet, LogsheetAudit
from apps.logsheets.pdf_generator import generate_logsheet_pdf
from apps.billing.models import Invoice

User = get_user_model()

class LogsheetWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor = User.objects.create_user(
            username='supervisor_test',
            password='TestPassword123!',
            role=User.Role.SITE_SUPERVISOR,
            first_name='Supervisor',
            last_name='Test'
        )
        self.operator_user = User.objects.create_user(
            username='operator_test',
            password='TestPassword123!',
            role=User.Role.OPERATOR,
            first_name='Operator',
            last_name='Test'
        )
        self.accountant = User.objects.create_user(
            username='accountant_test',
            password='TestPassword123!',
            role=User.Role.ACCOUNTANT,
            first_name='Accountant',
            last_name='Test'
        )

        self.category = MachineCategory.objects.create(name='Excavator', code='EXC')
        self.customer = Customer.objects.create(name='L&T Heavy Infra', code='CUST-LT', phone='9820000000')
        self.project = Project.objects.create(name='Metro 4 Package', code='P-01', customer=self.customer)
        self.site = Site.objects.create(name='Pier Casting Yard', location='Thane Yard', project=self.project)
        self.operator = Operator.objects.create(employee_id='OP-999', name='Ravi Kumar', phone='9999999999')
        self.machine = Machine.objects.create(
            asset_code='EXC-0101',
            name='Komatsu PC210-10M0',
            category=self.category,
            make_model='PC210-10M0',
            current_hour_meter=Decimal('2400.00'),
            rental_rate=Decimal('1850.00')
        )

    def test_logsheet_model_auto_calculation(self):
        """Model auto-calculates working hours ($closing - opening$)"""
        logsheet = Logsheet.objects.create(
            date=date.today(),
            shift=Logsheet.Shift.DAY,
            customer=self.customer,
            project=self.project,
            site=self.site,
            machine=self.machine,
            operator=self.operator,
            opening_meter=Decimal('2400.00'),
            closing_meter=Decimal('2409.50'),
            work_description='Excavation for pier P-12 footing',
            prepared_by=self.operator_user
        )
        self.assertEqual(logsheet.working_hours, Decimal('9.50'))
        self.assertTrue(logsheet.logsheet_number.startswith('LOG-'))
        self.assertEqual(logsheet.status, Logsheet.Status.DRAFT)

    def test_closing_meter_less_than_opening_rejected(self):
        """Closing meter < opening meter raises ValidationError"""
        logsheet = Logsheet(
            date=date.today(),
            shift=Logsheet.Shift.DAY,
            customer=self.customer,
            project=self.project,
            site=self.site,
            machine=self.machine,
            operator=self.operator,
            opening_meter=Decimal('2400.00'),
            closing_meter=Decimal('2390.00'),
            work_description='Invalid meter reading'
        )
        with self.assertRaises(ValidationError):
            logsheet.clean()

    def test_duplicate_logsheet_rejected(self):
        """Cannot create duplicate active logsheets for same machine, date, and shift"""
        Logsheet.objects.create(
            date=date.today(),
            shift=Logsheet.Shift.DAY,
            customer=self.customer,
            project=self.project,
            site=self.site,
            machine=self.machine,
            operator=self.operator,
            opening_meter=Decimal('2400.00'),
            closing_meter=Decimal('2408.00'),
            work_description='Valid shift 1'
        )

        dup = Logsheet(
            date=date.today(),
            shift=Logsheet.Shift.DAY,
            customer=self.customer,
            project=self.project,
            site=self.site,
            machine=self.machine,
            operator=self.operator,
            opening_meter=Decimal('2408.00'),
            closing_meter=Decimal('2416.00'),
            work_description='Duplicate shift test'
        )
        with self.assertRaises(ValidationError):
            dup.clean()

    def test_pdf_generation_buffer(self):
        """ReportLab creates A4 vector PDF with valid header and data"""
        logsheet = Logsheet.objects.create(
            date=date.today(),
            shift=Logsheet.Shift.DAY,
            customer=self.customer,
            project=self.project,
            site=self.site,
            machine=self.machine,
            operator=self.operator,
            opening_meter=Decimal('2400.00'),
            closing_meter=Decimal('2409.00'),
            diesel_consumed_litres=Decimal('110.00'),
            work_description='Heavy rock cutting',
            status=Logsheet.Status.APPROVED
        )
        pdf = generate_logsheet_pdf(logsheet)
        val = pdf.getvalue()
        self.assertTrue(len(val) > 1000)
        self.assertTrue(val.startswith(b'%PDF-'))

    def test_full_rest_api_lifecycle(self):
        """Test full REST API lifecycle: Login -> Create -> Submit -> Approve -> PDF stream -> Invoice"""
        # 1. Login
        login_resp = self.client.post('/api/auth/login/', {
            'username': 'operator_test',
            'password': 'TestPassword123!'
        })
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        token = login_resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 2. Create Logsheet via API
        create_resp = self.client.post('/api/logsheets/', {
            'date': str(date.today()),
            'shift': 'DAY',
            'customer': str(self.customer.id),
            'project': str(self.project.id),
            'site': str(self.site.id),
            'machine': str(self.machine.id),
            'operator': str(self.operator.id),
            'opening_meter': '2400.00',
            'closing_meter': '2408.50',
            'idle_hours': '0.50',
            'diesel_consumed_litres': '95.00',
            'work_description': 'Basement excavation and muck disposal',
            'submit_now': False
        })
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        logsheet_id = create_resp.data['id']
        self.assertEqual(create_resp.data['status'], 'DRAFT')
        self.assertEqual(create_resp.data['working_hours'], '8.50')

        # 3. Submit for Approval
        submit_resp = self.client.post(f'/api/logsheets/{logsheet_id}/submit/')
        self.assertEqual(submit_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_resp.data['status'], 'SUBMITTED')

        # 4. Supervisor Login & Approve
        self.client.credentials() # Clear operator
        login_sup = self.client.post('/api/auth/login/', {
            'username': 'supervisor_test',
            'password': 'TestPassword123!'
        })
        sup_token = login_sup.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {sup_token}')

        approve_resp = self.client.post(f'/api/logsheets/{logsheet_id}/approve/')
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_resp.data['status'], 'APPROVED')

        # Verify machine hour meter was updated
        self.machine.refresh_from_db()
        self.assertEqual(self.machine.current_hour_meter, Decimal('2408.50'))

        # 5. Download ReportLab PDF via API
        pdf_resp = self.client.get(f'/api/logsheets/{logsheet_id}/pdf/')
        self.assertEqual(pdf_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_resp['Content-Type'], 'application/pdf')
        pdf_bytes = b''.join(pdf_resp.streaming_content)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b'%PDF-'))

        # 6. Generate Invoice from Approved Logsheet
        inv_resp = self.client.post('/api/billing/invoices/generate_from_logsheets/', {
            'customer': str(self.customer.id),
            'logsheet_ids': [str(logsheet_id)]
        }, format='json')
        self.assertEqual(inv_resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(inv_resp.data['invoice_number'].startswith('INV-'))
        # 8.5 hrs * 1850 = 15,725 subtotal
        self.assertEqual(float(inv_resp.data['subtotal']), 15725.0)
        # 15725 + 18% GST (2830.50) = 18555.50
        self.assertEqual(float(inv_resp.data['grand_total']), 18555.5)

        # Verify logsheet is marked billed
        log_db = Logsheet.objects.get(id=logsheet_id)
        self.assertTrue(log_db.billed)
