import os
import sys
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

# Configure page layout
st.set_page_config(
    page_title="KMN Aqua Services – Office IT Asset System",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="collapsed"
)

ROOT_DIR = Path(__file__).resolve().parent
STATIC_DIR = ROOT_DIR / "static"
DIST_DIR = ROOT_DIR / "dist"
STREAMLIT_DIR = ROOT_DIR / "streamlit_app"

if str(STREAMLIT_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_DIR))

# Ensure static folder has the built React files for Streamlit Cloud static serving
if not STATIC_DIR.exists():
    import shutil
    STATIC_DIR.mkdir(exist_ok=True)
    if DIST_DIR.exists():
        for item in DIST_DIR.iterdir():
            if item.is_file():
                shutil.copy(item, STATIC_DIR / item.name)
            elif item.is_dir() and item.name == "assets":
                shutil.copytree(item, STATIC_DIR / "assets", dirs_exist_ok=True)

# Mode selector in sidebar
mode = st.sidebar.radio(
    "Application Mode",
    ["🌐 React Production Web App (index.html)", "📊 Python Streamlit Hub"],
    index=0
)

if "React" in mode:
    # Fullscreen layout
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
        width: 100vw;
        height: 100vh;
        border: none;
    }
    </style>
    """, unsafe_allow_html=True)

    # Use standard iframe pointing to Streamlit Cloud's static server (No component timeout error!)
    components.iframe("/app/static/index.html", height=950, scrolling=True)

else:
    # Python Streamlit Executive Hub
    entry_file = STREAMLIT_DIR / "app.py"
    with open(entry_file, "r", encoding="utf-8") as f:
        code = compile(f.read(), str(entry_file), "exec")
        exec(code, globals())
