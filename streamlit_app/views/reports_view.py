import io
import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.reconciliation_engine import reconciliation_engine

def render_reports():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">📈 Management Reports & Excel Exports</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Generate and export fully formatted spreadsheets for internal audit and executive review
        </p>
    </div>
    """, unsafe_allow_html=True)

    reports = [
        {"id": "asset_register", "name": "Master IT Asset Register", "desc": "Complete hardware register with serial numbers, tags, statuses, and purchase costs."},
        {"id": "user_register", "name": "Employee Equipment Ledger", "desc": "All assets currently held by staff, plus repair & expense allocations."},
        {"id": "assignment_history", "name": "Chain of Custody History", "desc": "Audit trail of all equipment issuances, transfers, and handovers."},
        {"id": "repairs", "name": "Repair & Maintenance Cost Report", "desc": "Detailed service actions, vendors, faulty parts, and repair charges."},
        {"id": "printers", "name": "Printer Toner & Consumables Statement", "desc": "Lifetime consumable consumption, unit prices, and printer upkeep costs."},
        {"id": "cctv", "name": "CCTV & Office Bills Statement", "desc": "Chilaw and Palawiya surveillance connectivity, router, and repair bills."},
        {"id": "expenses", "name": "Comprehensive Financial Ledger", "desc": "Itemized operational expenditures sorted by category and vendor."},
        {"id": "warranties", "name": "Warranty Expiration Schedule", "desc": "All active and upcoming warranty dates with days remaining."},
    ]

    selected_report = st.selectbox("Select Report to Generate:", [r["name"] for r in reports])
    rep_meta = next(r for r in reports if r["name"] == selected_report)
    st.info(f"ℹ️ {rep_meta['desc']}")

    # Generate data based on report id
    rep_id = rep_meta["id"]
    df_export = pd.DataFrame()

    if rep_id == "asset_register":
        df_export = cloud_db.get_table("Assets")
    elif rep_id == "user_register":
        users_df = cloud_db.get_table("Users")
        rows = []
        for _, u in users_df.iterrows():
            uid = u.get("UserID", "")
            cost_summary = reconciliation_engine.get_user_cost_summary(uid)
            rows.append({
                "User ID": uid,
                "Employee Name": u.get("Name", ""),
                "Status": u.get("Status", "Active"),
                "Active Assets Count": cost_summary["current_assets_count"],
                "Current Assets Value (LKR)": cost_summary["current_assets_value"],
                "Repairs Incurred (LKR)": cost_summary["repairs_cost"],
                "Direct Expenses (LKR)": cost_summary["direct_expenses"],
                "Total Associated Cost (LKR)": cost_summary["total_associated_cost"]
            })
        df_export = pd.DataFrame(rows)
    elif rep_id == "assignment_history":
        df_export = cloud_db.get_table("Assignments")
    elif rep_id == "repairs":
        df_export = cloud_db.get_table("Repairs")
    elif rep_id == "printers":
        df_export = cloud_db.get_table("Consumables")
    elif rep_id == "cctv":
        df_export = cloud_db.get_table("CCTVBills")
    elif rep_id == "expenses":
        df_export = cloud_db.get_table("Expenses")
    elif rep_id == "warranties":
        df_export = cloud_db.get_table("Parts")

    if not df_export.empty:
        st.dataframe(df_export.head(10), use_container_width=True, hide_index=True)
        st.caption(f"Total rows in report: **{len(df_export)}**")

        # Excel export buffer
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df_export.to_excel(writer, index=False, sheet_name=rep_meta["id"][:31])

        st.download_button(
            label=f"📥 Download {rep_meta['name']} (.xlsx)",
            data=buffer.getvalue(),
            file_name=f"{rep_meta['id']}_{pd.Timestamp.now().strftime('%Y%m%d')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            type="primary"
        )
    else:
        st.warning("No data found for this report.")
