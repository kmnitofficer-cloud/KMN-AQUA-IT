import { dbRepository } from './dbRepository';

export const repairService = {
  getRepairs() {
    const repairs = dbRepository.getTable('Repairs');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');

    return repairs.map(r => {
      const asset = assets.find(a => a.AssetID === r.AssetID) || {};
      const user = users.find(u => u.UserID === asset.CurrentUserID);

      return {
        ...r,
        AssetType: asset.AssetType || 'Device',
        Brand: asset.Brand || '',
        Model: asset.Model || '',
        VerifiedNo: asset.VerifiedNo || 'N/A',
        AssignedUserName: user ? user.Name : 'Unassigned'
      };
    }).sort((a, b) => new Date(b.RepairDate || 0) - new Date(a.RepairDate || 0));
  },

  getParts() {
    const parts = dbRepository.getTable('Parts');
    const assets = dbRepository.getTable('Assets');

    return parts.map(p => {
      const asset = assets.find(a => a.AssetID === p.AssetID) || {};
      return {
        ...p,
        AssetType: asset.AssetType || 'Device',
        Brand: asset.Brand || '',
        Model: asset.Model || '',
        VerifiedNo: asset.VerifiedNo || 'N/A'
      };
    }).sort((a, b) => new Date(b.NewPartInstalledDate || 0) - new Date(a.NewPartInstalledDate || 0));
  },

  async logRepair({
    assetId,
    repairDate,
    problemDescription,
    diagnosis = '',
    actionTaken = '',
    partsReplaced = '',
    repairSupplier = 'KMN IT Solution',
    technician = 'IT Specialist',
    repairCost = 0,
    warrantyCovered = 'No',
    status = 'Completed',
    completedDate = '',
    nextServiceDate = '',
    notes = '',
    // Optional Part Replacement fields (Old vs New)
    hasPartReplacement = false,
    partType = 'RAM',
    oldPartDetails = '',
    oldPartSerial = '',
    newPartDetails = '',
    newPartSerial = '',
    // Optional Invoice
    invoiceNumber = '',
    invoiceFile = null
  }) {
    const today = repairDate || new Date().toISOString().split('T')[0];
    const repairs = dbRepository.getTable('Repairs');
    const parts = dbRepository.getTable('Parts');
    const expenses = dbRepository.getTable('Expenses');
    const assets = dbRepository.getTable('Assets');
    const invoices = dbRepository.getTable('Invoices');

    // 1. Generate Invoice if needed
    let invoiceId = '';
    if (invoiceNumber || invoiceFile) {
      invoiceId = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
      const newInvoice = {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        InvoiceDate: today,
        Supplier: repairSupplier,
        Amount: Number(repairCost) || 0,
        AssetID: assetId,
        UserID: '',
        PrinterAssetID: '',
        ExpenseID: '',
        FileName: invoiceFile ? invoiceFile.name : `Invoice_${invoiceNumber || invoiceId}.pdf`,
        FilePath: invoiceFile ? `/invoices/${invoiceFile.name}` : '',
        FileSize: '150 KB',
        UploadDate: today,
        Description: `Invoice for repair: ${problemDescription}`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    // 2. Add Repair record
    const nextRepNum = repairs.length + 1;
    const repairId = `REP-${String(nextRepNum).padStart(4, '0')}`;
    const newRepair = {
      RepairID: repairId,
      AssetID: assetId,
      RepairDate: today,
      ProblemDescription: problemDescription,
      Diagnosis: diagnosis || problemDescription,
      ActionTaken: actionTaken || (hasPartReplacement ? `Replaced ${partType}` : 'Serviced'),
      PartsReplaced: partsReplaced || (hasPartReplacement ? newPartDetails : 'N/A'),
      RepairSupplier: repairSupplier,
      Technician: technician,
      RepairCost: Number(repairCost) || 0,
      WarrantyCovered: warrantyCovered,
      Status: status,
      CompletedDate: status === 'Completed' ? (completedDate || today) : '',
      LastServiceDate: today,
      NextServiceDate: nextServiceDate,
      InvoiceID: invoiceId,
      Notes: notes
    };
    await dbRepository.updateTable('Repairs', [newRepair, ...repairs]);

    // 3. Add Part Replacement (Old vs New) if specified
    if (hasPartReplacement) {
      const nextPrtNum = parts.length + 1;
      const newPart = {
        PartID: `PRT-${String(nextPrtNum).padStart(4, '0')}`,
        AssetID: assetId,
        RepairID: repairId,
        PartType: partType,
        OldPartDetails: oldPartDetails || 'Original component',
        OldPartSerial: oldPartSerial || 'N/A',
        OldPartRemovedDate: today,
        NewPartDetails: newPartDetails,
        NewPartSerial: newPartSerial || 'N/A',
        NewPartInstalledDate: today,
        Cost: Number(repairCost) || 0,
        Supplier: repairSupplier,
        InvoiceID: invoiceId,
        Notes: notes
      };
      await dbRepository.updateTable('Parts', [newPart, ...parts]);
    }

    // 4. Record Expense if cost > 0
    if (Number(repairCost) > 0) {
      const targetAsset = assets.find(a => a.AssetID === assetId);
      const nextExpNum = expenses.length + 1;
      const newExpense = {
        ExpenseID: `EXP-${String(nextExpNum).padStart(4, '0')}`,
        ExpenseDate: today,
        ExpenseType: 'Repair',
        AssetID: assetId,
        UserID: targetAsset ? targetAsset.CurrentUserID : '',
        PrinterAssetID: targetAsset && targetAsset.AssetType === 'Printer' ? assetId : '',
        DepartmentID: 'DEP-0004',
        Supplier: repairSupplier,
        Description: `Repair for ${targetAsset ? targetAsset.Model : assetId}: ${problemDescription}`,
        Amount: Number(repairCost) || 0,
        PaymentMethod: 'Company Cheque',
        InvoiceID: invoiceId,
        Notes: notes
      };
      await dbRepository.updateTable('Expenses', [newExpense, ...expenses]);
    }

    // 5. Update Asset Status if repair was completed
    if (status === 'Completed') {
      const updatedAssets = assets.map(a => {
        if (a.AssetID === assetId) {
          return {
            ...a,
            Status: a.CurrentUserID ? 'Assigned' : 'Available',
            Notes: `${a.Notes || ''} [Repaired on ${today}]`.trim()
          };
        }
        return a;
      });
      await dbRepository.updateTable('Assets', updatedAssets);
    } else if (status === 'In Progress' || status === 'Pending Parts') {
      const updatedAssets = assets.map(a => {
        if (a.AssetID === assetId) {
          return {
            ...a,
            Status: 'Under Repair'
          };
        }
        return a;
      });
      await dbRepository.updateTable('Assets', updatedAssets);
    }

    return newRepair;
  }
};
