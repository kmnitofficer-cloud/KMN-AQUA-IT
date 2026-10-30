import os
import sys
from pathlib import Path

# Add streamlit_app to sys.path if not present
_parent = str(Path(__file__).resolve().parent.parent)
if _parent not in sys.path:
    sys.path.insert(0, _parent)

import base64
import json
import logging
import requests
import streamlit as st
from typing import Dict, Any, Optional

try:
    from config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID
except ImportError:
    from streamlit_app.config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID

logger = logging.getLogger(__name__)

class DriveVaultService:
    def __init__(self, script_url: str = GOOGLE_APPS_SCRIPT_URL, folder_id: str = INVOICES_FOLDER_ID):
        self.script_url = script_url
        self.folder_id = folder_id

    def upload_pdf(self, file_bytes: bytes, filename: str, invoice_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Uploads a PDF file directly to Google Drive using the Apps Script Web App.
        Google Apps Script automatically places it into the IT_System_Invoices folder,
        sets link sharing, and registers it in the Invoices tab.
        """
        if not file_bytes:
            return {"success": False, "error": "Empty file provided"}

        clean_name = "".join(c for c in filename if c.isalnum() or c in "._- ")
        if not clean_name.lower().endswith(".pdf"):
            clean_name += ".pdf"

        base64_data = base64.b64encode(file_bytes).decode("utf-8")
        payload = {
            "action": "uploadInvoice",
            "folderId": self.folder_id,
            "filename": clean_name,
            "base64Data": base64_data,
            "invoiceData": invoice_data or {},
            "fileData": {
                "name": clean_name,
                "mimeType": "application/pdf",
                "base64": base64_data
            },
            "invoice": invoice_data or {}
        }

        try:
            res = requests.post(
                self.script_url,
                json=payload,
                timeout=45,
                headers={"Content-Type": "application/json"}
            )
            res.raise_for_status()
            result = res.json()
            return result
        except Exception as e:
            logger.error(f"Failed to upload invoice to Drive: {e}")
            return {"success": False, "error": str(e)}

    def get_invoices(self) -> list:
        """
        Fetches the current Invoices table from Google Sheets.
        """
        try:
            res = requests.get(
                self.script_url,
                params={"action": "getDatabase"},
                timeout=30
            )
            res.raise_for_status()
            data = res.json()
            if data.get("success", False):
                return data.get("data", {}).get("Invoices", [])
            return []
        except Exception as e:
            logger.error(f"Failed to fetch invoices: {e}")
            return []

    def get_public_url(self, file_id: str) -> str:
        """Constructs direct Google Drive web view URL from file ID."""
        return f"https://drive.google.com/file/d/{file_id}/view?usp=drivesdk"

# Global singleton
drive_vault = DriveVaultService()
