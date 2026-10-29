import os
import sys
import base64
import logging
import subprocess
from pathlib import Path

# -----------------------------------------------------------------------------
# 1. BARE-SCRIPT AUTO-LAUNCHER
# -----------------------------------------------------------------------------
try:
    import streamlit as st
    if not (hasattr(st, "runtime") and hasattr(st.runtime, "exists") and st.runtime.exists()):
        current_file = str(Path(__file__).resolve())
        args = [sys.executable, "-m", "streamlit", "run", current_file] + sys.argv[1:]
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        subprocess.run(args, env=env)
        sys.exit(0)
except ImportError:
    print("Error: Streamlit is not installed. Run 'pip install -r requirements.txt'")
    sys.exit(1)

import pandas as pd
import streamlit.components.v1 as components
from config import ADMIN_USERNAME, ADMIN_PASSWORD, USER_USERNAME, USER_PASSWORD, SPREADSHEET_URL, INVOICES_FOLDER_ID
from services.cloud_db import cloud_db

logger = logging.getLogger("streamlit_app")
APP_DIR = Path(__file__).resolve().parent
if APP_DIR.name != "streamlit_app" and (APP_DIR / "streamlit_app").exists():
    STREAMLIT_DIR = APP_DIR / "streamlit_app"
else:
    STREAMLIT_DIR = APP_DIR

if str(STREAMLIT_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_DIR))

# Locate React production build folder
if (STREAMLIT_DIR / "frontend").exists():
    frontend_dir = STREAMLIT_DIR / "frontend"
elif (APP_DIR / "frontend").exists():
    frontend_dir = APP_DIR / "frontend"
elif (STREAMLIT_DIR.parent / "dist").exists():
    frontend_dir = STREAMLIT_DIR.parent / "dist"
elif (APP_DIR / "dist").exists():
    frontend_dir = APP_DIR / "dist"
else:
    frontend_dir = STREAMLIT_DIR / "frontend"

# -----------------------------------------------------------------------------
# 2. PAGE CONFIGURATION & 100% TRUE FULLSCREEN BLEED CSS (Zero Streamlit Chrome)
# -----------------------------------------------------------------------------
try:
    st.set_page_config(
        page_title="KMN IT Asset & Relational System",
        page_icon="🏢",
        layout="wide",
        initial_sidebar_state="collapsed"
    )
except Exception:
    pass

