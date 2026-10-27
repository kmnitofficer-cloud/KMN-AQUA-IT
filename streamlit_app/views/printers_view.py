import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.drive_vault import drive_vault
from services.reconciliation_engine import reconciliation_engine

def render_printers():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">🖨️ Printer Fleet & Toner Consumables</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Network printers, cartridge models, consumption tracking, and replacement logs
        </p>
    </div>
    """, unsafe_allow_html=True)

    printers_df = cloud_db.get_table("Printers")
    consumables_df = cloud_db.get_table("Consumables")
    assets_df = cloud_db.get_table("Assets")
    locations_df = cloud_db.get_table("Locations")

    loc_map = dict(zip(locations_df["LocationID"], locations_df["OfficeName"])) if not locations_df.empty and "LocationID" in locations_df.columns and "OfficeName" in locations_df.columns else {}

    # Fleet Overview
    st.subheader("📋 Active Network Printers")
    if not printers_df.empty:
        disp_printers = printers_df.copy()
        disp_printers["Office"] = disp_printers["LocationID"].map(lambda l: loc_map.get(l, l))
        show_cols = [c for c in ["PrinterName", "IPAddress", "Office", "TonerCartridgeModel", "Status", "AssetID", "PrinterID"] if c in disp_printers.columns]
        st.dataframe(disp_printers[show_cols], use_container_width=True, hide_index=True)
    else:
        st.info("No printer profiles registered.")

    st.markdown("---")
    
    # 2 Columns: Log New Toner Replacement & Consumable History
    col_log, col_history = st.columns([1, 1])

    with col_log:
        st.subheader("🖋️ Log Toner / Cartridge Replacement")
        st.caption("Automatically calculates costs and connects PDF bill to Google Drive")

        with st.form("log_toner_form", clear_on_submit=True):
            printer_options = []
            if not printers_df.empty:
                for _, p in printers_df.iterrows():
                    printer_options.append(f"{p.get('PrinterName')} [{p.get('AssetID', p.get('PrinterID'))}]")

            sel_printer = st.selectbox("Select Target Printer *", printer_options if printer_options else ["No Printers Found"])
            c1, c2 = st.columns(2)
            with c1:
                csm_type = st.selectbox("Consumable Type", ["Black Toner", "Cyan Toner", "Magenta Toner", "Yellow Toner", "Maintenance Box", "Drum Unit"])
                brand = st.text_input("Brand", value="Canon")
                qty = st.number_input("Quantity", min_value=1, value=1, step=1)
            with c2:
                model = st.text_input("Cartridge Model *", placeholder="e.g. Cartridge 337, HP 85A")
                unit_price = st.number_input("Unit Price (LKR) *", min_value=0.0, value=6500.0, step=500.0)
                vendor = st.text_input("Supplier / Vendor", value="KMN IT Solution")

            total_calc = qty * unit_price
            st.info(f"💵 **Calculated Total Cost: Rs. {total_calc:,.2f}**")

            # PDF Bill attachment for this toner
            st.markdown("##### 📄 Attach Supplier Invoice (Auto-Upload to Drive)")
            bill_file = st.file_uploader("Upload PDF Bill", type=["pdf"], key="toner_bill_upload")
            inv_number = st.text_input("Invoice / Bill Number", placeholder="e.g. INV-2026-901")
            notes = st.text_input("Notes / Installed By", value="Installed by IT Officer")

            submitted = st.form_submit_button("🚀 Record Replacement & Sync to Cloud")
            if submitted:
                if not sel_printer or "No Printers" in sel_printer:
                    st.error("Please select a valid printer.")
                elif not model.strip() or unit_price <= 0:
                    st.error("Please specify cartridge model and price.")
                else:
                    # Extract AssetID
                    ast_id = sel_printer.split("[")[1].replace("]", "").strip() if "[" in sel_printer else ""
                    today_str = pd.Timestamp.now().strftime("%Y-%m-%d")
                    invoice_id = ""

                    # 1. Upload PDF to Google Drive if provided
                    if bill_file is not None:
                        with st.spinner("Uploading PDF bill to Google Drive folder..."):
                            upload_res = drive_vault.upload_pdf(
                                file_bytes=bill_file.getvalue(),
                                filename=bill_file.name,
                                invoice_data={
                                    "InvoiceNumber": inv_number or f"INV-TONER-{pd.Timestamp.now().strftime('%m%d%H%M')}",
                                    "InvoiceDate": today_str,
                                    "Supplier": vendor,
                                    "Amount": total_calc,
                                    "AssetID": ast_id,
                                    "PrinterAssetID": ast_id,
                                    "Description": f"{csm_type} for printer ({model})"
                                }
                            )
                            if upload_res.get("success"):
                                st.success("📁 PDF Bill uploaded directly to Google Drive!")
                                invoice_id = upload_res.get("invoice", {}).get("InvoiceID", "")
                            else:
                                st.warning(f"Could not upload to Drive: {upload_res.get('error')}")

                    # 2. Save to Consumables Sheet
                    csm_id = cloud_db.generate_next_id("Consumables", "CSM-", "TransactionID")
                    new_csm = {
                        "TransactionID": csm_id,
                        "PrinterAssetID": ast_id,
                        "ConsumableType": csm_type,
                        "Brand": brand,
                        "Model": model.strip(),
                        "Quantity": qty,
                        "Date": today_str,
                        "UnitCost": unit_price,
                        "TotalCost": total_calc,
                        "Supplier": vendor,
                        "InvoiceID": invoice_id or inv_number,
                        "InstalledBy": notes,
                        "Notes": f"Recorded via Streamlit Cloud Hub on {today_str}"
                    }

                    res = cloud_db.save_record("Consumables", new_csm, id_key="TransactionID")
                    if res.get("success"):
                        st.success(f"✅ Toner replacement `{csm_id}` saved directly to Google Sheets!")
                        st.rerun()
                    else:
                        st.error(f"Failed to update Google Sheet: {res.get('error')}")

    with col_history:
        st.subheader("📜 Consumable Consumption History")
        if not consumables_df.empty:
            disp_csm = consumables_df.copy()
            show_cols = [c for c in ["Date", "PrinterAssetID", "ConsumableType", "Model", "Quantity", "TotalCost", "Supplier", "InvoiceID"] if c in disp_csm.columns]
            st.dataframe(disp_csm[show_cols].head(12), use_container_width=True, hide_index=True)
            
            # Lifetime cost calculation by printer
            st.markdown("##### 📊 Lifetime Consumables by Printer")
            csm_summary = consumables_df.groupby("PrinterAssetID")["TotalCost"].sum().reset_index()
            csm_summary["TotalCost"] = pd.to_numeric(csm_summary["TotalCost"], errors="coerce").fillna(0)
            csm_summary = csm_summary.sort_values(by="TotalCost", ascending=False)
            st.dataframe(csm_summary, use_container_width=True, hide_index=True)
        else:
            st.info("No consumable transactions found.")
