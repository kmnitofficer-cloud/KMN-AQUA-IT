import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.reconciliation_engine import reconciliation_engine

def render_assets():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">💻 IT Asset Register & Chain of Custody</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Full hardware inventory, lifecycle tracking, and equipment allocation
        </p>
    </div>
    """, unsafe_allow_html=True)

    assets_df = cloud_db.get_table("Assets")
    users_df = cloud_db.get_table("Users")
    locations_df = cloud_db.get_table("Locations")
    assignments_df = cloud_db.get_table("Assignments")

    if assets_df.empty:
        st.warning("No assets found in the Google Sheets database.")
        return

    # Enrich assets with User Name & Location Name
    user_map = dict(zip(users_df["UserID"], users_df["Name"])) if not users_df.empty and "UserID" in users_df.columns and "Name" in users_df.columns else {}
    loc_map = dict(zip(locations_df["LocationID"], locations_df["OfficeName"])) if not locations_df.empty and "LocationID" in locations_df.columns and "OfficeName" in locations_df.columns else {}

    enriched = assets_df.copy()
    enriched["AssignedUser"] = enriched["CurrentUserID"].map(lambda u: "🌐 Shared Network" if str(u).strip() == "SHARED_NETWORK" else user_map.get(u, "Unassigned (Storage)"))
    enriched["Location"] = enriched["CurrentLocationID"].map(lambda l: loc_map.get(l, "General Office"))

    # Top search and filter bar
    f_col1, f_col2, f_col3 = st.columns([2, 1, 1])
    with f_col1:
        search_query = st.text_input("🔍 Search Asset by Tag, Model, Serial, or User:", placeholder="e.g. KMN/CH/CP/001, Dell, Hasitha, Printer...")
    with f_col2:
        types = ["All"] + sorted([t for t in enriched.get("AssetType", pd.Series()).dropna().unique() if t])
        selected_type = st.selectbox("Category Filter:", types)
    with f_col3:
        status_opts = ["All", "Assigned", "Available", "Under Repair", "Shared / Networked"]
        selected_status = st.selectbox("Status Filter:", status_opts)

    # Apply filters
    filtered = enriched
    if selected_type != "All":
        filtered = filtered[filtered["AssetType"] == selected_type]
    if selected_status != "All":
        filtered = filtered[filtered["Status"].str.contains(selected_status, case=False, na=False)]
    if search_query.strip():
        q = search_query.strip().lower()
        search_cols = ["VerifiedNo", "Brand", "Model", "SerialNumber", "AssetType", "AssignedUser", "Notes"]
        mask = pd.Series(False, index=filtered.index)
        for col in search_cols:
            if col in filtered.columns:
                mask = mask | filtered[col].astype(str).str.lower().str.contains(q, na=False)
        filtered = filtered[mask]

    st.caption(f"Showing **{len(filtered)}** of **{len(assets_df)}** equipment records")

    # Display columns
    display_cols = [c for c in ["VerifiedNo", "AssetType", "Brand", "Model", "AssignedUser", "Location", "Status", "PurchaseCost", "AssetID"] if c in filtered.columns]
    st.dataframe(filtered[display_cols], use_container_width=True, hide_index=True)

    # Detailed Inspector Section
    st.markdown("---")
    st.subheader("🔍 Deep Asset Inspector & Lifetime Cost")
    
    asset_ids = sorted(filtered["AssetID"].dropna().unique().tolist())
    if asset_ids:
        selected_asset_id = st.selectbox("Select Asset to Inspect Details, Timeline & Financials:", asset_ids)
        target = filtered[filtered["AssetID"] == selected_asset_id].iloc[0].to_dict()

        # Calculate exact lifetime cost
        cost_info = reconciliation_engine.get_asset_cost_summary(selected_asset_id)

        info_col1, info_col2 = st.columns([3, 2])

        with info_col1:
            st.markdown(f"### {target.get('Brand', '')} {target.get('Model', '')} (`{target.get('VerifiedNo', target.get('AssetID'))}`)")
            st.write(f"• **Asset Type**: {target.get('AssetType', 'N/A')}")
            st.write(f"• **Serial Number**: `{target.get('SerialNumber', 'N/A')}`")
            st.write(f"• **Current Custodian**: **{target.get('AssignedUser', 'Unassigned')}**")
            st.write(f"• **Location**: {target.get('Location', 'N/A')}")
            st.write(f"• **Specifications**: {target.get('Specifications', 'N/A')}")
            st.write(f"• **Purchase Date**: {target.get('PurchaseDate', 'N/A')}")
            st.write(f"• **Notes**: {target.get('Notes', 'None')}")

        with info_col2:
            st.markdown("#### 💰 Financial Ledger")
            st.markdown(f"""
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span>Purchase Cost:</span>
                    <strong>Rs. {cost_info['purchase_cost']:,.2f}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span>Repairs Incurred ({cost_info['repairs_count']} logs):</span>
                    <strong>Rs. {cost_info['repair_cost']:,.2f}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span>Consumables / Toners:</span>
                    <strong>Rs. {cost_info['consumable_cost']:,.2f}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span>Direct Expenses:</span>
                    <strong>Rs. {cost_info['other_expenses']:,.2f}</strong>
                </div>
                <hr style="margin: 0.5rem 0;" />
                <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 800; color: #0284c7;">
                    <span>Lifetime TCO:</span>
                    <span>Rs. {cost_info['total_lifetime_cost']:,.2f}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Chain of Custody Timeline
        st.markdown("#### 📜 Chain of Custody & Assignment History")
        if not assignments_df.empty and "AssetID" in assignments_df.columns:
            asset_asgns = assignments_df[assignments_df["AssetID"] == selected_asset_id]
            if not asset_asgns.empty:
                disp_asgn = asset_asgns.copy()
                disp_asgn["Employee"] = disp_asgn["UserID"].map(lambda u: user_map.get(u, u))
                disp_asgn["Office"] = disp_asgn["LocationID"].map(lambda l: loc_map.get(l, l))
                st.dataframe(disp_asgn[["AssignedDate", "ReturnedDate", "Employee", "Office", "AssignmentStatus", "Reason", "Notes"]], hide_index=True, use_container_width=True)
            else:
                st.info("No prior reassignment records logged for this machine.")

    # Admin: Add New Asset
    st.markdown("---")
    with st.expander("➕ Add New IT Asset (Direct Cloud Sync to Google Sheets)"):
        with st.form("add_asset_form", clear_on_submit=True):
            st.markdown("##### New Equipment Specifications")
            c1, c2, c3 = st.columns(3)
            with c1:
                new_tag = st.text_input("Verified Tag No *", placeholder="e.g. KMN/CH/CP/086")
                new_type = st.selectbox("Asset Type *", ["Desktop", "Laptop", "Monitor", "Printer", "UPS", "Keyboard", "Mouse", "Network", "Accessory", "Other"])
                new_brand = st.text_input("Brand *", placeholder="e.g. Dell, HP, Canon, Lenovo")
            with c2:
                new_model = st.text_input("Model *", placeholder="e.g. OptiPlex 3080, LaserJet Pro")
                new_serial = st.text_input("Serial Number", placeholder="e.g. 8G5X9Z1")
                new_cost = st.number_input("Purchase Cost (LKR)", min_value=0.0, step=500.0)
            with c3:
                new_user = st.selectbox("Assign To Staff", ["Unassigned (Storage)", "🌐 SHARED_NETWORK"] + [f"{u.get('Name')} ({u.get('UserID')})" for _, u in users_df.iterrows()])
                new_loc = st.selectbox("Office Location", [f"{l.get('OfficeName')} ({l.get('LocationID')})" for _, l in locations_df.iterrows()])
                new_status = st.selectbox("Initial Status", ["Assigned", "Available", "In Storage", "Shared / Networked"])

            new_specs = st.text_area("Hardware Specifications", placeholder="e.g. Intel Core i5 10th Gen, 16GB DDR4 RAM, 512GB NVMe SSD")
            new_notes = st.text_input("General Remarks / Invoice Reference")

            submitted = st.form_submit_button("💾 Save Asset Directly to Google Sheets")
            if submitted:
                if not new_tag.strip() or not new_model.strip():
                    st.error("Please provide both Tag Number and Model.")
                else:
                    new_id = cloud_db.generate_next_id("Assets", "AST-", "AssetID")
                    user_id = ""
                    if "SHARED_NETWORK" in new_user:
                        user_id = "SHARED_NETWORK"
                    elif "(" in new_user:
                        user_id = new_user.split("(")[1].replace(")", "").strip()

                    loc_id = new_loc.split("(")[1].replace(")", "").strip() if "(" in new_loc else "LOC-0001"

                    new_asset = {
                        "AssetID": new_id,
                        "VerifiedNo": new_tag.strip(),
                        "AssetType": new_type,
                        "Brand": new_brand.strip(),
                        "Model": new_model.strip(),
                        "SerialNumber": new_serial.strip(),
                        "Specifications": new_specs.strip(),
                        "PurchaseDate": pd.Timestamp.now().strftime("%Y-%m-%d"),
                        "PurchaseCost": new_cost,
                        "CurrentUserID": user_id,
                        "CurrentLocationID": loc_id,
                        "Status": new_status,
                        "Notes": new_notes.strip()
                    }

                    res = cloud_db.save_record("Assets", new_asset, id_key="AssetID")
                    if res.get("success"):
                        st.success(f"🎉 Asset `{new_id}` ({new_tag}) saved directly into Google Sheets!")
                        st.rerun()
                    else:
                        st.error(f"Failed to save to Google Sheets: {res.get('error')}")
