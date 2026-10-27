import streamlit as st
import pandas as pd
from styles import apply_custom_styles
from config import ADMIN_USERNAME, ADMIN_PASSWORD, USER_USERNAME, USER_PASSWORD, SPREADSHEET_URL, INVOICES_FOLDER_ID
from services.cloud_db import cloud_db

# Page configuration (guarded if already invoked)
try:
    st.set_page_config(
        page_title="KMN IT Asset & Cloud Vault Hub",
        page_icon="🏢",
        layout="wide",
        initial_sidebar_state="expanded"
    )
except Exception:
    pass

# Apply global CSS design system
apply_custom_styles()

# Authentication state
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "user_role" not in st.session_state:
    st.session_state.user_role = None
if "username" not in st.session_state:
    st.session_state.username = None

# Login View if not authenticated
if not st.session_state.authenticated:
    st.markdown("""
    <div style="max-width: 480px; margin: 4rem auto 0 auto; text-align: center;">
        <div style="background: #0f172a; padding: 2rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); color: white;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏢</div>
            <h2 style="color: white; margin: 0; font-weight: 800; letter-spacing: -0.02em;">KMN IT System</h2>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.3rem;">Google Drive Cloud Vault & Asset Management Hub</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    with st.container():
        st.markdown("<div style='max-width: 480px; margin: 1rem auto 0 auto;' class='form-box'>", unsafe_allow_html=True)
        login_tab1, login_tab2 = st.tabs(["🔑 Sign In", "⚡ Quick Demo Access"])

        with login_tab1:
            u_input = st.text_input("Username", key="login_user")
            p_input = st.text_input("Password", type="password", key="login_pass")

            if st.button("Sign In to Cloud Hub", type="primary", use_container_width=True):
                if u_input == ADMIN_USERNAME and p_input == ADMIN_PASSWORD:
                    st.session_state.authenticated = True
                    st.session_state.user_role = "Administrator"
                    st.session_state.username = u_input
                    st.rerun()
                elif u_input == USER_USERNAME and p_input == USER_PASSWORD:
                    st.session_state.authenticated = True
                    st.session_state.user_role = "Viewer"
                    st.session_state.username = u_input
                    st.rerun()
                else:
                    st.error("Invalid username or password.")

        with login_tab2:
            st.caption("Select your role for direct instant access:")
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("👑 Admin Login", use_container_width=True):
                    st.session_state.authenticated = True
                    st.session_state.user_role = "Administrator"
                    st.session_state.username = ADMIN_USERNAME
                    st.rerun()
            with col_b:
                if st.button("👁️ Viewer Login", use_container_width=True):
                    st.session_state.authenticated = True
                    st.session_state.user_role = "Viewer"
                    st.session_state.username = USER_USERNAME
                    st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)
    st.stop()


# -----------------------------------------------------------------------------
# MAIN AUTHENTICATED APPLICATION
# -----------------------------------------------------------------------------

# Initial Cloud Data Fetch (Cached)
if not cloud_db._cache:
    with st.spinner("Connecting to Google Sheets Cloud Database..."):
        try:
            cloud_db.fetch_all_tables()
        except Exception as e:
            st.error(f"Could not connect to Google Cloud: {e}")

# Sidebar
with st.sidebar:
    st.markdown("""
    <div style="padding: 0.5rem 0 1rem 0;">
        <h3 style="margin: 0; font-weight: 800; color: #0f172a; font-size: 1.3rem;">🏢 KMN IT Hub</h3>
        <p style="margin: 0.1rem 0 0 0; font-size: 0.78rem; color: #64748b;">Cloud Drive & Sheets Architecture</p>
    </div>
    """, unsafe_allow_html=True)

    # Status Pill
    if cloud_db.is_connected:
        st.markdown("""
        <div style="background: #dcfce7; color: #166534; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1.2rem; display: inline-flex; align-items: center; gap: 6px;">
            <span>🟢</span> <span>Google Cloud Live</span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="background: #fee2e2; color: #991b1b; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1.2rem; display: inline-flex; align-items: center; gap: 6px;">
            <span>🔴</span> <span>Cloud Disconnected</span>
        </div>
        """, unsafe_allow_html=True)

    # Navigation menu
    menu_options = [
        "📊 Dashboard",
        "💻 Assets Register",
        "🖨️ Printers & Toner",
        "🔧 Repairs & Service",
        "📁 Drive PDF Vault",
        "📹 CCTV & Utilities",
        "💰 Financial Audit",
        "📈 Reports & Exports"
    ]

    selected_nav = st.radio("Navigation", menu_options, label_visibility="collapsed")

    st.markdown("<hr style='margin: 1.5rem 0 1rem 0;'>", unsafe_allow_html=True)

    # Refresh Button
    if st.button("🔄 Refresh Data from Google Cloud", use_container_width=True):
        with st.spinner("Fetching latest updates from Google Sheets..."):
            cloud_db.fetch_all_tables(force_refresh=True)
            st.success("Synchronized with Google Sheets!")
            st.rerun()

    # User profile & logout
    st.markdown(f"""
    <div style="margin-top: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.8rem;">
        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Active Session</div>
        <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">{st.session_state.username}</div>
        <div style="font-size: 0.75rem; color: #0284c7; font-weight: 600;">Role: {st.session_state.user_role}</div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("🚪 Sign Out", use_container_width=True):
        st.session_state.authenticated = False
        st.session_state.user_role = None
        st.session_state.username = None
        st.rerun()


# Route to selected page view
from views.dashboard_view import render_dashboard
from views.assets_view import render_assets
from views.printers_view import render_printers
from views.repairs_view import render_repairs
from views.drive_vault_view import render_drive_vault
from views.cctv_view import render_cctv
from views.audit_view import render_audit
from views.reports_view import render_reports

if "Dashboard" in selected_nav:
    render_dashboard()
elif "Assets" in selected_nav:
    render_assets()
elif "Printers" in selected_nav:
    render_printers()
elif "Repairs" in selected_nav:
    render_repairs()
elif "Drive PDF" in selected_nav:
    render_drive_vault()
elif "CCTV" in selected_nav:
    render_cctv()
elif "Financial" in selected_nav:
    render_audit()
elif "Reports" in selected_nav:
    render_reports()
