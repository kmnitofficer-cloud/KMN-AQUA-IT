import streamlit as st
import pandas as pd
from services.cloud_db import cloud_db
from services.reconciliation_engine import reconciliation_engine

def render_audit():
    st.markdown("""
    <div style="margin-bottom: 1.2rem;">
        <h2 style="margin: 0; font-weight: 800; color: #0f172a;">💰 Financial Audit & Double-Entry Ledger</h2>
        <p style="margin: 0.2rem 0 0 0; color: #64748b; font-size: 0.95rem;">
            Mathematical reconciliation between Vendor Invoices, Expenses, Repairs, and Consumables
        </p>
    </div>
    """, unsafe_allow_html=True)

    summary = reconciliation_engine.get_financial_summary()
    invoices_df = cloud_db.get_table("Invoices")
    expenses_df = cloud_db.get_table("Expenses")

    # Reconciliation Banner
    disc = summary['discrepancy']
    if summary['is_balanced']:
        st.success("✅ **Ledgers Are Perfectly Reconciled**: Verified Invoices match total Recorded Expenses.")
    else:
        st.warning(f"⚠️ **Reconciliation Gap Detected**: Invoices total **Rs. {summary['total_invoiced']:,.2f}** vs Expenses total **Rs. {summary['total_expenses']:,.2f}** (Difference: **Rs. {disc:,.2f}**).")

    # Metrics summary
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Invoiced (Drive Bills)", f"Rs. {summary['total_invoiced']:,.2f}")
    with m2:
        st.metric("Total Recorded Expenses", f"Rs. {summary['total_expenses']:,.2f}")
    with m3:
        st.metric("Discrepancy Gap", f"Rs. {abs(disc):,.2f}", delta=None)
    with m4:
        st.metric("Audit Balance", "100% Balanced" if summary['is_balanced'] else "Action Required")

    st.markdown("---")

    # Unmatched items breakdown
    unmatched = summary.get("unmatched_invoices", [])
    if unmatched:
        st.subheader("🔍 Invoices Requiring Matching Expense Entry")
        st.caption("These invoices are registered in the cloud PDF vault but lack a matching line item in the Expenses ledger.")
        unm_df = pd.DataFrame(unmatched)
        show_cols = [c for c in ["InvoiceID", "InvoiceNumber", "InvoiceDate", "Supplier", "Amount", "Description"] if c in unm_df.columns]
        st.dataframe(unm_df[show_cols], use_container_width=True, hide_index=True)

        # 1-Click Auto Reconcile Action
        if st.button("⚡ 1-Click Auto-Reconcile: Create Matching Expenses in Google Sheets", type="primary"):
            with st.spinner("Generating synchronized expense records in Google Sheets..."):
                current_expenses = expenses_df.to_dict(orient="records")
                next_exp_num = len(current_expenses) + 1
                created_count = 0

                for inv in unmatched:
                    exp_id = f"EXP-{str(next_exp_num).zfill(4)}"
                    next_exp_num += 1
                    new_exp = {
                        "ExpenseID": exp_id,
                        "ExpenseDate": inv.get("InvoiceDate") or pd.Timestamp.now().strftime("%Y-%m-%d"),
                        "ExpenseType": "General IT / Hardware",
                        "AssetID": inv.get("AssetID", ""),
                        "UserID": inv.get("UserID", ""),
                        "PrinterAssetID": inv.get("PrinterAssetID", ""),
                        "DepartmentID": "DEP-0004",
                        "Supplier": inv.get("Supplier", "General Vendor"),
                        "Description": inv.get("Description") or f"Reconciled from Invoice {inv.get('InvoiceNumber')}",
                        "Amount": float(pd.to_numeric(str(inv.get("Amount", 0)).replace(",", ""), errors="coerce") or 0),
                        "PaymentMethod": "Company Cheque",
                        "InvoiceID": inv.get("InvoiceID", ""),
                        "Notes": f"Auto-reconciled via Streamlit on {pd.Timestamp.now().strftime('%Y-%m-%d')}"
                    }
                    current_expenses.append(new_exp)
                    created_count += 1

                res = cloud_db.update_table("Expenses", current_expenses)
                if res.get("success"):
                    st.success(f"🎉 Successfully reconciled {created_count} invoices! Ledger is now balanced.")
                    st.rerun()
                else:
                    st.error(f"Reconciliation failed: {res.get('error')}")

    # Itemized Expenses Statement
    st.markdown("---")
    st.subheader("📑 Itemized Master Expense Statement")
    if not expenses_df.empty:
        disp_exp = expenses_df.copy()
        # Sort by date descending
        if "ExpenseDate" in disp_exp.columns:
            disp_exp = disp_exp.sort_values(by="ExpenseDate", ascending=False)
        show_cols = [c for c in ["ExpenseDate", "ExpenseID", "ExpenseType", "Supplier", "Amount", "Description", "InvoiceID"] if c in disp_exp.columns]
        st.dataframe(disp_exp[show_cols], use_container_width=True, hide_index=True)
    else:
        st.info("No expense transactions recorded.")
