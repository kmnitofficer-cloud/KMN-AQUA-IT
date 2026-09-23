import * as XLSX from 'xlsx';
import { assetService } from './assetService';
import { userService } from './userService';
import { assignmentService } from './assignmentService';
import { repairService } from './repairService';
import { printerService } from './printerService';
import { expenseService } from './expenseService';
import { cctvService } from './cctvService';

export const reportService = {
  getAvailableReports() {
    return [
      { id: 'asset_register', name: 'Master IT Asset Register', description: 'Comprehensive inventory of all office machines, serial numbers, tags, and statuses.' },
      { id: 'user_register', name: 'Employee Asset Register', description: 'Summary of active equipment currently held by each staff member.' },
      { id: 'assignment_history', name: 'Full Assignment & Chain of Custody History', description: 'Permanent audit trail of all device handovers, returns, and reassignments.' },
      { id: 'repair_costs', name: 'Repair & Maintenance Cost Report', description: 'Detailed breakdown of equipment faults, actions taken, vendors, and repair charges.' },
      { id: 'printer_toner', name: 'Printer Toner & Consumable Expenses', description: 'Toner and ink cartridge consumption, unit prices, and lifetime printer costs.' },
      { id: 'cctv_bills', name: 'CCTV Surveillance & Office Bills Report', description: 'Detailed multi-office breakdown of CCTV Internet, repairs, hardware, and maintenance costs for Chilaw and Palawiya.' },
      { id: 'expense_statement', name: 'Comprehensive Expense & Financial Statement', description: 'Itemized expenditures sorted by entity (User, Device, Printer, Department).' },
      { id: 'warranty_expiry', name: 'Warranty Expiration & Renewal Schedule', description: 'Active warranties nearing expiration within 60-90 days.' }
    ];
  },

  generateReport(reportId) {
    switch (reportId) {
      case 'asset_register': {
        const assets = assetService.getAssets('All');
        return assets.map((a, i) => ({
          'No': i + 1,
          'Asset ID': a.AssetID,
          'Verified No': a.VerifiedNo,
          'Item / Model': a.Model,
          'Type': a.AssetType,
          'Brand': a.Brand,
          'Status': a.Status,
          'Assigned To': a.AssignedUserName,
          'Location': a.LocationName,
          'Purchase Date': a.PurchaseDate,
          'Purchase Cost (LKR)': Number(a.PurchaseCost || 0),
          'Warranty End': a.WarrantyEnd || 'N/A'
        }));
      }

      case 'user_register': {
        const users = userService.getUsers('All');
        const rows = [];
        users.forEach((u, i) => {
          const currentAssets = userService.getUserCurrentAssets(u.UserID);
          const costs = userService.getUserCosts(u.UserID);
          rows.push({
            'No': i + 1,
            'User ID': u.UserID,
            'Employee ID': u.EmployeeID,
            'Employee Name': u.Name,
            'Status': u.Status,
            'Active Assets Count': currentAssets.length,
            'Current Assets List': currentAssets.map(a => `${a.Brand} ${a.Model} (${a.VerifiedNo})`).join('; ') || 'None',
            'Direct Expenses (LKR)': costs.directExpenses,
            'Repairs Incurred (LKR)': costs.repairCosts,
            'Total Associated Cost (LKR)': costs.totalCost
          });
        });
        return rows;
      }

      case 'assignment_history': {
        const asgns = assignmentService.getAssignments();
        return asgns.map((a, i) => ({
          'No': i + 1,
          'Assignment ID': a.AssignmentID,
          'Asset ID': a.AssetID,
          'Tag / Verified No': a.VerifiedNo,
          'Device': `${a.Brand} ${a.Model}`,
          'Assigned User': a.UserName,
          'Location': a.LocationName,
          'Assigned Date': a.AssignedDate,
          'Returned Date': a.ReturnedDate || 'Current Holding',
          'Status': a.AssignmentStatus,
          'Reason': a.Reason || 'Standard',
          'Condition': a.ConditionWhenAssigned,
          'Return Condition': a.ConditionWhenReturned || 'N/A'
        }));
      }

      case 'repair_costs': {
        const reps = repairService.getRepairs();
        return reps.map((r, i) => ({
          'No': i + 1,
          'Repair ID': r.RepairID,
          'Date': r.RepairDate,
          'Asset ID': r.AssetID,
          'Tag / No': r.VerifiedNo,
          'Device': `${r.Brand} ${r.Model}`,
          'Problem': r.ProblemDescription,
          'Action Taken': r.ActionTaken,
          'Parts Replaced': r.PartsReplaced,
          'Supplier / Vendor': r.RepairSupplier,
          'Technician': r.Technician,
          'Repair Cost (LKR)': Number(r.RepairCost || 0),
          'Status': r.Status,
          'Warranty Covered': r.WarrantyCovered
        }));
      }

      case 'printer_toner': {
        const printers = printerService.getPrinters();
        const rows = [];
        printers.forEach((p, i) => {
          const costSummary = printerService.getPrinterCostSummary(p.AssetID);
          const history = printerService.getPrinterTonerHistory(p.AssetID);
          rows.push({
            'No': i + 1,
            'Printer ID': p.PrinterID,
            'Printer Name': p.PrinterName,
            'IP Address': p.IPAddress,
            'Location': p.LocationName,
            'Cartridge Model': p.TonerCartridgeModel,
            'Purchase Price (LKR)': costSummary.purchaseCost,
            'Toner Replacements Count': costSummary.tonerTransactionsCount,
            'Total Toner Cost (LKR)': costSummary.tonerHistoryCost,
            'Total Repairs Cost (LKR)': costSummary.repairHistoryCost,
            'Grand Total Cost (LKR)': costSummary.totalRecordedCost,
            'Recent Replacements': history.slice(0, 3).map(h => `${h.Date}: ${h.ConsumableType} (Rs. ${h.TotalCost})`).join('; ')
          });
        });
        return rows;
      }

      case 'expense_statement': {
        const expenses = expenseService.getExpenses('All');
        return expenses.map((e, i) => ({
          'No': i + 1,
          'Expense ID': e.ExpenseID,
          'Date': e.ExpenseDate,
          'Type': e.ExpenseType,
          'Description': e.Description,
          'Amount (LKR)': e.Amount,
          'Supplier': e.Supplier,
          'Assigned User': e.UserName,
          'Associated Asset': e.AssetName,
          'Invoice Ref': e.InvoiceNumber || 'N/A',
          'Payment Method': e.PaymentMethod || 'Cheque'
        }));
      }

      case 'cctv_bills': {
        const bills = cctvService.getCCTVBills('All');
        return bills.map((b, i) => ({
          'No': i + 1,
          'Bill ID': b.BillID,
          'Office': `${b.Office} Office`,
          'Bill #': b.BillNumber,
          'Date': b.BillDate,
          'Billing Period': b.BillPeriod || 'N/A',
          'Category': b.BillCategory,
          'Vendor / Payee': b.Supplier,
          'Amount (LKR)': Number(b.Amount || 0),
          'Payment Status': b.PaymentStatus || 'Paid',
          'Payment Method': b.PaymentMethod || 'Company Cheque',
          'Description': b.Description,
          'Attached Document': b.FileName || 'None'
        }));
      }

      case 'warranty_expiry': {
        const assets = assetService.getAssets('All');
        return assets
          .filter(a => a.WarrantyEnd)
          .map((a, i) => ({
            'No': i + 1,
            'Asset ID': a.AssetID,
            'Device': `${a.Brand} ${a.Model}`,
            'Tag': a.VerifiedNo,
            'Assigned To': a.AssignedUserName,
            'Warranty Start': a.WarrantyStart,
            'Warranty End': a.WarrantyEnd,
            'Status': a.Status
          }));
      }

      default:
        return [];
    }
  },

  exportReportToExcel(reportId, filename = null) {
    const reportList = this.getAvailableReports();
    const meta = reportList.find(r => r.id === reportId) || { name: 'IT_Report' };
    const rows = this.generateReport(reportId);

    const safeFilename = filename || `${meta.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, meta.name.slice(0, 31));
    XLSX.writeFile(wb, safeFilename);
  }
};
