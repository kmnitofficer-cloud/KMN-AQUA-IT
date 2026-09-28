# 🚀 GitHub Pages & Google Drive Setup Guide

This guide walks you through setting up **GitHub Pages** to host your IT System website, while using **Google Drive** as your live database and PDF bill repository (100% free, zero server fees).

---

## Part 1: Setting up Google Drive (3 Minutes)

### Step 1: Create a Google Spreadsheet
1. Open [Google Drive](https://drive.google.com/drive).
2. Click **New > Google Sheets > Blank spreadsheet**.
3. Name the spreadsheet: **`IT_Asset_Database`**.

### Step 2: Open Google Apps Script
1. In your new spreadsheet, click the menu: **Extensions > Apps Script**.
2. Delete any code in the editor (`myFunction`).
3. Open [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) in this repository, copy all the code, and paste it into the Apps Script editor.
4. Click the **Save** icon (disk).

### Step 3: Deploy as a Web App
1. Click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon ⚙ next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `IT System Cloud Backend`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **`Anyone`** *(Crucial: allows your GitHub Pages site to communicate with the script)*
4. Click **Deploy**.
5. Google will ask for authorization:
   - Click **Authorize access**.
   - Select your Google account.
   - Click **Advanced** > **Go to Untitled project (unsafe)**.
   - Click **Allow**.
6. Copy the **Web app URL** that appears (starts with `https://script.google.com/macros/s/.../exec`).

---

## Part 2: Connect the Web App Directly to Google Drive

You can connect directly to Google Drive in any of these ways:

### Option A: Set in `.env` (Best for Permanent / Team-wide Direct Connection)
1. Open [.env](file:///g:/AnjeloPrograms/ITSystem/.env) in the root directory.
2. Set your Web App URL:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
3. Whenever the system loads, it will connect directly to Google Drive on startup!

### Option B: Configure via the App UI
1. Open your IT System application.
2. Click the **Database Status** pill in the top right navbar to open the **Relational Database & Cloud Sync Hub**.
3. In the **Google Drive Cloud Database** section, paste your **Web app URL**.
4. Click **Test Connection** (or **Save**). The system will immediately activate Google Drive as your primary live database!
5. If your Google Sheet is newly created, click **Push Current Data to Google Drive** to seed all 19 relational tables.

---

## Part 3: Deploying to GitHub Pages

### Step 1: Enable GitHub Pages in your Repository
1. Push this branch or merge into `main`:
   ```bash
   git add .
   git commit -m "Add GitHub Pages & Google Drive cloud database integration"
   git push origin issue05
   ```
2. Go to your repository on [GitHub](https://github.com).
3. Click **Settings > Pages** (in the left sidebar).
4. Under **Build and deployment > Source**, select: **GitHub Actions**.
5. Every time you push to `main` or `issue05`, the included GitHub Action (`.github/workflows/deploy.yml`) will automatically build and publish your site!

### Step 2: Access Your Live Site
Your live public site will be accessible at:
```
https://<your-github-username>.github.io/<repository-name>/
```

---

## How It Works in Daily Use

- **Add or Edit Data on Website**: Updates are saved directly to your Google Spreadsheet in Drive.
- **Upload a Bill PDF**: The PDF is automatically saved into an `IT_System_Invoices` folder in your Google Drive and linked in the database.
- **Edit Directly in Google Drive**: You can open the `IT_Asset_Database` spreadsheet in Google Drive anytime, update rows, and your website will load the updated data!
- **Download/Export**: You can still export to an offline `.xlsx` file anytime using the *Export (.xlsx)* button.
