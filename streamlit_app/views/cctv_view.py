import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.drive_vault import drive_vault

def render_cctv():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">📹 CCTV Surveillance & Office Utilities</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Security camera infrastructure, monthly connection bills, maintenance, and hardware replacements
        </p>
    </div>
    """, unsafe_allow_html=True)

    cctv_df = cloud_db.get_table("CCTVBills")

    t1, t2 = st.tabs(["📋 CCTV Bills Statement", "➕ Log New CCTV / Office Bill"])

    with t1:
        if not cctv_df.empty:
            # Summary by office
            o_col1, o_col2 = st.columns(2)
            cctv_amt = pd.to_numeric(cctv_df.get("Amount", pd.Series()), errors="coerce").fillna(0)
            
            with o_col1:
                chilaw_bills = cctv_df[cctv_df.get("Office", pd.Series()).str.contains("Chilaw", case=False, na=False)]
                chilaw_sum = pd.to_numeric(chilaw_bills.get("Amount", pd.Series()), errors="coerce").fillna(0).sum()
                st.markdown(f"""
                <div class="kpi-card">
                    <div class="kpi-title">Chilaw Office Surveillance</div>
                    <div class="kpi-value">Rs. {chilaw_sum:,.2f}</div>
                    <div class="kpi-subtitle">Total Incurred Bills: {len(chilaw_bills)}</div>
                </div>
                """, unsafe_allow_html=True)

            with o_col2:
                palawiya_bills = cctv_df[cctv_df.get("Office", pd.Series()).str.contains("Palawiya", case=False, na=False)]
                palawiya_sum = pd.to_numeric(palawiya_bills.get("Amount", pd.Series()), errors="coerce").fillna(0).sum()
                st.markdown(f"""
                <div class="kpi-card">
                    <div class="kpi-title">Palawiya Office Surveillance</div>
                    <div class="kpi-value">Rs. {palawiya_sum:,.2f}</div>
                    <div class="kpi-subtitle">Total Incurred Bills: {len(palawiya_bills)}</div>
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
            show_cols = [c for c in ["BillDate", "Office", "BillNumber", "BillCategory", "Supplier", "Amount", "Description", "PaymentStatus"] if c in cctv_df.columns]
            st.dataframe(cctv_df[show_cols], use_container_width=True, hide_index=True)
        else:
            st.info("No CCTV bills recorded.")

    with t2:
        st.subheader("➕ Record CCTV Internet or Maintenance Bill")
        with st.form("add_cctv_form", clear_on_submit=True):
            c1, c2 = st.columns(2)
            with c1:
                office = st.selectbox("Office Location *", ["Chilaw Office", "Palawiya Office"])
                bill_no = st.text_input("Bill / Account Number *", placeholder="e.g. SLT-0322254321")
                category = st.selectbox("Category", ["CCTV Internet / Connectivity", "Hardware Replacement", "DVR / NVR Repair", "Camera Installation", "Maintenance"])
                supplier = st.text_input("Service Vendor / ISP", value="SLT Mobitel")
            with c2:
                b_date = st.date_input("Billing Date")
                amount = st.number_input("Bill Amount (LKR) *", min_value=0.0, step=500.0)
                period = st.text_input("Billing Period", placeholder="e.g. October 2026")
                pay_method = st.selectbox("Payment Method", ["Company Cheque", "Direct Bank Transfer", "Petty Cash"])

            desc = st.text_input("Description / Notes", placeholder="e.g. Monthly fiber router connection for remote CCTV live stream")
            cctv_pdf = st.file_uploader("Attach PDF Bill (Auto-Upload to Google Drive)", type=["pdf"])

            submitted = st.form_submit_button("🚀 Save CCTV Bill to Google Sheets")
            if submitted:
                if not bill_no.strip() or amount <= 0:
                    st.error("Please provide both Bill Number and Amount.")
                else:
                    b_id = cloud_db.generate_next_id("CCTVBills", "CTV-", "BillID")
                    today_str = str(b_date)
                    file_path = ""
                    drive_id = ""

                    if cctv_pdf is not None:
                        with st.spinner("Uploading CCTV bill to Google Drive..."):
                            up_res = drive_vault.upload_pdf(
                                file_bytes=cctv_pdf.getvalue(),
                                filename=cctv_pdf.name,
                                invoice_data={
                                    "InvoiceNumber": bill_no.strip(),
                                    "InvoiceDate": today_str,
                                    "Supplier": supplier.strip(),
                                    "Amount": amount,
                                    "Description": f"[CCTV - {office}] {desc.strip()}"
                                }
                            )
                            if up_res.get("success"):
                                file_path = up_res.get("fileUrl", "")
                                drive_id = up_res.get("invoice", {}).get("DriveFileID", "")

                    new_bill = {
                        "BillID": b_id,
                        "Office": office.replace(" Office", ""),
                        "BillNumber": bill_no.strip(),
                        "BillDate": today_str,
                        "BillPeriod": period.strip(),
                        "BillCategory": category,
                        "Supplier": supplier.strip(),
                        "Amount": amount,
                        "PaymentStatus": "Paid",
                        "PaymentMethod": pay_method,
                        "Description": desc.strip(),
                        "FileName": cctv_pdf.name if cctv_pdf else "",
                        "FilePath": file_path,
                        "DriveFileID": drive_id
                    }

                    res = cloud_db.save_record("CCTVBills", new_bill, id_key="BillID")
                    if res.get("success"):
                        st.success(f"🎉 CCTV bill `{b_id}` saved successfully to Google Sheets!")
                        st.rerun()
                    else:
                        st.error(f"Error saving to Google Sheets: {res.get('error')}")
