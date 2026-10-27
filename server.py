import os
import sys
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

# Add streamlit_app to sys.path so we can reuse our tested cloud_db, drive_vault & reconciliation services
APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR / "streamlit_app"))

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd

from services.cloud_db import cloud_db
from services.drive_vault import drive_vault
from services.reconciliation_engine import reconciliation_engine
from config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID, TABLE_NAMES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("it-system-backend")

app = FastAPI(title="KMN IT System - Cloud Host & API", version="2.0")

# Enable CORS for local dev and preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST_DIR = APP_DIR / "dist"
ASSETS_DIR = DIST_DIR / "assets"

# -----------------------------------------------------------------------------
# 1. DATABASE API (100% Cloud-Backed via Google Sheets, 0% Local Database)
# -----------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "cloud_connected": cloud_db.is_connected,
        "script_url": GOOGLE_APPS_SCRIPT_URL,
        "invoices_folder_id": INVOICES_FOLDER_ID
    }

@app.get("/api/database")
async def get_database(refresh: bool = False):
    """
    Returns all 19 relational tables directly from Google Sheets.
    Cached in memory for instant responsiveness.
    """
    try:
        data_cache = cloud_db.fetch_all_tables(force_refresh=refresh)
        serializable_data = {}
        for tbl, df in data_cache.items():
            if not df.empty:
                # Replace NaN with empty string
                clean_df = df.fillna("")
                serializable_data[tbl] = clean_df.to_dict(orient="records")
            else:
                serializable_data[tbl] = []

        return {"success": True, "data": serializable_data, "source": "google_sheets_cloud"}
    except Exception as e:
        logger.error(f"Failed to fetch database from Google Sheets: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/database/save")
async def save_database(request: Request):
    """Saves the entire database to Google Sheets."""
    try:
        body = await request.json()
        database = body.get("database", {})
        if not database:
            raise HTTPException(status_code=400, detail="Missing database payload")

        # Save each provided table
        for tbl, records in database.items():
            if tbl in TABLE_NAMES and isinstance(records, list):
                cloud_db.update_table(tbl, records)

        return {"success": True, "message": "All tables saved to Google Sheets cloud!"}
    except Exception as e:
        logger.error(f"Failed to save database: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/database/table/{table_name}")
async def update_single_table(table_name: str, request: Request):
    """Updates a single sheet tab in Google Sheets."""
    try:
        body = await request.json()
        records = body.get("records", [])
        res = cloud_db.update_table(table_name, records)
        return res
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# -----------------------------------------------------------------------------
# 2. GOOGLE DRIVE AUTOMATIC PDF UPLOAD & PREVIEW API
# -----------------------------------------------------------------------------

@app.post("/api/invoices/upload")
async def upload_invoice(request: Request):
    """
    Accepts PDF file (Base64) from React frontend, streams it straight to
    Google Drive dedicated folder, makes it viewable with link, and registers
    it in the Invoices sheet tab. Returns live Drive preview & download URLs.
    """
    try:
        body = await request.json()
        filename = body.get("filename", "Invoice.pdf")
        base64_data = body.get("base64Data", "")
        invoice_data = body.get("invoiceData", {})

        if not base64_data:
            return JSONResponse(status_code=400, content={"success": False, "error": "No base64 file data"})

        import base64
        # Remove data URI prefix if present
        if "base64," in base64_data:
            base64_data = base64_data.split("base64,")[1]

        file_bytes = base64.b64decode(base64_data)

        # Upload directly to Google Drive via DriveVault service
        result = drive_vault.upload_pdf(
            file_bytes=file_bytes,
            filename=filename,
            invoice_data=invoice_data
        )

        if not result.get("success"):
            return JSONResponse(status_code=500, content={"success": False, "error": result.get("error")})

        # Also refresh in-memory cache so React sees the new invoice immediately
        cloud_db.fetch_all_tables(force_refresh=True)

        return result
    except Exception as e:
        logger.error(f"Error handling invoice upload: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/drive/sync")
async def sync_drive_files():
    """Syncs any invoices manually dropped into Google Drive folder."""
    try:
        res = drive_vault.sync_drive_folder()
        cloud_db.fetch_all_tables(force_refresh=True)
        return res
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# -----------------------------------------------------------------------------
# 3. FINANCIAL CALCULATION & RECONCILIATION API (PANDAS ENGINE)
# -----------------------------------------------------------------------------

@app.get("/api/reconciliation")
async def get_financial_audit():
    """
    Returns mathematical financial reconciliation with zero double-counting.
    Calculated via Pandas engine.
    """
    try:
        summary = reconciliation_engine.get_financial_summary()
        return {"success": True, "summary": summary}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# -----------------------------------------------------------------------------
# 4. REACT FRONTEND STATIC HOSTING
# -----------------------------------------------------------------------------

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# Serve public invoices or icons if in dist
if (DIST_DIR / "invoices").exists():
    app.mount("/invoices", StaticFiles(directory=str(DIST_DIR / "invoices")), name="invoices")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """Serves the React frontend single-page application."""
    target_file = DIST_DIR / full_path
    if target_file.is_file():
        return FileResponse(str(target_file))

    index_html = DIST_DIR / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html))

    return JSONResponse(status_code=404, content={"error": "React build (dist/index.html) not found. Run 'npm run build' first."})


if __name__ == "__main__":
    import socket

    def is_port_in_use(p: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(("127.0.0.1", p)) == 0

    requested_port = int(os.getenv("PORT", 8000))
    port = requested_port

    if is_port_in_use(port):
        for candidate in range(port + 1, port + 10):
            if not is_port_in_use(candidate):
                print(f"\n⚠️ Note: Port {requested_port} is already in use by another process. Automatically using port {candidate} instead.")
                port = candidate
                break

    print(f"\n============================================================================")
    print(f"  KMN IT SYSTEM - REACT FRONTEND HOSTED BY PYTHON BACKEND")
    print(f"============================================================================")
    print(f"  • Frontend UI: React Production Build (dist/)")
    print(f"  • Backend Engine: Python FastAPI + Pandas Reconciliation")
    print(f"  • Cloud Database: Google Sheets (0% Local Database)")
    print(f"  • Cloud Vault: Google Drive Invoices Folder")
    print(f"  • Live URL: http://localhost:{port}")
    print(f"============================================================================\n")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)

