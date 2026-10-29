"""
Root Streamlit Entrypoint
Delegates execution directly to streamlit_app/app.py
"""
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
STREAMLIT_DIR = ROOT_DIR / "streamlit_app"
ENTRY_FILE = STREAMLIT_DIR / "app.py"

if str(STREAMLIT_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    try:
        import streamlit as st
        if not (hasattr(st, "runtime") and hasattr(st.runtime, "exists") and st.runtime.exists()):
            cmd = [sys.executable, "-m", "streamlit", "run", str(ENTRY_FILE)] + sys.argv[1:]
            subprocess.run(cmd)
            sys.exit(0)
    except ImportError:
        pass

# When run via `streamlit run app.py`
with open(ENTRY_FILE, "r", encoding="utf-8") as f:
    code = compile(f.read(), str(ENTRY_FILE), "exec")
    exec(code, globals())
