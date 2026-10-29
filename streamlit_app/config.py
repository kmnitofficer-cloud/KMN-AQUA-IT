import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load .env from current directory or project root
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Streamlit Cloud secrets support fallback helper
def get_config_val(key: str, alt_key: str = "") -> str:
    val = os.getenv(key) or (os.getenv(alt_key) if alt_key else None)
    if not val:
        try:
            import streamlit as st
            if hasattr(st, "secrets"):
                val = st.secrets.get(key) or (st.secrets.get(alt_key) if alt_key else None)
        except Exception:
            pass
    return (val or "").strip().strip('"').strip("'")

# 1. Google Apps Script Web App Endpoint
GOOGLE_APPS_SCRIPT_URL = get_config_val("GOOGLE_APPS_SCRIPT_URL", "VITE_GOOGLE_APPS_SCRIPT_URL")
if not GOOGLE_APPS_SCRIPT_URL:
    raise RuntimeError(
        "Missing required configuration: GOOGLE_APPS_SCRIPT_URL. "
        "Please define it in your .env file or Streamlit secrets."
    )

# 2. Google Drive Invoices Folder ID
INVOICES_FOLDER_ID = get_config_val("GOOGLE_DRIVE_INVOICES_FOLDER_ID", "INVOICES_FOLDER_ID")
if not INVOICES_FOLDER_ID:
    raise RuntimeError(
        "Missing required configuration: GOOGLE_DRIVE_INVOICES_FOLDER_ID. "
        "Please define it in your .env file or Streamlit secrets."
    )

# 3. Optional Shared Secret Token for Google Apps Script authorization
GOOGLE_APPS_SCRIPT_SECRET_TOKEN = get_config_val("GOOGLE_APPS_SCRIPT_SECRET_TOKEN", "APPS_SCRIPT_TOKEN")

# 4. Streamlit Authentication Credentials
ADMIN_USERNAME = get_config_val("ADMIN_USERNAME", "VITE_ADMIN_USERNAME") or "kmnaquaitadmin"
ADMIN_PASSWORD = get_config_val("ADMIN_PASSWORD", "VITE_ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise RuntimeError(
        "Missing required configuration: ADMIN_PASSWORD. "
        "Please define it in your .env file or Streamlit secrets."
    )

USER_USERNAME = get_config_val("USER_USERNAME", "VITE_USER_USERNAME") or "user"
USER_PASSWORD = get_config_val("USER_PASSWORD", "VITE_USER_PASSWORD")
if not USER_PASSWORD:
    raise RuntimeError(
        "Missing required configuration: USER_PASSWORD. "
        "Please define it in your .env file or Streamlit secrets."
    )

SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1BAgaC2W6_nVhwQZ82hFhT5JgiN2pcRW1j8YzqjXs1m8/edit"

TABLE_NAMES = [
    "Users",
    "Departments",
    "Locations",
    "Assets",
    "AssetComponents",
    "Assignments",
    "Printers",
    "Consumables",
    "Repairs",
    "Parts",
    "Expenses",
    "Invoices",
    "Suppliers",
    "CCTVBills",
    "ACUnits",
    "ACServices",
    "ACRepairs",
    "ACReplacements",
    "LegacyRawImport",
]
