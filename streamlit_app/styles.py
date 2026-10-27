import streamlit as st

def apply_custom_styles():
    st.markdown("""
    <style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Main container tweaks */
    .block-container {
        padding-top: 1.8rem;
        padding-bottom: 3rem;
        max-width: 96% !important;
    }

    /* Top banner */
    .app-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%);
        color: white;
        padding: 1.6rem 2rem;
        border-radius: 16px;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .app-header h1 {
        color: #ffffff !important;
        font-size: 1.75rem !important;
        font-weight: 800 !important;
        margin: 0 !important;
        padding: 0 !important;
        letter-spacing: -0.02em;
    }
    .app-header p {
        color: #94a3b8 !important;
        font-size: 0.9rem !important;
        margin: 0.3rem 0 0 0 !important;
    }

    /* Modern KPI Cards */
    .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.3rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.08);
    }
    .kpi-title {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
        margin-bottom: 0.4rem;
    }
    .kpi-value {
        font-size: 1.7rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;
    }
    .kpi-subtitle {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 600;
        margin-top: 0.4rem;
    }

    /* Badge Pills */
    .badge {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 9999px;
        text-align: center;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-neutral { background: #f1f5f9; color: #475569; }

    /* Drive Vault Container */
    .drive-container {
        border: 2px dashed #93c5fd;
        border-radius: 14px;
        background: #f8fafc;
        padding: 1.5rem;
        text-align: center;
        margin-bottom: 1.2rem;
    }

    /* Form Card */
    .form-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    /* Button enhancements */
    div.stButton > button:first-child {
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        padding: 10px 18px;
    }
    </style>
    """, unsafe_allow_html=True)
