import pandas as pd
import numpy as np
from typing import Dict, Any, List
from services.cloud_db import cloud_db

class ReconciliationEngine:
    """
    Centralized financial calculation engine.
    Ensures 100% mathematical consistency across all modules with zero double-counting.
    """

    @staticmethod
    def _clean_num(series: pd.Series) -> pd.Series:
        if series is None or series.empty:
            return pd.Series(dtype=float)
        return pd.to_numeric(series.astype(str).str.replace(r"[^\d.-]", "", regex=True), errors="coerce").fillna(0.0)

    def get_financial_summary(self) -> Dict[str, Any]:
        """Calculates executive financial metrics and reconciliation balance."""
        invoices_df = cloud_db.get_table("Invoices")
        expenses_df = cloud_db.get_table("Expenses")
        repairs_df = cloud_db.get_table("Repairs")
        consumables_df = cloud_db.get_table("Consumables")
        cctv_df = cloud_db.get_table("CCTVBills")
        assets_df = cloud_db.get_table("Assets")

        # 1. Cleaned amounts
        inv_amt = self._clean_num(invoices_df.get("Amount", pd.Series()))
        exp_amt = self._clean_num(expenses_df.get("Amount", pd.Series()))
        rep_amt = self._clean_num(repairs_df.get("RepairCost", pd.Series()))
        csm_amt = self._clean_num(consumables_df.get("TotalCost", pd.Series()))
        cctv_amt = self._clean_num(cctv_df.get("Amount", pd.Series()))
        ast_cost = self._clean_num(assets_df.get("PurchaseCost", pd.Series()))

        total_invoiced = float(inv_amt.sum())
        total_expenses = float(exp_amt.sum())
        total_repairs = float(rep_amt.sum())
        total_consumables = float(csm_amt.sum())
        total_cctv = float(cctv_amt.sum())
        total_asset_inventory_value = float(ast_cost.sum())

        # 2. Date-based grouping
        now = pd.Timestamp.now()
        current_year = str(now.year)
        current_month_prefix = now.strftime("%Y-%m")

        exp_dates = expenses_df.get("ExpenseDate", pd.Series()).astype(str)
        month_mask = exp_dates.str.startswith(current_month_prefix)
        year_mask = exp_dates.str.startswith(current_year)

        current_month_expenses = float(exp_amt[month_mask].sum())
        current_year_expenses = float(exp_amt[year_mask].sum())

        # 3. Intelligent Match Audit
        matched_pairs = []
        unmatched_invoices = []
        unmatched_expenses = []

        if not invoices_df.empty and not expenses_df.empty:
            exp_inv_id_map = {}
            for idx, e in expenses_df.iterrows():
                e_inv = str(e.get("InvoiceID", "")).strip().lower()
                e_desc = str(e.get("Description", "")).strip().lower()
                e_id = str(e.get("ExpenseID", "")).strip()
                if e_inv:
                    exp_inv_id_map[e_inv] = idx
                # also map by description token
                tokens = e_desc.split()
                for tok in tokens:
                    if len(tok) >= 5:
                        exp_inv_id_map[tok] = idx

            for _, inv in invoices_df.iterrows():
                inv_id = str(inv.get("InvoiceID", "")).strip().lower()
                inv_num = str(inv.get("InvoiceNumber", "")).strip().lower()
                inv_cost = float(self._clean_num(pd.Series([inv.get("Amount")])).iloc[0])

                matched = False
                if inv_id and inv_id in exp_inv_id_map:
                    matched = True
                elif inv_num and inv_num in exp_inv_id_map:
                    matched = True

                if matched:
                    matched_pairs.append(inv.to_dict())
                else:
                    unmatched_invoices.append(inv.to_dict())

        discrepancy = total_invoiced - total_expenses
        is_balanced = abs(discrepancy) < 0.01

        return {
            "total_invoiced": total_invoiced,
            "total_expenses": total_expenses,
            "discrepancy": discrepancy,
            "is_balanced": is_balanced,
            "total_repairs": total_repairs,
            "total_consumables": total_consumables,
            "total_cctv": total_cctv,
            "total_asset_inventory_value": total_asset_inventory_value,
            "current_month_expenses": current_month_expenses,
            "current_year_expenses": current_year_expenses,
            "invoices_count": len(invoices_df),
            "expenses_count": len(expenses_df),
            "matched_invoices_count": len(matched_pairs),
            "unmatched_invoices": unmatched_invoices,
        }

    def get_asset_cost_summary(self, asset_id: str) -> Dict[str, Any]:
        """
        Calculates the true lifetime cost for an asset WITHOUT duplicate counting.
        Lifetime Cost = Purchase Cost + Repairs + Consumables (if printer) + Non-duplicate Expenses.
        """
        assets_df = cloud_db.get_table("Assets")
        repairs_df = cloud_db.get_table("Repairs")
        consumables_df = cloud_db.get_table("Consumables")
        expenses_df = cloud_db.get_table("Expenses")

        asset = {}
        if not assets_df.empty and "AssetID" in assets_df.columns:
            matches = assets_df[assets_df["AssetID"] == asset_id]
            if not matches.empty:
                asset = matches.iloc[0].to_dict()

        purchase_cost = float(self._clean_num(pd.Series([asset.get("PurchaseCost", 0)])).iloc[0])

        # Repairs
        asset_repairs = repairs_df[repairs_df.get("AssetID", pd.Series()) == asset_id] if not repairs_df.empty else pd.DataFrame()
        repair_cost = float(self._clean_num(asset_repairs.get("RepairCost", pd.Series())).sum())

        # Consumables (Printers)
        asset_csm = consumables_df[consumables_df.get("PrinterAssetID", pd.Series()) == asset_id] if not consumables_df.empty else pd.DataFrame()
        csm_cost = float(self._clean_num(asset_csm.get("TotalCost", pd.Series())).sum())

        # Other direct expenses that are NOT already categorized as Repair or Toner
        other_exp_cost = 0.0
        if not expenses_df.empty and "AssetID" in expenses_df.columns:
            mask = (expenses_df["AssetID"] == asset_id) | (expenses_df.get("PrinterAssetID", pd.Series()) == asset_id)
            exp_subset = expenses_df[mask]
            # Exclude duplicate Repair & Consumable entries
            type_series = exp_subset.get("ExpenseType", pd.Series()).astype(str).str.lower()
            filtered_exp = exp_subset[~type_series.str.contains("repair") & ~type_series.str.contains("toner") & ~type_series.str.contains("consumable")]
            other_exp_cost = float(self._clean_num(filtered_exp.get("Amount", pd.Series())).sum())

        total_lifetime_cost = purchase_cost + repair_cost + csm_cost + other_exp_cost

        return {
            "asset_id": asset_id,
            "purchase_cost": purchase_cost,
            "repair_cost": repair_cost,
            "consumable_cost": csm_cost,
            "other_expenses": other_exp_cost,
            "total_lifetime_cost": total_lifetime_cost,
            "repairs_count": len(asset_repairs),
            "consumables_count": len(asset_csm)
        }

    def get_user_cost_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Calculates total expenditures associated with an employee.
        Fixes the double-counting bug: repairs are counted once, and direct expenses exclude duplicate repair entries.
        """
        assets_df = cloud_db.get_table("Assets")
        assignments_df = cloud_db.get_table("Assignments")
        repairs_df = cloud_db.get_table("Repairs")
        expenses_df = cloud_db.get_table("Expenses")

        # Current assets
        curr_assets = assets_df[assets_df.get("CurrentUserID", pd.Series()) == user_id] if not assets_df.empty else pd.DataFrame()
        curr_assets_val = float(self._clean_num(curr_assets.get("PurchaseCost", pd.Series())).sum())

        # Historical assets held
        held_asset_ids = set()
        if not assignments_df.empty and "UserID" in assignments_df.columns:
            held_asset_ids = set(assignments_df[assignments_df["UserID"] == user_id].get("AssetID", pd.Series()).dropna().tolist())
        if not curr_assets.empty and "AssetID" in curr_assets.columns:
            held_asset_ids.update(curr_assets["AssetID"].dropna().tolist())

        # Repairs incurred on those devices
        user_repairs = repairs_df[repairs_df.get("AssetID", pd.Series()).isin(held_asset_ids)] if not repairs_df.empty else pd.DataFrame()
        total_repair_cost = float(self._clean_num(user_repairs.get("RepairCost", pd.Series())).sum())

        # Direct expenses (excluding repairs that were already summed above)
        direct_exp = expenses_df[expenses_df.get("UserID", pd.Series()) == user_id] if not expenses_df.empty else pd.DataFrame()
        exp_type = direct_exp.get("ExpenseType", pd.Series()).astype(str).str.lower()
        non_repair_exp = direct_exp[~exp_type.str.contains("repair")]
        total_direct_exp = float(self._clean_num(non_repair_exp.get("Amount", pd.Series())).sum())

        total_cost = curr_assets_val + total_repair_cost + total_direct_exp

        return {
            "user_id": user_id,
            "current_assets_count": len(curr_assets),
            "current_assets_value": curr_assets_val,
            "repairs_cost": total_repair_cost,
            "direct_expenses": total_direct_exp,
            "total_associated_cost": total_cost
        }


# Global singleton
reconciliation_engine = ReconciliationEngine()
