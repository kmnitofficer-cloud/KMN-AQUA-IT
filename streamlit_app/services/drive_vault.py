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

    def render_pdf_viewer(self, target: str, height: int = 520):
        """Renders an inline iframe preview of a Google Drive PDF file or URL."""
        if not target:
            st.warning("No file URL or Drive ID provided for preview.")
            return

        import re
        drive_id = ""
        target_str = str(target).strip()
        if re.match(r'^[a-zA-Z0-9_-]{20,}$', target_str):
            drive_id = target_str
        else:
            m = re.search(r'/file/d/([a-zA-Z0-9_-]+)', target_str) or re.search(r'id=([a-zA-Z0-9_-]+)', target_str)
            if m:
                drive_id = m.group(1)

        if drive_id:
            embed_url = f"https://drive.google.com/file/d/{drive_id}/preview"
            view_url = f"https://drive.google.com/file/d/{drive_id}/view?usp=drivesdk"
            st.markdown(
                f'<iframe src="{embed_url}" width="100%" height="{height}" style="border: 1px solid #e2e8f0; border-radius: 8px;" allow="fullscreen"></iframe>',
                unsafe_allow_html=True
            )
            st.markdown(
                f'<div style="margin-top: 0.5rem;"><a href="{view_url}" target="_blank" style="font-size: 0.85rem; color: #0284c7; text-decoration: none; font-weight: 600;">↗️ Open Document in Google Drive Tab</a></div>',
                unsafe_allow_html=True
            )
        elif target_str.startswith("http"):
            st.markdown(
                f'<iframe src="{target_str}" width="100%" height="{height}" style="border: 1px solid #e2e8f0; border-radius: 8px;" allow="fullscreen"></iframe>',
                unsafe_allow_html=True
            )
        else:
            st.info(f"Document registered: {target_str}")

    def sync_drive_folder(self) -> Dict[str, Any]:
        """Triggers a scan of the Google Drive folder via Apps Script."""
        try:
            res = requests.get(
                self.script_url,
                params={"action": "syncDriveFolder", "folderId": self.folder_id},
                timeout=45
            )
            res.raise_for_status()
            return res.json()
        except Exception as e:
            logger.error(f"Failed to sync drive folder: {e}")
            return {"success": False, "error": str(e)}

# Global singleton
drive_vault = DriveVaultService()
