import os
import sys
from pathlib import Path

# Add streamlit_app to sys.path if not present
_parent = str(Path(__file__).resolve().parent.parent)
if _parent not in sys.path:
    sys.path.insert(0, _parent)

import json
import base64
import logging
import requests
import pandas as pd
from typing import Dict, List, Any, Optional

try:
    from config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID, GOOGLE_APPS_SCRIPT_SECRET_TOKEN, TABLE_NAMES
except ImportError:
    from streamlit_app.config import GOOGLE_APPS_SCRIPT_URL, INVOICES_FOLDER_ID, GOOGLE_APPS_SCRIPT_SECRET_TOKEN, TABLE_NAMES

logger = logging.getLogger(__name__)

class CloudDatabaseService:
    def __init__(self, script_url: str = GOOGLE_APPS_SCRIPT_URL, secret_token: str = GOOGLE_APPS_SCRIPT_SECRET_TOKEN):
        self.script_url = script_url
        self.secret_token = secret_token
        self._cache: Dict[str, pd.DataFrame] = {}
        self.is_connected = False
        self.last_sync_time: Optional[str] = None

    def _get_auth_params(self, base_params: Dict[str, Any]) -> Dict[str, Any]:
        params = dict(base_params)
        if self.secret_token:
            params["token"] = self.secret_token
        return params

    def _get_auth_payload(self, base_payload: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(base_payload)
        if self.secret_token:
            payload["token"] = self.secret_token
        return payload

    def test_connection(self) -> Dict[str, Any]:
        """Verifies connection with the Google Apps Script Web App."""
        try:
            params = self._get_auth_params({"action": "test", "_t": pd.Timestamp.now().timestamp()})
            res = requests.get(
                self.script_url,
                params=params,
                timeout=20,
                headers={"User-Agent": "Streamlit-ITSystem/1.0"}
            )
            res.raise_for_status()
            data = res.json()
            self.is_connected = data.get("success", False)
            return data
        except Exception as e:
            self.is_connected = False
            return {"success": False, "error": str(e)}

    def fetch_all_tables(self, force_refresh: bool = False) -> Dict[str, pd.DataFrame]:
        """
        Fetches the complete 19-table relational database from Google Sheets.
        Caches in memory so subsequent views are instant.
        """
        if not force_refresh and self._cache:
            return self._cache

        try:
            params = self._get_auth_params({"action": "getDatabase", "_t": pd.Timestamp.now().timestamp()})
            res = requests.get(
                self.script_url,
                params=params,
                timeout=60,
                headers={"User-Agent": "Streamlit-ITSystem/1.0"}
            )
            res.raise_for_status()
            data = res.json()
            if not data.get("success", False):
                raise RuntimeError(data.get("error", "Unknown error from Google Apps Script"))

            raw_db = data.get("data", {})
            parsed_cache = {}

            for tbl in TABLE_NAMES:
                records = raw_db.get(tbl, [])
                df = pd.DataFrame(records)
                if df.empty:
                    df = pd.DataFrame()
                parsed_cache[tbl] = df

            self._cache = parsed_cache
            self.is_connected = True
            self.last_sync_time = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
            return self._cache
        except Exception as e:
            logger.error(f"Error fetching database: {e}")
            raise e

    def get_table(self, table_name: str, force_refresh: bool = False) -> pd.DataFrame:
        """Returns a single table as a pandas DataFrame."""
        if force_refresh or not self._cache:
            self.fetch_all_tables(force_refresh=force_refresh)
        return self._cache.get(table_name, pd.DataFrame()).copy()

    def update_table(self, table_name: str, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Pushes an updated table to Google Sheets via POST.
        Updates local memory cache immediately for zero-lag UI response.
        """
        payload = self._get_auth_payload({
            "action": "updateTable",
            "tableName": table_name,
            "table": table_name,
            "records": records
        })
        try:
            res = requests.post(
                self.script_url,
                json=payload,
                timeout=45,
                headers={"Content-Type": "application/json", "User-Agent": "Streamlit-ITSystem/1.0"}
            )
            res.raise_for_status()
            data = res.json()
            if data.get("success", False):
                self._cache[table_name] = pd.DataFrame(records)
                self.last_sync_time = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
            return data
        except Exception as e:
            logger.error(f"Error updating table {table_name}: {e}")
            return {"success": False, "error": str(e)}

    def save_record(self, table_name: str, record: Dict[str, Any], id_key: str = "ID") -> Dict[str, Any]:
        """
        Saves or inserts a single record in the given table.
        """
        table_df = self.get_table(table_name)
        records = table_df.to_dict(orient="records") if not table_df.empty else []

        id_val = str(record.get(id_key, "")).strip()
        updated = False

        if id_val:
            for idx, item in enumerate(records):
                if str(item.get(id_key, "")).strip() == id_val:
                    records[idx] = {**item, **record}
                    updated = True
                    break

        if not updated:
            records.append(record)

        return self.update_table(table_name, records)

    def delete_record(self, table_name: str, id_key: str, id_value: Any) -> Dict[str, Any]:
        """
        Deletes a single record matching id_key == id_value.
        """
        table_df = self.get_table(table_name)
        if table_df.empty:
            return {"success": True, "message": "Table is empty"}

        records = table_df.to_dict(orient="records")
        target_str = str(id_value).strip()
        filtered = [r for r in records if str(r.get(id_key, "")).strip() != target_str]

        if len(filtered) == len(records):
            return {"success": True, "message": "Record not found (already deleted)"}

        return self.update_table(table_name, filtered)

    def upload_file(self, name: str, mime: str, file_bytes: bytes, invoice_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Uploads a PDF/Image file to Google Drive folder using the Web App.
        """
        try:
            b64_string = base64.b64encode(file_bytes).decode("utf-8")
            payload = self._get_auth_payload({
                "action": "uploadInvoice",
                "folderId": INVOICES_FOLDER_ID,
                "filename": name,
                "base64Data": b64_string,
                "invoiceData": invoice_data or {},
                "fileData": {
                    "name": name,
                    "mimeType": mime,
                    "base64": b64_string
                },
                "invoice": invoice_data or {}
            })
            res = requests.post(
                self.script_url,
                json=payload,
                timeout=60,
                headers={"Content-Type": "application/json", "User-Agent": "Streamlit-ITSystem/1.0"}
            )
            res.raise_for_status()
            data = res.json()

            if data.get("success", False) and invoice_data:
                file_url = data.get("fileUrl", "")
                invoice_data["GoogleDriveUrl"] = file_url
                inv_df = self.get_table("Invoices")
                inv_records = inv_df.to_dict(orient="records") if not inv_df.empty else []
                inv_id = invoice_data.get("InvoiceID")
                found = False
                for i, inv in enumerate(inv_records):
                    if str(inv.get("InvoiceID")) == str(inv_id):
                        inv_records[i] = {**inv, **invoice_data}
                        found = True
                        break
                if not found:
                    inv_records.append(invoice_data)
                self.update_table("Invoices", inv_records)

            return data
        except Exception as e:
            logger.error(f"Error uploading file {name}: {e}")
            return {"success": False, "error": str(e)}

    def generate_next_id(self, table_name: str, prefix: str, id_col: str = "ID") -> str:
        """Generates the next sequential ID (e.g. AST-0042) based on current max numeric suffix."""
        df = self.get_table(table_name)
        if df.empty or id_col not in df.columns:
            return f"{prefix}0001"

        highest = 0
        for val in df[id_col].dropna().astype(str):
            clean = val.strip()
            if clean.startswith(prefix):
                num_part = clean[len(prefix):]
                if num_part.isdigit():
                    num = int(num_part)
                    if num > highest:
                        highest = num

        next_num = highest + 1
        return f"{prefix}{next_num:04d}"

# Global singleton
cloud_db = CloudDatabaseService()
