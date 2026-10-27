import streamlit as st
import pandas as pd
import altair as alt
from services.cloud_db import cloud_db
from services.reconciliation_engine import reconciliation_engine
from config import SPREADSHEET_URL, INVOICES_FOLDER_ID

def render_dashboard():
    # Fetch summary metrics
    with st.spinner("Calculating financial metrics from Google Sheets..."):
        summary = reconciliation_engine.get_financial_summary()
        assets_df = cloud_db.get_table("Assets")
        repairs_df = cloud_db.get_table("Repairs")
        parts_df = cloud_db.get_table("Parts")

    # Header section
    st.markdown("""
    <div style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">📊 Executive IT Intelligence & Cloud Hub</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Real-time synchronization with Google Drive & Google Cloud Sheets • Zero Local Database
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Top KPI Cards
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-title">Total IT Assets</div>
            <div class="kpi-value">{len(assets_df):,}</div>
            <div class="kpi-subtitle">Inventory Value: Rs. {summary['total_asset_inventory_value']:,.0f}</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-title">Verified Invoices</div>
            <div class="kpi-value">Rs. {summary['total_invoiced']:,.0f}</div>
            <div class="kpi-subtitle">📂 {summary['invoices_count']} Drive PDF Bills</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-title">Recorded Expenses</div>
            <div class="kpi-value">Rs. {summary['total_expenses']:,.0f}</div>
            <div class="kpi-subtitle">📅 This Month: Rs. {summary['current_month_expenses']:,.0f}</div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        disc = summary['discrepancy']
        disc_color = "#10b981" if summary['is_balanced'] else "#ef4444"
        disc_label = "Balanced" if summary['is_balanced'] else f"Gap: Rs. {abs(disc):,.0f}"
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-title">Reconciliation Status</div>
            <div class="kpi-value" style="color: {disc_color};">{disc_label}</div>
            <div class="kpi-subtitle" style="color: {disc_color};">Invoices vs Expenses</div>
        </div>
        """, unsafe_allow_html=True)

    with col5:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-title">Repairs & Toners</div>
            <div class="kpi-value">Rs. {(summary['total_repairs'] + summary['total_consumables']):,.0f}</div>
            <div class="kpi-subtitle">Repairs: Rs. {summary['total_repairs']:,.0f}</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height: 1.2rem;'></div>", unsafe_allow_html=True)

    # Charts and Alerts Row
    chart_col, alert_col = st.columns([3, 2])

    with chart_col:
        st.subheader("📈 Inventory Breakdown by Asset Category")
        if not assets_df.empty and "AssetType" in assets_df.columns:
            type_counts = assets_df["AssetType"].value_counts().reset_index()
            type_counts.columns = ["Asset Type", "Count"]

            chart = alt.Chart(type_counts).mark_bar(cornerRadiusTopLeft=6, cornerRadiusTopRight=6).encode(
                x=alt.X("Asset Type:N", sort="-y", title=None, axis=alt.Axis(labelAngle=-25)),
                y=alt.Y("Count:Q", title="Total Units"),
                color=alt.Color("Asset Type:N", legend=None, scale=alt.Scale(scheme="tableau10")),
                tooltip=["Asset Type", "Count"]
            ).properties(height=280)

            st.altair_chart(chart, use_container_width=True)
        else:
            st.info("No asset records found in Google Sheet.")

    with alert_col:
        st.subheader("🔔 Urgent Attention & Health Radar")

        # Check warranty expiring soon
        today = pd.Timestamp.now()
        expiring_parts = []
        if not parts_df.empty and "WarrantyEnd" in parts_df.columns:
            for _, p in parts_df.iterrows():
                wend = str(p.get("WarrantyEnd", "")).strip()
                if wend:
                    try:
                        edate = pd.to_datetime(wend)
                        days = (edate - today).days
                        if 0 <= days <= 60:
                            expiring_parts.append((p.get("PartType", "Part"), p.get("AssetID", "AST"), days))
                    except Exception:
                        pass

        if expiring_parts:
            st.warning(f"⚠️ **{len(expiring_parts)} Components Have Warranties Expiring Within 60 Days**")
            for ptype, ast, days in expiring_parts[:3]:
                st.caption(f"• **{ptype}** for device `{ast}` expires in **{days} days**")
        else:
            st.success("✅ No imminent warranty expirations in the next 60 days.")

        # Reconciliation alert
        if not summary['is_balanced']:
            st.error(f"⚠️ **Audit Notice**: Invoices total exceeds expenses by Rs. {abs(summary['discrepancy']):,.2f}. Go to 'Financial Audit' tab to reconcile.")
        else:
            st.success("✅ Financial ledgers are 100% balanced between Invoices and Expenses.")

        # Quick Cloud links
        st.markdown(f"""
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.9rem; margin-top: 1rem;">
            <div style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 0.5rem;">🔗 Direct Cloud Repositories</div>
            <a href="{SPREADSHEET_URL}" target="_blank" style="text-decoration: none; display: inline-block; margin-right: 0.8rem; font-size: 0.82rem; font-weight: 600; color: #0284c7;">
                📊 Open Google Spreadsheet
            </a>
            <a href="https://drive.google.com/drive/folders/{INVOICES_FOLDER_ID}" target="_blank" style="text-decoration: none; display: inline-block; font-size: 0.82rem; font-weight: 600; color: #0284c7;">
                📁 Open Drive PDF Folder
            </a>
        </div>
        """, unsafe_allow_html=True)

    # Recent Activity & Audit Feed
    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
    st.subheader("📋 Recent Repairs & Services")
    if not repairs_df.empty:
        disp_repairs = repairs_df.copy()
        show_cols = [c for c in ["RepairDate", "RepairID", "AssetID", "ProblemDescription", "RepairSupplier", "RepairCost", "Status"] if c in disp_repairs.columns]
        st.dataframe(disp_repairs[show_cols].head(8), use_container_width=True, hide_index=True)
    else:
        st.info("No service records found.")
