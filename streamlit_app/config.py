import os
from dotenv import load_dotenv

# Load root .env file if available
load_dotenv()

GOOGLE_APPS_SCRIPT_URL = os.getenv(
    "VITE_GOOGLE_APPS_SCRIPT_URL",
    "https://script.google.com/macros/s/AKfycbw5aKkqbVd-O10MGlWimVDMtToFbAXPZ6zGtPX8aLdBXF-x3KVH-Gn07CAPp25sNmw/exec"
).strip('"').strip("'")

INVOICES_FOLDER_ID = os.getenv(
    "GOOGLE_DRIVE_INVOICES_FOLDER_ID",
    "1vgrHwewH0tTGwG0NMLzHRQioazXiAamD"
).strip('"').strip("'")

SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1BAgaC2W6_nVhwQZ82hFhT5JgiN2pcRW1j8YzqjXs1m8/edit"

# Credentials
ADMIN_USERNAME = os.getenv("VITE_ADMIN_USERNAME", "kmnaquaitadmin")
ADMIN_PASSWORD = os.getenv("VITE_ADMIN_PASSWORD", "(adminaqua30@IT)")
USER_USERNAME = os.getenv("VITE_USER_USERNAME", "user")
USER_PASSWORD = os.getenv("VITE_USER_PASSWORD", "(useraqua30@IT)")

# Streamlit Cloud secrets support
try:
    import streamlit as st
    if hasattr(st, "secrets"):
        GOOGLE_APPS_SCRIPT_URL = st.secrets.get("GOOGLE_APPS_SCRIPT_URL", GOOGLE_APPS_SCRIPT_URL)
        INVOICES_FOLDER_ID = st.secrets.get("INVOICES_FOLDER_ID", INVOICES_FOLDER_ID)
        ADMIN_USERNAME = st.secrets.get("ADMIN_USERNAME", ADMIN_USERNAME)
        ADMIN_PASSWORD = st.secrets.get("ADMIN_PASSWORD", ADMIN_PASSWORD)
        USER_USERNAME = st.secrets.get("USER_USERNAME", USER_USERNAME)
        USER_PASSWORD = st.secrets.get("USER_PASSWORD", USER_PASSWORD)
except Exception:
    pass

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
