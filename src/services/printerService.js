import { dbRepository } from './dbRepository';

export const printerService = {
  getPrinters() {
    const printers = dbRepository.getTable('Printers');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');
    const departments = dbRepository.getTable('Departments');

    return printers.map(p => {
      const asset = assets.find(a => a.AssetID === p.AssetID) || {};
      const user = users.find(u => u.UserID === p.AssignedUserID);
      const loc = locations.find(l => l.LocationID === p.LocationID);
      const dept = departments.find(d => d.DepartmentID === p.DepartmentID);

      return {
        ...p,
        VerifiedNo: asset.VerifiedNo || 'N/A',
        SerialNumber: asset.SerialNumber || '',
        PurchaseCost: asset.PurchaseCost || 0,
        PurchaseDate: asset.PurchaseDate || '',
        AssignedUserName: user ? user.Name : 'Unassigned',
        LocationName: loc ? loc.OfficeName : 'General Office',
        DepartmentName: dept ? dept.DepartmentName : 'All Departments'
      };
    });
  },

  getPrinterById(printerId) {
    const printers = this.getPrinters();
    return printers.find(p => p.PrinterID === printerId || p.AssetID === printerId) || null;
  },

  getPrinterTonerHistory(printerAssetId) {
    const consumables = dbRepository.getTable('Consumables');
    return consumables
      .filter(c => c.PrinterAssetID === printerAssetId)
      .sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));
  },

  getPrinterCostSummary(printerAssetId) {
    const asset = dbRepository.getTable('Assets').find(a => a.AssetID === printerAssetId) || {};
    const purchaseCost = Number(asset.PurchaseCost) || 0;

    const consumables = dbRepository.getTable('Consumables').filter(c => c.PrinterAssetID === printerAssetId);
    const tonerHistoryCost = consumables.reduce((sum, c) => sum + (Number(c.TotalCost) || 0), 0);

    const repairs = dbRepository.getTable('Repairs').filter(r => r.AssetID === printerAssetId);
    const repairHistoryCost = repairs.reduce((sum, r) => sum + (Number(r.RepairCost) || 0), 0);

    const otherExpenses = dbRepository.getTable('Expenses')
      .filter(e => e.PrinterAssetID === printerAssetId && e.ExpenseType !== 'Repair' && e.ExpenseType !== 'Consumable / Toner')
      .reduce((sum, e) => sum + (Number(e.Amount) || 0), 0);

    const totalRecordedCost = purchaseCost + tonerHistoryCost + repairHistoryCost + otherExpenses;

    return {
      purchaseCost,
      tonerHistoryCost,
      repairHistoryCost,
      otherExpenses,
      totalRecordedCost,
      tonerTransactionsCount: consumables.length,
      repairsCount: repairs.length
    };
  },

  async logTonerTransaction({
    printerAssetId,
    consumableType = 'Black Toner',
    brand = 'Canon',
    model = 'Cartridge 337',
    quantity = 1,
    unitCost = 0,
    supplier = 'KMN IT Solution',
    installedBy = 'IT Support',
    notes = '',
    invoiceNumber = '',
    invoiceFile = null
  }) {
    const today = new Date().toISOString().split('T')[0];
    const consumables = dbRepository.getTable('Consumables');
    const expenses = dbRepository.getTable('Expenses');
    const invoices = dbRepository.getTable('Invoices');

    const totalCost = Number(unitCost) * Number(quantity);

    // 1. Create Invoice if invoice number / file provided
    let invoiceId = '';
    if (invoiceNumber || invoiceFile) {
      invoiceId = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
      const newInvoice = {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        InvoiceDate: today,
        Supplier: supplier,
        Amount: totalCost,
        AssetID: printerAssetId,
        UserID: '',
        PrinterAssetID: printerAssetId,
        ExpenseID: '',
        FileName: invoiceFile ? invoiceFile.name : `Invoice_${invoiceNumber || invoiceId}.pdf`,
        FilePath: invoiceFile ? `/invoices/${invoiceFile.name}` : '',
        FileSize: '120 KB',
        UploadDate: today,
        Description: `${consumableType} for printer`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    // 2. Create Consumable record
    const nextCsmNum = consumables.length + 1;
    const newTransaction = {
      TransactionID: `CSM-${String(nextCsmNum).padStart(4, '0')}`,
      PrinterAssetID: printerAssetId,
      ConsumableType: consumableType,
      Brand: brand,
      Model: model,
      Quantity: Number(quantity),
      Date: today,
      UnitCost: Number(unitCost),
      TotalCost: totalCost,
      Supplier: supplier,
      InvoiceID: invoiceId,
      InstalledBy: installedBy,
      Notes: notes
    };
    await dbRepository.updateTable('Consumables', [newTransaction, ...consumables]);

    // 3. Create Expense record
    if (totalCost > 0) {
      const nextExpNum = expenses.length + 1;
      const newExpense = {
        ExpenseID: `EXP-${String(nextExpNum).padStart(4, '0')}`,
        ExpenseDate: today,
        ExpenseType: 'Consumable / Toner',
        AssetID: printerAssetId,
        UserID: '',
        PrinterAssetID: printerAssetId,
        DepartmentID: 'DEP-0002',
        Supplier: supplier,
        Description: `${consumableType} Replacement (${model})`,
        Amount: totalCost,
        PaymentMethod: 'Company Cheque',
        InvoiceID: invoiceId,
        Notes: notes
      };
      await dbRepository.updateTable('Expenses', [newExpense, ...expenses]);
    }

    return newTransaction;
  },

  async savePrinter(printerData) {
    const printers = dbRepository.getTable('Printers');
    let updated;

    if (printerData.PrinterID) {
      updated = printers.map(p => p.PrinterID === printerData.PrinterID ? { ...p, ...printerData } : p);
    } else {
      const nextNum = printers.length + 1;
      const newPrinter = {
        ...printerData,
        PrinterID: `PRN-${String(nextNum).padStart(4, '0')}`,
        Status: printerData.Status || 'In Use'
      };
      updated = [newPrinter, ...printers];
    }

    await dbRepository.updateTable('Printers', updated);
    return printerData;
  }
};
