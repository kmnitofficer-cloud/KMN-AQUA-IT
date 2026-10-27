import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db

def render_repairs():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">🔧 Repairs, Maintenance & Warranty Radar</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Hardware servicing history, component upgrades, and manufacturer warranty tracking
        </p>
    </div>
    """, unsafe_allow_html=True)

    repairs_df = cloud_db.get_table("Repairs")
    parts_df = cloud_db.get_table("Parts")
    assets_df = cloud_db.get_table("Assets")

    tab_repairs, tab_warranty, tab_add = st.tabs([
        "📋 Maintenance Logs",
        "🛡️ Warranty Radar & Parts",
        "➕ Log New Service Record"
    ])

    with tab_repairs:
        if not repairs_df.empty:
            s_col1, s_col2 = st.columns([3, 1])
            with s_col1:
                search_q = st.text_input("🔍 Search Service History:", placeholder="Search by asset, technician, action taken, vendor...")
            with s_col2:
                statuses = ["All"] + sorted([s for s in repairs_df.get("Status", pd.Series()).dropna().unique() if s])
                sel_status = st.selectbox("Status:", statuses)

            filtered_rep = repairs_df.copy()
            if sel_status != "All":
                filtered_rep = filtered_rep[filtered_rep["Status"] == sel_status]
            if search_q.strip():
                q = search_q.strip().lower()
                cols = ["ProblemDescription", "ActionTaken", "RepairSupplier", "Technician", "AssetID", "PartsReplaced"]
                mask = pd.Series(False, index=filtered_rep.index)
                for c in cols:
                    if c in filtered_rep.columns:
                        mask = mask | filtered_rep[c].astype(str).str.lower().str.contains(q, na=False)
                filtered_rep = filtered_rep[mask]

            total_cost = pd.to_numeric(filtered_rep.get("RepairCost", pd.Series()), errors="coerce").fillna(0).sum()
            st.caption(f"Showing **{len(filtered_rep)}** records | Total Filtered Repair Expenditure: **Rs. {total_cost:,.2f}**")

            show_cols = [c for c in ["RepairDate", "AssetID", "ProblemDescription", "ActionTaken", "RepairSupplier", "Technician", "RepairCost", "Status"] if c in filtered_rep.columns]
            st.dataframe(filtered_rep[show_cols], use_container_width=True, hide_index=True)
        else:
            st.info("No repair records logged.")

    with tab_warranty:
        st.subheader("🛡️ Hardware Parts & Warranty Radar")
        if not parts_df.empty:
            today = pd.Timestamp.now()
            enriched_parts = parts_df.copy()

            def compute_warranty(row):
                wend = str(row.get("WarrantyEnd", "")).strip()
                if not wend:
                    return "No Warranty", 9999
                try:
                    edate = pd.to_datetime(wend)
                    days = (edate - today).days
                    if days < 0:
                        return f"🔴 Expired ({abs(days)}d ago)", days
                    elif days <= 60:
                        return f"🟠 Expiring Soon ({days}d left)", days
                    else:
                        return f"🟢 Active ({days}d left)", days
                except Exception:
                    return "Invalid Date", 9999

            results = enriched_parts.apply(compute_warranty, axis=1)
            enriched_parts["WarrantyStatus"] = [r[0] for r in results]
            enriched_parts["SortDays"] = [r[1] for r in results]

            enriched_parts = enriched_parts.sort_values(by="SortDays")

            show_cols = [c for c in ["PartType", "AssetID", "NewPartDetails", "OldPartDetails", "Cost", "WarrantyEnd", "WarrantyStatus", "Supplier"] if c in enriched_parts.columns]
            st.dataframe(enriched_parts[show_cols], use_container_width=True, hide_index=True)
        else:
            st.info("No parts replacement records found.")

    with tab_add:
        st.subheader("➕ Log New Equipment Service Record")
        with st.form("add_repair_form", clear_on_submit=True):
            r_col1, r_col2 = st.columns(2)
            with r_col1:
                ast_opts = [f"{a.get('VerifiedNo')} - {a.get('Model')} ({a.get('AssetID')})" for _, a in assets_df.iterrows()] if not assets_df.empty else ["No Assets"]
                target_ast = st.selectbox("Device Under Repair *", ast_opts)
                problem = st.text_input("Reported Fault / Problem *", placeholder="e.g. CPU not powering on, Blue screen of death")
                action_taken = st.text_input("Action Taken / Resolution", placeholder="e.g. Replaced faulty SMPS power supply")
                supplier = st.text_input("Repair Vendor / Provider", value="KMN IT Solution")
            with r_col2:
                rep_date = st.date_input("Service Date")
                rep_cost = st.number_input("Repair Charge (LKR)", min_value=0.0, step=500.0)
                technician = st.text_input("Technician Name", value="Anjelo (IT Support)")
                status = st.selectbox("Repair Status", ["Completed", "Under Observation", "Pending Parts", "Healthy"])

            parts_replaced = st.text_input("Parts Replaced (if any)", placeholder="e.g. 1x 450W ATX Power Supply")
            notes = st.text_area("Diagnosis / Notes", placeholder="e.g. Tested voltage rails, machine running normally.")

            submitted = st.form_submit_button("💾 Save Service Record to Google Sheets")
            if submitted:
                if not problem.strip():
                    st.error("Please enter the reported problem.")
                else:
                    ast_id = target_ast.split("(")[1].replace(")", "").strip() if "(" in target_ast else ""
                    rep_id = cloud_db.generate_next_id("Repairs", "REP-", "RepairID")

                    new_rep = {
                        "RepairID": rep_id,
                        "AssetID": ast_id,
                        "RepairDate": str(rep_date),
                        "ProblemDescription": problem.strip(),
                        "ActionTaken": action_taken.strip(),
                        "PartsReplaced": parts_replaced.strip(),
                        "RepairSupplier": supplier.strip(),
                        "Technician": technician.strip(),
                        "RepairCost": rep_cost,
                        "Status": status,
                        "Diagnosis": notes.strip(),
                        "Notes": f"Recorded via Streamlit Hub on {rep_date}"
                    }

                    res = cloud_db.save_record("Repairs", new_rep, id_key="RepairID")
                    if res.get("success"):
                        st.success(f"🎉 Service log `{rep_id}` saved directly to Google Sheets!")
                        st.rerun()
                    else:
                        st.error(f"Failed to save record: {res.get('error')}")