st.markdown("""
<style>
  /* =========================================================================
     1. COMPLETELY HIDE ALL STREAMLIT CHROME (Header, Footer, Toolbar, Sidebar)
     ========================================================================= */
  #MainMenu,
  header,
  footer,
  [data-testid="stHeader"],
  [data-testid="stToolbar"],
  [data-testid="stDecoration"],
  [data-testid="stStatusWidget"],
  [data-testid="stBottom"],
  section[data-testid="stSidebar"],
  [data-testid="collapsedControl"],
  .stAppDeployButton {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
  }

  /* =========================================================================
     2. ZERO OUT VIEWPORT MARGINS & OVERFLOW ON ALL ROOT CONTAINERS
     ========================================================================= */
  html, body {
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      background: #0f172a !important;
  }

  #root,
  .stApp,
  [data-testid="stApp"],
  [data-testid="stAppViewContainer"],
  [data-testid="stAppViewBlockContainer"],
  section.main,
  [data-testid="stMain"],
  [data-testid="stMainBlockContainer"],
  .block-container,
  [data-testid="stVerticalBlock"],
  [data-testid="stVerticalBlockBorderWrapper"],
  div.element-container,
  [data-testid="stElementContainer"] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      min-width: 100vw !important;
      min-height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      border: none !important;
      box-sizing: border-box !important;
      gap: 0 !important;
  }

  /* =========================================================================
     3. PIN THE COMPONENT CONTAINER & IFRAME TO TRUE FIXED 100% FULLSCREEN
     ========================================================================= */
  div[data-testid="stCustomComponentV1"],
  div[data-testid="stCustomComponentV1"] iframe,
  iframe[title*="kmn_ui"],
  iframe[data-testid="stIFrame"],
  iframe {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      min-width: 100vw !important;
      min-height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      border: 0 !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 999999 !important;
      display: block !important;
      overflow: hidden !important;
      background: #0f172a !important;
  }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# 3. DECLARE CUSTOM STREAMLIT COMPONENT (Vite React Build)
# -----------------------------------------------------------------------------
kmn_ui = components.declare_component("kmn_ui", path=str(frontend_dir))

# Session state defaults
if "user_role" not in st.session_state:
    st.session_state.user_role = "Administrator"
if "username" not in st.session_state:
    st.session_state.username = ADMIN_USERNAME or "Administrator"
if "last_event_id" not in st.session_state:
    st.session_state.last_event_id = None
if "last_result" not in st.session_state:
    st.session_state.last_result = None

# Verify frontend build exists
if not (frontend_dir / "index.html").exists():
    st.error("React production build (`frontend/index.html`) not found. Please run `npm run build`.")
    st.stop()

# -----------------------------------------------------------------------------
# 4. FETCH & SERIALIZE RELATIONAL TABLES TO JSON-SAFE PAYLOAD
# -----------------------------------------------------------------------------
try:
    raw_tables = cloud_db.fetch_all_tables()
except Exception as e:
    logger.error(f"Could not connect to Google Cloud: {e}")
    raw_tables = cloud_db._cache or {}

data_payload = {}
for tbl, df in raw_tables.items():
    if df is not None and not df.empty:
        records = df.fillna("").to_dict(orient="records")
        safe_records = []
        for r in records:
            safe_r = {}
            for k, v in r.items():
                if pd.isna(v) or v is None:
                    safe_r[k] = ""
                elif hasattr(v, "item"):
                    safe_r[k] = v.item()
                elif isinstance(v, (pd.Timestamp, pd.Period)):
                    safe_r[k] = str(v)
                else:
                    safe_r[k] = v
            safe_records.append(safe_r)
        data_payload[tbl] = safe_records
    else:
        data_payload[tbl] = []

# -----------------------------------------------------------------------------
# 5. RENDER REACT APP FULLSCREEN & HANDLE BI-DIRECTIONAL EVENTS
# -----------------------------------------------------------------------------
event = kmn_ui(
    tables=data_payload,
    last_result=st.session_state.get("last_result"),
    user={"role": st.session_state.user_role, "username": st.session_state.username},
    key="kmn_ui",
    default=None
)

# Handle events from the React application once only
if event and isinstance(event, dict) and event.get("id"):
    event_id = event["id"]
    if event_id != st.session_state.get("last_event_id"):
        st.session_state.last_event_id = event_id
        action = event.get("action")
        is_admin = (st.session_state.user_role == "Administrator")

        try:
            # Role validation: Viewers are strictly read-only
            if not is_admin and action != "refresh":
                st.session_state.last_result = {
                    "id": event_id,
                    "success": False,
                    "error": "Unauthorized: Viewer role is read-only. Modification rejected."
                }
            elif action == "save_record":
                tbl = event.get("table")
                rec = event.get("record", {})
                id_key = event.get("id_key", "ID")

                # Auto-generate next sequential ID on Python side if missing
                if not rec.get(id_key):
                    prefix_map = {
                        "Assets": "AST-",
                        "Users": "USR-",
                        "Printers": "PRN-",
                        "Invoices": "INV-",
                        "Repairs": "REP-",
                        "Parts": "PRT-",
                        "Expenses": "EXP-",
                        "CCTVBills": "CTV-",
                        "ACUnits": "AC-",
                        "ACServices": "ACS-",
                        "ACRepairs": "ACR-",
                        "ACReplacements": "ACX-",
                    }
                    prefix = prefix_map.get(tbl, f"{tbl[:3].upper()}-")
                    rec[id_key] = cloud_db.generate_next_id(tbl, prefix, id_key)

                res = cloud_db.save_record(tbl, rec, id_key=id_key)
                if not res.get("success", False):
                    raise RuntimeError(res.get("error", f"Failed to save record in {tbl}"))

                st.session_state.last_result = {
                    "id": event_id,
                    "success": True,
                    "data": rec
                }

            elif action == "delete_record":
                tbl = event.get("table")
                id_key = event.get("id_key", "ID")
                id_val = event.get("id_value")
                res = cloud_db.delete_record(tbl, id_key, id_val)
                if not res.get("success", False):
                    raise RuntimeError(res.get("error", f"Failed to delete record in {tbl}"))

                st.session_state.last_result = {
                    "id": event_id,
                    "success": True
                }

            elif action == "update_table":
                tbl = event.get("table")
                recs = event.get("records", [])
                res = cloud_db.update_table(tbl, recs)
                if not res.get("success", False):
                    raise RuntimeError(res.get("error", f"Failed to update table {tbl}"))

                st.session_state.last_result = {
                    "id": event_id,
                    "success": True
                }

            elif action == "upload_file":
                filename = event.get("filename", "Invoice.pdf")
                b64_data = event.get("base64Data", "")
                mime_type = event.get("mimeType", "application/pdf")
                inv_data = event.get("invoiceData") or {}

                if "base64," in b64_data:
                    b64_data = b64_data.split("base64,")[1]

                file_bytes = base64.b64decode(b64_data)

                # Validate file size (<= 10 MB)
                if len(file_bytes) > 10 * 1024 * 1024:
                    raise ValueError(f"File size ({len(file_bytes) / (1024*1024):.2f} MB) exceeds maximum allowed limit of 10 MB.")

                # Validate file extension
                allowed_exts = (".pdf", ".png", ".jpg", ".jpeg")
                if not any(filename.lower().endswith(ext) for ext in allowed_exts):
                    raise ValueError("Invalid file format. Allowed file types: PDF, PNG, JPG.")

                # Generate sequential InvoiceID on Python side if missing
                if inv_data and not inv_data.get("InvoiceID"):
                    inv_data["InvoiceID"] = cloud_db.generate_next_id("Invoices", "INV-", "InvoiceID")

                upload_res = cloud_db.upload_file(
                    name=filename,
                    mime=mime_type,
                    file_bytes=file_bytes,
                    invoice_data=inv_data
                )

                if not upload_res.get("success", False):
                    raise RuntimeError(upload_res.get("error", "File upload failed"))

                st.session_state.last_result = {
                    "id": event_id,
                    "success": True,
                    "data": upload_res
                }

            elif action == "refresh":
                cloud_db.fetch_all_tables(force_refresh=True)
                st.session_state.last_result = {
                    "id": event_id,
                    "success": True,
                    "message": "Database refreshed"
                }
            else:
                st.session_state.last_result = {
                    "id": event_id,
                    "success": False,
                    "error": f"Unknown action: {action}"
                }
        except Exception as exc:
            logger.error(f"Error handling event {action}: {exc}")
            st.session_state.last_result = {
                "id": event_id,
                "success": False,
                "error": str(exc)
            }

        st.rerun()
