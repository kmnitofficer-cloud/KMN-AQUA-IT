import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.drive_vault import drive_vault
from config import INVOICES_FOLDER_ID

def render_drive_vault():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">📁 Google Drive Cloud PDF Bill Vault</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Automatic cloud uploads to dedicated Google Drive folder • Real-time in-line preview • 100% Zero local disk storage
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Top Toolbar
    t_col1, t_col2 = st.columns([3, 1])
    with t_col1:
        st.caption(f"📂 Google Drive Storage Folder ID: `{INVOICES_FOLDER_ID}`")
    with t_col2:
        if st.button("🔄 Sync with Google Drive Folder", width="stretch"):
            with st.spinner("Scanning Google Drive folder for newly added bills..."):
                sync_res = drive_vault.sync_drive_folder()
                if sync_res.get("success"):
                    st.success(sync_res.get("message", "Drive folder synchronized successfully!"))
                    cloud_db.fetch_all_tables(force_refresh=True)
                    st.rerun()
                else:
                    st.error(f"Sync failed: {sync_res.get('error')}")

    # Tabs: In-line Viewer vs Upload New Bill
    tab_view, tab_upload = st.tabs(["👁️ In-line PDF Previewer & Catalog", "📤 Upload New Bill to Google Drive"])

    invoices_df = cloud_db.get_table("Invoices")

    with tab_view:
        if invoices_df.empty:
            st.info("No bills recorded yet. Use the 'Upload New Bill' tab to upload your first PDF.")
        else:
            # Filter and search
            s_col1, s_col2 = st.columns([2, 1])
            with s_col1:
                search_term = st.text_input("🔍 Search Invoices by Supplier, Invoice #, or Device:", placeholder="e.g. DI61077, KMN, Canon, AST-0010...")
            with s_col2:
                suppliers = ["All"] + sorted([s for s in invoices_df.get("Supplier", pd.Series()).dropna().unique() if s])
                selected_supplier = st.selectbox("Filter by Supplier:", suppliers)

            filtered_inv = invoices_df.copy()
            if selected_supplier != "All":
                filtered_inv = filtered_inv[filtered_inv["Supplier"] == selected_supplier]
            if search_term.strip():
                q = search_term.strip().lower()
                cols = ["InvoiceNumber", "Supplier", "FileName", "Description", "AssetID", "InvoiceID"]
                mask = pd.Series(False, index=filtered_inv.index)
                for c in cols:
                    if c in filtered_inv.columns:
                        mask = mask | filtered_inv[c].astype(str).str.lower().str.contains(q, na=False)
                filtered_inv = filtered_inv[mask]

            st.caption(f"Showing **{len(filtered_inv)}** verified invoices")

            # Split layout: Catalog on Left, Live PDF Viewer on Right
            cat_col, preview_col = st.columns([1, 1])

            with cat_col:
                st.markdown("##### 📑 Select Invoice to Inspect")
                # Create selectable options
                inv_options = []
                for _, r in filtered_inv.iterrows():
                    amt = float(pd.to_numeric(str(r.get("Amount", 0)).replace(",", ""), errors="coerce") or 0)
                    inv_options.append(f"{r.get('InvoiceNumber', r.get('InvoiceID'))} — {r.get('Supplier')} (Rs. {amt:,.0f})")

                if inv_options:
                    selected_label = st.selectbox("Choose Bill:", inv_options, index=0)
                    chosen_idx = inv_options.index(selected_label)
                    chosen_invoice = filtered_inv.iloc[chosen_idx].to_dict()

                    # Invoice details card
                    st.markdown(f"""
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.2rem; margin-top: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                        <h4 style="margin: 0 0 0.5rem 0; color: #0369a1;">{chosen_invoice.get('InvoiceNumber', chosen_invoice.get('InvoiceID'))}</h4>
                        <div style="font-size: 0.88rem; line-height: 1.6; color: #334155;">
                            <div>• <strong>Supplier:</strong> {chosen_invoice.get('Supplier', 'General')}</div>
                            <div>• <strong>Invoice Date:</strong> {chosen_invoice.get('InvoiceDate', 'N/A')}</div>
                            <div>• <strong>Amount:</strong> <span style="font-weight: 800; color: #0284c7;">Rs. {float(pd.to_numeric(str(chosen_invoice.get('Amount', 0)).replace(',', ''), errors='coerce') or 0):,.2f}</span></div>
                            <div>• <strong>Target Asset:</strong> {chosen_invoice.get('AssetID') or chosen_invoice.get('PrinterAssetID') or 'General Office'}</div>
                            <div>• <strong>Document Name:</strong> <code>{chosen_invoice.get('FileName', 'N/A')}</code></div>
                            <div>• <strong>Description:</strong> {chosen_invoice.get('Description', 'None')}</div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    chosen_invoice = None

            with preview_col:
                st.markdown("##### 📄 Google Drive In-line Preview")
                if chosen_invoice:
                    preview_target = (
                        chosen_invoice.get("FilePath")
                        or chosen_invoice.get("DriveUrl")
                        or chosen_invoice.get("DriveFileID")
                        or ""
                    )
                    drive_vault.render_pdf_viewer(preview_target, height=520)
                else:
                    st.info("Select an invoice to preview.")

    with tab_upload:
        st.markdown("""
        <div class="drive-container">
            <h3 style="margin: 0 0 0.5rem 0; color: #1e3a8a;">☁️ Automatic Cloud PDF Uploader</h3>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
                Drop any vendor bill or receipt here. Python streams it directly to your Google Drive folder and registers it in Google Sheets.
            </p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("drive_upload_form", clear_on_submit=True):
            uploaded_file = st.file_uploader("Select PDF Bill *", type=["pdf"])

            u_col1, u_col2 = st.columns(2)
            with u_col1:
                inv_no = st.text_input("Invoice / Bill Number *", placeholder="e.g. DI61080")
                supplier = st.text_input("Supplier / Vendor *", placeholder="e.g. KMN IT Solution, Dialog, Singer")
                amount = st.number_input("Invoice Total Amount (LKR) *", min_value=0.0, step=500.0)
            with u_col2:
                inv_date = st.date_input("Invoice Date")
                assets_df = cloud_db.get_table("Assets")
                ast_list = ["None / General IT"] + [f"{a.get('VerifiedNo')} - {a.get('Model')} ({a.get('AssetID')})" for _, a in assets_df.iterrows()]
                related_asset = st.selectbox("Associated Equipment", ast_list)
                description = st.text_input("Description / Purchased Items", placeholder="e.g. 2x Kingston 512GB SSD for accounting PCs")

            auto_expense = st.checkbox("Automatically record matching operational expense entry", value=True)

            upload_btn = st.form_submit_button("🚀 Upload Directly to Google Drive & Save Record")
            if upload_btn:
                if uploaded_file is None:
                    st.error("Please choose a PDF file to upload.")
                elif not inv_no.strip() or not supplier.strip() or amount <= 0:
                    st.error("Please fill in Invoice Number, Supplier, and Amount.")
                else:
                    ast_id = ""
                    if "(" in related_asset:
                        ast_id = related_asset.split("(")[1].replace(")", "").strip()

                    invoice_metadata = {
                        "InvoiceNumber": inv_no.strip(),
                        "InvoiceDate": str(inv_date),
                        "Supplier": supplier.strip(),
                        "Amount": amount,
                        "AssetID": ast_id,
                        "Description": description.strip() or f"Invoice {inv_no.strip()} from {supplier.strip()}",
                        "createMatchingExpense": auto_expense
                    }

                    with st.spinner("Uploading PDF directly to Google Drive..."):
                        res = drive_vault.upload_pdf(
                            file_bytes=uploaded_file.getvalue(),
                            filename=uploaded_file.name,
                            invoice_data=invoice_metadata
                        )

                        if res.get("success"):
                            st.success(f"🎉 Bill uploaded to Google Drive! File ID: `{res.get('invoice', {}).get('DriveFileID', 'Generated')}`")
                            st.caption(f"Preview URL: {res.get('fileUrl')}")
                            # Refresh local cache
                            cloud_db.fetch_all_tables(force_refresh=True)
                            st.rerun()
                        else:
                            st.error(f"Upload failed: {res.get('error')}")
