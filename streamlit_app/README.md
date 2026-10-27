# 🏢 KMN IT System - Streamlit Cloud Hub (Pure Python)

A high-performance IT Asset, Consumable, and Invoice management system built completely in **Streamlit (Python)** with **Google Drive & Google Cloud Sheets** (100% cloud-hosted, zero local database files).

---

## 🌟 Key Architecture & Capabilities

### 1. 100% Zero Local Database
- All 19 relational tables (Assets, Users, Repairs, Invoices, Printers, Consumables, CCTV) are stored directly in your **Google Spreadsheet** (`IT_Asset_Database`).
- Python reads and updates Google Sheets directly via the Google Apps Script API.
- No local `.xlsx` write locks, no SQLite files, and no browser `localStorage` drift.

### 2. Automatic Google Drive PDF Vault & In-line Viewer
- **Drop & Upload**: When you upload a bill PDF, Python automatically streams it into your dedicated Google Drive folder (`IT_System_Invoices` - ID: `1vgrHwewH0tTGwG0NMLzHRQioazXiAamD`).
- **Instant Preview**: Embeds the Google Drive preview iframe side-by-side with invoice details so you can inspect invoices directly without leaving the app.
- **Drive Sync**: 1-click button to synchronize any PDF bills manually placed into Google Drive.

### 3. Solved Price & Calculation Mismatches (Pandas Financial Engine)
- **Eliminated Double Counting**: In [`reconciliation_engine.py`](file:///g:/AnjeloPrograms/ITSystem/streamlit_app/services/reconciliation_engine.py), repairs, printer toners, and vendor invoices are linked by ID without creating duplicate standalone expenses.
- **Lifetime Cost (TCO)**: Computes true asset expenditure:
  $$\text{Asset Lifetime Cost} = \text{Purchase Cost} + \text{Repairs} + \text{Consumables} + \text{Unique Expenses}$$
- **Double-Entry Reconciliation Ledger**: Automatically flags discrepancies between Verified Invoices and Recorded Expenses, with a **1-Click Auto-Reconcile** button.

---

## 🚀 How to Run

### Option 1: 1-Click Launcher (Windows)
Double-click [`run_app.bat`](file:///g:/AnjeloPrograms/ITSystem/run_app.bat) in the project root.

### Option 2: Command Line
```powershell
python -m streamlit run streamlit_app/app.py
```
Then open: **`http://localhost:8501`** in your browser.

---

## 🔐 Credentials
- **Administrator**: `kmnaquaitadmin` / `(adminaqua30@IT)`
- **Viewer**: `user` / `(useraqua30@IT)`
*(Or click the Quick Demo Access buttons on the login screen)*
