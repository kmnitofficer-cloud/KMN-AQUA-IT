@echo off
title KMN IT Management System - Launcher
cls
echo ============================================================================
echo   KMN IT MANAGEMENT SYSTEM - REACT UI + PYTHON STREAMLIT ENGINE
echo ============================================================================
echo   Cloud Database: Google Sheets (0%% Local Database)
echo   Cloud Vault:    Google Drive Invoices Folder
echo ============================================================================
echo.
echo   Select launch mode:
echo   [1] Start Python Fast Server (React UI @ http://localhost:8000)
echo   [2] Start Streamlit Hub (Python Streamlit @ http://localhost:8501)
echo   [3] Rebuild React Production Bundle (npm run build)
echo   [4] Exit
echo.
set /p choice="Enter option [1-4] (default is 1): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto start_streamlit
if "%choice%"=="3" goto build_react
if "%choice%"=="4" goto exit_app

:start_server
echo.
echo Starting Python Backend Server...
start http://localhost:8000
python server.py
pause
goto exit_app

:start_streamlit
echo.
echo Starting Streamlit Cloud Hub...
start http://localhost:8501
python -m streamlit run streamlit_app/app.py
pause
goto exit_app

:build_react
echo.
echo Rebuilding React Production Bundle...
npm run build
echo.
echo Copying production assets to static folder...
if not exist static mkdir static
xcopy /E /Y /I dist static
echo Build complete!
pause
goto exit_app

:exit_app
exit
