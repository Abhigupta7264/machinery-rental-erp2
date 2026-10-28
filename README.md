# Machinery Rental & Operations Management ERP with Digital Logsheet Generation

An enterprise, full-stack web application for heavy machinery rental, fleet deployment tracking, site operations, and digital logsheet lifecycle management inspired by **Orecs.in**.

Built with a **Next.js 14 App Router (TypeScript + Tailwind CSS)** frontend and a **Python Django + Django REST Framework** backend, featuring a pure-Python **ReportLab** vector A4 PDF generation engine.

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. Logsheet Management Module (Core Focus)
- **Multi-Step Structured Logsheet Entry**:
  - **Section 1: General Information**: Auto-generated sequential logsheet number (`LOG-2026-XXXXX`), date, shift (`Day`, `Night`, `General`), customer, project, site location, machine asset code, and assigned operator.
  - **Section 2: Working-Hour & Meter Readings (HMR)**: Live calculation of net running hours ($Closing - Opening$). Enforces closing $\ge$ opening reading, rejects negative numbers, prevents duplicate machine/shift entries. Captures idle, breakdown, and overtime hours.
  - **Section 3: Diesel & Fuel Tracking**: Opening fuel, diesel received from site bowsers/pumps, diesel consumed, closing fuel, and voucher/slip number.
  - **Section 4: Operational Log & Equipment Condition**: Work description, equipment condition (`Excellent`, `Normal`, `Attention Needed`, `Breakdown`), site remarks, and client representative acknowledgement.
  - **Section 5: Approval Lifecycle**: Complete status workflow (`Draft` $\to$ `Submitted` $\to$ `Approved` / `Rejected` $\to$ `Voided`).
- **Official Print-Ready & Downloadable PDF Generation (ReportLab)**:
  - Exact ISO A4 portrait engineering document.
  - Dynamic company legal details, CIN, GSTIN, and contact information.
  - Two-column asset vs site deployment summary.
  - Complete meter readings and diesel burn rate calculation ($Litres / Hour$).
  - Tri-party signature blocks (Operator, Site Supervisor, Client Representative).
  - Security authorization hash and generation timestamp.
  - In-browser print preview with a dedicated `@media print` A4 stylesheet.
- **Audit Trail & Revision History**:
  - Every creation, edit, submission, approval, rejection, and PDF download is tracked with timestamps, actor names, and notes.

### 2. Supporting Modules
- **Operations & Fleet Dashboard**: Live metrics calculated from PostgreSQL/database records (total fleet, available, deployed, under maintenance, pending logsheets, run hours, diesel burn, and outstanding invoices).
- **Fleet & Machinery Master**: Machine asset codes, categories, make/model, registration numbers, rental billing structures (`Hourly`, `Shift`, `Daily`, `Monthly`), and meter readings.
- **Customers, Projects & Sites**: Client directory with credit periods and site locations.
- **Operators & Crew Directory**: Operator records, driver/HEMM license types, and license expiry alerts.
- **Fuel & Diesel Dispensing Logs**: Issue vouchers, bowser logs, fuel rates, and total expenditure.
- **Maintenance & Service Job Cards**: Preventive maintenance intervals (250h, 500h, 1000h), emergency breakdowns, and parts replacement costs.
- **Billing & Invoicing**: Automated invoice generation from verified & approved logsheets to eliminate billing leakage.
- **Analytics & Reports**: Machine utilization rankings and diesel burn efficiencies.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, React Hook Form, Zod |
| **Backend** | Python 3.14+, Django 5+, Django REST Framework (DRF), `django-cors-headers` |
| **PDF Engine** | Pure-Python **ReportLab** (vector A4 layout, custom styles, tables, borders, signature boxes) |
| **Database** | PostgreSQL (with 12-factor environment variables and SQLite fallback for local developer setup) |
| **Async Processing** | Celery + Redis (configured with synchronous eager fallback when Redis is absent) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.14 compatible)
- **Node.js 18+** (Node v24 tested)
- **npm** or **pnpm**

---

### Step 1: Set Up Backend

1. Navigate to the backend folder:
   ```powershell
   cd "e:\Machinery ERP\backend"
   ```

2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. Run database migrations:
   ```powershell
   python manage.py migrate
   ```

4. Populate realistic demonstration data:
   ```powershell
   python manage.py seed_data
   ```

5. Start the Django backend development server:
   ```powershell
   python manage.py runserver 8000
   ```
   *The REST API will be available at `http://127.0.0.1:8000/api/`*

---

### Step 2: Set Up Frontend

1. Open a new terminal and navigate to the frontend folder:
   ```powershell
   cd "e:\Machinery ERP\frontend"
   ```

2. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:3000`*

---

## 🔑 Pre-Seeded Demonstration Accounts

The system comes pre-seeded with accounts for testing role-based permissions:

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Site Supervisor** | `supervisor` | `SupervisorPassword123!` | Reviews and approves site logsheets |
| **Administrator** | `admin` | `AdminPassword123!` | Full system access, void records, company settings |
| **Equipment Operator** | `operator_ravi` | `OperatorPassword123!` | Enters daily meter readings & diesel |
| **Operations Manager** | `ops_manager` | `OpsPassword123!` | Fleet management & commercial oversight |
| **Accountant** | `accountant` | `AccountantPassword123!` | Invoices & billing from approved logsheets |

> **Tip**: The login page (`/login`) includes 1-click role buttons to switch personas instantly during testing.

---

## 🧪 Running Automated Tests

Run the complete test suite (unit tests, validation rules, meter calculation checks, approval lifecycle, and PDF byte stream verification):

```powershell
cd "e:\Machinery ERP"
.\backend\venv\Scripts\python.exe backend\manage.py test apps.logsheets
```

Expected result:
```
Ran 5 tests in ~0.5s
OK
System check identified no issues.
```

---

## 📋 Core API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login/` | `POST` | Authenticate and obtain Bearer token |
| `/api/auth/me/` | `GET` | Current user profile and role |
| `/api/analytics/dashboard/` | `GET` | Live computed operations & fleet metrics |
| `/api/logsheets/` | `GET, POST` | List logsheets with filters; create new record |
| `/api/logsheets/<id>/` | `GET, PATCH` | Retrieve logsheet details; update draft/rejected |
| `/api/logsheets/<id>/submit/` | `POST` | Submit draft logsheet for supervisor verification |
| `/api/logsheets/<id>/approve/` | `POST` | Approve logsheet and update machine meter readings |
| `/api/logsheets/<id>/reject/` | `POST` | Reject logsheet with required reason |
| `/api/logsheets/<id>/pdf/` | `GET` | Stream official ReportLab A4 vector PDF download |
| `/api/billing/invoices/generate_from_logsheets/` | `POST` | Create GST invoice from approved logsheets |

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in `backend/` to configure production PostgreSQL and Redis:

```env
DEBUG=False
SECRET_KEY=your-production-secret-key
USE_POSTGRES=True
DB_NAME=machinery_erp
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=127.0.0.1
DB_PORT=5432
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_ALWAYS_EAGER=False
```

For Celery background workers:
```powershell
celery -A machinery_erp worker -l info
```

