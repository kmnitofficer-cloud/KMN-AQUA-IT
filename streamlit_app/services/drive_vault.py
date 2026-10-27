import base64
import json
import logging
import requests
import streamlit as st
from typing import Dict, Any, Optional
from config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID

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
            "filename": clean_name,
            "base64Data": base64_data,
            "folderId": self.folder_id,
            "invoiceData": invoice_data or {}
        }

        try:
            res = requests.post(
                self.script_url,
                data=json.dumps(payload),
                headers={"Content-Type": "text/plain;charset=utf-8"},
                timeout=60
            )
            res.raise_for_status()
            data = res.json()
            return data
        except Exception as e:
            logger.error(f"Failed to upload PDF to Google Drive: {e}")
            return {"success": False, "error": str(e)}

    def sync_drive_folder(self) -> Dict[str, Any]:
        """Synchronizes all PDF files present in the Google Drive Invoices Folder with the Invoices sheet."""
        payload = {
            "action": "syncFolderFiles",
            "folderId": self.folder_id
        }

        try:
            res = requests.post(
                self.script_url,
                data=json.dumps(payload),
                headers={"Content-Type": "text/plain;charset=utf-8"},
                timeout=60
            )
            res.raise_for_status()
            return res.json()
        except Exception as e:
            logger.error(f"Error syncing Drive folder: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def render_pdf_viewer(url_or_file_id: str, height: int = 580):
        """
        Renders an interactive in-line PDF viewer for Google Drive documents.
        Supports full URLs or direct Google Drive File IDs.
        """
        if not url_or_file_id:
            st.info("📄 No PDF document attached to preview.")
            return

        clean_ref = str(url_or_file_id).strip()

        # Extract file ID if full URL is passed
        file_id = ""
        if "/d/" in clean_ref:
            try:
                file_id = clean_ref.split("/d/")[1].split("/")[0]
            except Exception:
                pass
        elif "id=" in clean_ref:
            try:
                file_id = clean_ref.split("id=")[1].split("&")[0]
            except Exception:
                pass
        elif len(clean_ref) > 20 and "/" not in clean_ref:
            file_id = clean_ref

        if file_id:
            preview_url = f"https://drive.google.com/file/d/{file_id}/preview"
            view_url = f"https://drive.google.com/file/d/{file_id}/view"
            download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        else:
            preview_url = clean_ref
            view_url = clean_ref
            download_url = clean_ref

        # Action toolbar above preview
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.caption(f"🔗 **Google Drive Document Link**")
        with col2:
            st.link_button("↗️ Open in Drive", view_url, use_container_width=True)
        with col3:
            st.link_button("⬇️ Direct Download", download_url, use_container_width=True)

        # Embedded iframe
        iframe_html = f"""
        <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
            <iframe 
                src="{preview_url}" 
                width="100%" 
                height="{height}px" 
                style="border: none; background: #f8fafc;" 
                allow="autoplay">
            </iframe>
        </div>
        """
        st.components.v1.html(iframe_html, height=height + 20)


# Global singleton
drive_vault = DriveVaultService()
