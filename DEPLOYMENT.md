# Cloud Deployment Guide: Vercel & Production Cloud Host

This guide walks you through deploying the **Machinery Rental ERP & Digital Logsheet Hub** to the web so it is accessible from any mobile phone, tablet, laptop, or desktop browser.

---

## 🏗️ Architecture for Public Access

A real-world full-stack ERP architecture separates concerns:

1. **Frontend (Next.js 14 App Router)**: Deployed to **Vercel**
   - High-speed global edge network
   - Automatic SSL / HTTPS
   - Responsive layouts optimized for site supervisors on mobile phones and office accountants on desktops.
2. **Backend (Django REST API + PostgreSQL + ReportLab PDF Generator)**: Deployed to **Render.com** or **Railway.app**
   - Managed PostgreSQL database for all fleet, logsheet, and invoice records.
   - Gunicorn WSGI server with Whitenoise serving static assets.
   - Generates official vector A4 PDFs on demand.

---

## 🚀 Step-by-Step Deployment Walkthrough

### Part 1: Push Repository to GitHub

1. Create a new repository on your GitHub account (e.g. `machinery-rental-erp`).
2. Link this local git repository to your GitHub remote and push:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/machinery-rental-erp.git
git branch -M main
git push -u origin main
```

---

### Part 2: Deploy the Django Backend (on Render.com)

1. Sign in to [Render.com](https://dashboard.render.com/) (Free).
2. Click **New +** $\to$ **Blueprint**.
3. Select your GitHub repository (`machinery-rental-erp`).
4. Render will automatically detect the [`render.yaml`](../render.yaml) file in the repository:
   - It automatically provisions a free **PostgreSQL Database** (`machinery-erp-db`).
   - It provisions the **Python Web Service** (`machinery-erp-backend`).
   - It automatically runs database migrations and seeds demonstration users & machinery.
5. Click **Apply**.
6. Once deployed, Render will provide a live URL, for example:
   `https://machinery-erp-backend.onrender.com`

---

### Part 3: Deploy the Next.js Frontend (on Vercel)

1. Sign in to [Vercel.com](https://vercel.com/new).
2. Click **Add New...** $\to$ **Project** $\to$ Import your GitHub repository (`machinery-rental-erp`).
3. In the project configuration screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click `Edit` and select **`frontend`**.
4. Expand **Environment Variables** and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://machinery-erp-backend.onrender.com`)
5. Click **Deploy**.

---

### Part 4: Access on Any Mobile or Laptop Browser

Vercel will build and assign a global public HTTPS domain, such as:
**`https://machinery-rental-erp.vercel.app`**

1. Open this URL on your iPhone, Android, iPad, Mac, or Windows laptop.
2. The user interface automatically adapts to mobile touchscreens:
   - Collapsible slide-over navigation drawer.
   - Mobile-optimized logsheet entry forms with touch-friendly number pads for meter readings.
   - 1-click official PDF downloads directly onto mobile storage or wireless site printers.
3. Use the pre-seeded personas to sign in:
   - **Site Supervisor**: `supervisor` / `SupervisorPassword123!`
   - **Administrator**: `admin` / `AdminPassword123!`
   - **Equipment Operator**: `operator_ravi` / `OperatorPassword123!`
   - **Accountant**: `accountant` / `AccountantPassword123!`

---

## ⚡ Quick Alternative: Local Network Testing on Mobile (Right Now)

If you want to open and test the application on your **mobile phone immediately** on your local Wi-Fi before deploying to the cloud:

1. Find your computer's local Wi-Fi IP address in PowerShell:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object -ExpandProperty IPAddress
   ```
   *(e.g., `192.168.1.45`)*

2. Start the backend bound to all network interfaces:
   ```powershell
   cd "e:\Machinery ERP\backend"
   .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
   ```

3. Start the Next.js frontend bound to all network interfaces:
   ```powershell
   cd "e:\Machinery ERP\frontend"
   npm run dev -- -H 0.0.0.0
   ```

4. Connect your mobile phone to the same Wi-Fi network and open:
   `http://YOUR_COMPUTER_IP:3000` (e.g. `http://192.168.1.45:3000`)
