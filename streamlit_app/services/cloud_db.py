import json
import logging
import requests
import pandas as pd
from typing import Dict, List, Any, Optional
from config import GOOGLE_APPS_SCRIPT_URL, TABLE_NAMES

logger = logging.getLogger(__name__)

class CloudDatabaseService:
    def __init__(self, script_url: str = GOOGLE_APPS_SCRIPT_URL):
        self.script_url = script_url
        self._cache: Dict[str, pd.DataFrame] = {}
        self.is_connected = False
        self.last_sync_time: Optional[str] = None

    def test_connection(self) -> Dict[str, Any]:
        """Verifies connection with the Google Apps Script Web App."""
        try:
            res = requests.get(
                self.script_url,
                params={"action": "test", "_t": pd.Timestamp.now().timestamp()},
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
            res = requests.get(
                self.script_url,
                params={"action": "getDatabase", "_t": pd.Timestamp.now().timestamp()},
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
        payload = {
            "action": "updateTable",
            "tableName": table_name,
            "records": records
        }

        try:
            # We send as plain text/json with follow redirects enabled
            res = requests.post(
                self.script_url,
                data=json.dumps(payload),
                headers={"Content-Type": "text/plain;charset=utf-8"},
                timeout=45
            )
            res.raise_for_status()
            data = res.json()
            if data.get("success"):
                # Update in-memory cache
                self._cache[table_name] = pd.DataFrame(records)
            return data
        except Exception as e:
            logger.error(f"Failed to update table {table_name}: {e}")
            return {"success": False, "error": str(e)}

    def save_record(self, table_name: str, record: Dict[str, Any], id_key: str = "ID") -> Dict[str, Any]:
        """Inserts or updates a single record in the specified Google Sheet tab."""
        df = self.get_table(table_name)
        records = df.to_dict(orient="records") if not df.empty else []

        record_id = str(record.get(id_key, "")).strip()
        found_idx = -1

        if record_id:
            for idx, r in enumerate(records):
                if str(r.get(id_key, "")).strip() == record_id:
                    found_idx = idx
                    break

        if found_idx >= 0:
            records[found_idx].update(record)
        else:
            records.insert(0, record)

        return self.update_table(table_name, records)

    def delete_record(self, table_name: str, id_key: str, id_value: str) -> Dict[str, Any]:
        """Deletes a record from the specified Google Sheet tab."""
        df = self.get_table(table_name)
        if df.empty:
            return {"success": True, "message": "Table was empty."}

        records = df.to_dict(orient="records")
        updated_records = [r for r in records if str(r.get(id_key, "")).strip() != str(id_value).strip()]
        return self.update_table(table_name, updated_records)

    def generate_next_id(self, table_name: str, prefix: str, id_key: str) -> str:
        """Generates the next sequential alphanumeric ID, e.g. AST-0086."""
        df = self.get_table(table_name)
        if df.empty or id_key not in df.columns:
            return f"{prefix}0001"

        ids = df[id_key].dropna().astype(str).tolist()
        max_num = 0
        for item in ids:
            digits = "".join(filter(str.isdigit, item))
            if digits:
                num = int(digits)
                if num > max_num:
                    max_num = num

        return f"{prefix}{str(max_num + 1).zfill(4)}"


# Global singleton instance
cloud_db = CloudDatabaseService()
