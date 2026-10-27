import { dbRepository } from './dbRepository';
import { googleDriveService } from './googleDriveService';

export const printerService = {
  getPrinters() {
    const printers = dbRepository.getTable('Printers');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');
    const departments = dbRepository.getTable('Departments');

    // Also find any asset of type Printer that might not yet be in the Printers table
    const printerAssets = assets.filter(a => a.AssetType === 'Printer');
    const existingAssetIds = new Set(printers.map(p => p.AssetID));

    const extraPrinters = printerAssets
      .filter(pa => !existingAssetIds.has(pa.AssetID))
      .map((pa, idx) => ({
        PrinterID: `PRN-AUTO-${pa.AssetID}`,
        AssetID: pa.AssetID,
        PrinterName: `${pa.Brand} ${pa.Model}`.trim(),
        IPAddress: '192.168.1.xxx',
        LocationID: pa.CurrentLocationID || 'LOC-0001',
        DepartmentID: 'DEP-0004',
        AssignedUserID: pa.CurrentUserID || 'SHARED_NETWORK',
        Status: pa.Status || 'In Use (Shared Network)',
        TonerCartridgeModel: 'Standard Toner',
        Notes: pa.Notes || 'Shared Network Printer'
      }));

    const allPrinters = [...printers, ...extraPrinters];

    return allPrinters.map(p => {
      const asset = assets.find(a => a.AssetID === p.AssetID) || {};
      const isShared = p.AssignedUserID === 'SHARED_NETWORK' || !p.AssignedUserID || (p.Status && p.Status.includes('Shared'));
      const user = isShared ? null : users.find(u => u.UserID === p.AssignedUserID);
      const loc = locations.find(l => l.LocationID === p.LocationID);
      const dept = departments.find(d => d.DepartmentID === p.DepartmentID);

      return {
        ...p,
        IsSharedNetwork: isShared,
        VerifiedNo: asset.VerifiedNo || 'N/A',
        SerialNumber: asset.SerialNumber || '',
        PurchaseCost: asset.PurchaseCost || 0,
        PurchaseDate: asset.PurchaseDate || '',
        AssignedUserName: isShared ? '🌐 Shared Network (All Staff)' : (user ? user.Name : 'Unassigned'),
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
    date = '',
    supplier = 'KMN IT Solution',
    installedBy = 'IT Support',
    notes = '',
    selectedInvoiceId = '',
    invoiceNumber = '',
    invoiceFile = null,
    invoiceAmount = null
  }) {
    const today = date || new Date().toISOString().split('T')[0];
    const consumables = dbRepository.getTable('Consumables');
    const expenses = dbRepository.getTable('Expenses');
    const invoices = dbRepository.getTable('Invoices');

    const totalCost = Number(unitCost) * Number(quantity);

    // 1. Resolve or Create Invoice
    let invoiceId = selectedInvoiceId || '';

    if (!invoiceId && invoiceFile) {
      invoiceId = dbRepository.getNextId('Invoices', 'INV-', 'InvoiceID');
      const safeName = invoiceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const newInvoice = {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceNumber || safeName.replace(/\.[^/.]+$/, '').slice(0, 20),
        InvoiceDate: today,
        Supplier: supplier,
        Amount: invoiceAmount !== null && invoiceAmount !== undefined ? Number(invoiceAmount) : totalCost,
        AssetID: printerAssetId,
        UserID: '',
        PrinterAssetID: printerAssetId,
        ExpenseID: '',
        FileName: safeName,
        FilePath: `/invoices/${safeName}`,
        FileSize: `${Math.round(invoiceFile.size / 1024)} KB`,
        UploadDate: today,
        Description: `${consumableType} for printer`
      };

      if (googleDriveService.isConfigured()) {
        try {
          const driveRes = await googleDriveService.uploadInvoice(invoiceFile, newInvoice);
          if (driveRes && driveRes.fileUrl) {
            newInvoice.FilePath = driveRes.fileUrl;
            newInvoice.DriveUrl = driveRes.driveUrl;
            newInvoice.DownloadUrl = driveRes.downloadUrl;
            newInvoice.DriveFileID = driveRes.invoice?.DriveFileID || '';
          }
        } catch (e) {
          console.warn('Could not post invoice to Google Drive:', e.message);
        }
      }

      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    } else if (!invoiceId && invoiceNumber) {
      invoiceId = dbRepository.getNextId('Invoices', 'INV-', 'InvoiceID');
      const newInvoice = {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceNumber,
        InvoiceDate: today,
        Supplier: supplier,
        Amount: invoiceAmount !== null && invoiceAmount !== undefined ? Number(invoiceAmount) : totalCost,
        AssetID: printerAssetId,
        UserID: '',
        PrinterAssetID: printerAssetId,
        ExpenseID: '',
        FileName: `Invoice_${invoiceNumber}.pdf`,
        FilePath: '',
        FileSize: 'N/A',
        UploadDate: today,
        Description: `${consumableType} for printer`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    // 2. Create Consumable record
    const newCsmId = dbRepository.getNextId('Consumables', 'CSM-', 'TransactionID');
    const newTransaction = {
      TransactionID: newCsmId,
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
      const newExpId = dbRepository.getNextId('Expenses', 'EXP-', 'ExpenseID');
      const newExpense = {
        ExpenseID: newExpId,
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
      const newPrinterId = dbRepository.getNextId('Printers', 'PRN-', 'PrinterID');
      const newPrinter = {
        ...printerData,
        PrinterID: newPrinterId,
        Status: printerData.Status || 'In Use'
      };
      updated = [newPrinter, ...printers];
    }

    await dbRepository.updateTable('Printers', updated);
    return printerData;
  }
};
