import os
import sys
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

# Configure page
st.set_page_config(
    page_title="KMN Aqua Services – Office IT Asset System",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="collapsed"
)

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
STREAMLIT_DIR = ROOT_DIR / "streamlit_app"

if str(STREAMLIT_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_DIR))

# Sidebar mode switcher (defaults to your React Production Web App)
mode = st.sidebar.radio(
    "Application Mode",
    ["🌐 React Production Web App (index.html)", "📊 Python Streamlit Hub"],
    index=0
)

if "React" in mode:
    # Fullscreen layout for React Web UI
    st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .block-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
    }
    iframe {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: none;
        z-index: 999999;
    }
    </style>
    """, unsafe_allow_html=True)

    if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
        try:
            # Mount the React build directly from dist/index.html
            react_component = components.declare_component("kmn_react_app", path=str(DIST_DIR))
            react_component()
        except Exception as e:
            # Live GitHub Pages fallback
            components.iframe("https://kmnitofficer-cloud.github.io/KMN-AQUA-IT/", height=1000)
    else:
        components.iframe("https://kmnitofficer-cloud.github.io/KMN-AQUA-IT/", height=1000)

else:
    # Python Streamlit Executive Hub
    entry_file = STREAMLIT_DIR / "app.py"
    with open(entry_file, "r", encoding="utf-8") as f:
        code = compile(f.read(), str(entry_file), "exec")
        exec(code, globals())
