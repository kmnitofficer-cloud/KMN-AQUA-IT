import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load .env from current directory or project root
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
elif (current_dir / ".env").exists():
    load_dotenv(dotenv_path=current_dir / ".env")
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

# -----------------------------------------------------------------------------
# Production Fallback Defaults (Ensures zero-crash launch on Streamlit Cloud)
# -----------------------------------------------------------------------------
DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5aKkqbVd-O10MGlWimVDMtToFbAXPZ6zGtPX8aLdBXF-x3KVH-Gn07CAPp25sNmw/exec"
DEFAULT_INVOICES_FOLDER_ID = "1vgrHwewH0tTGwG0NMLzHRQioazXiAamD"
DEFAULT_ADMIN_USERNAME = "kmnaquaitadmin"
DEFAULT_ADMIN_PASSWORD = "(adminaqua30@IT)"
DEFAULT_USER_USERNAME = "user"
DEFAULT_USER_PASSWORD = "(useraqua30@IT)"

# 1. Google Apps Script Web App Endpoint
GOOGLE_APPS_SCRIPT_URL = (
    get_config_val("GOOGLE_APPS_SCRIPT_URL", "VITE_GOOGLE_APPS_SCRIPT_URL") 
    or DEFAULT_APPS_SCRIPT_URL
)

# 2. Google Drive Invoices Folder ID
INVOICES_FOLDER_ID = (
    get_config_val("GOOGLE_DRIVE_INVOICES_FOLDER_ID", "INVOICES_FOLDER_ID") 
    or DEFAULT_INVOICES_FOLDER_ID
)

# 3. Optional Shared Secret Token for Google Apps Script authorization
GOOGLE_APPS_SCRIPT_SECRET_TOKEN = get_config_val("GOOGLE_APPS_SCRIPT_SECRET_TOKEN", "APPS_SCRIPT_TOKEN")

# 4. Streamlit Authentication Credentials
ADMIN_USERNAME = get_config_val("ADMIN_USERNAME", "VITE_ADMIN_USERNAME") or DEFAULT_ADMIN_USERNAME
ADMIN_PASSWORD = get_config_val("ADMIN_PASSWORD", "VITE_ADMIN_PASSWORD") or DEFAULT_ADMIN_PASSWORD

USER_USERNAME = get_config_val("USER_USERNAME", "VITE_USER_USERNAME") or DEFAULT_USER_USERNAME
USER_PASSWORD = get_config_val("USER_PASSWORD", "VITE_USER_PASSWORD") or DEFAULT_USER_PASSWORD

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
