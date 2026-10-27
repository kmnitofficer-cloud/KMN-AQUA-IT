import os
import sys
from pathlib import Path

# Add streamlit_app to sys.path so modules like services, config, views are discovered automatically
ROOT_DIR = Path(__file__).resolve().parent
STREAMLIT_DIR = ROOT_DIR / "streamlit_app"

if str(STREAMLIT_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_DIR))

# Execute main Streamlit app code
entry_file = STREAMLIT_DIR / "app.py"
with open(entry_file, "r", encoding="utf-8") as f:
    code = compile(f.read(), str(entry_file), "exec")
    exec(code, globals())
