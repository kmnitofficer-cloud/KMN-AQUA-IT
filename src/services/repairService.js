import { dbRepository } from './dbRepository';
import { invoiceService } from './invoiceService';

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
    warningNote = '',
    // Multi-part Replacement Support (array of parts)
    hasPartReplacement = false,
    partsList = [],
    // Legacy single part fields fallback
    partType = 'RAM',
    oldPartDetails = '',
    oldPartSerial = '',
    newPartDetails = '',
    newPartSerial = '',
    // Invoice handling
    invoiceId = '',
    invoiceNumber = '',
    invoiceFile = null,
    invoiceSupplier = '',
    invoiceAmount = null
  }) {
    const today = repairDate || new Date().toISOString().split('T')[0];
    const repairs = dbRepository.getTable('Repairs');
    const parts = dbRepository.getTable('Parts');
    const expenses = dbRepository.getTable('Expenses');
    const assets = dbRepository.getTable('Assets');
    const invoices = dbRepository.getTable('Invoices');

    // 1. Process Invoice if a file is provided or invoice number was entered
    let effectiveInvoiceId = invoiceId;
    if (invoiceFile) {
      try {
        const invRecord = await invoiceService.uploadInvoiceFile(invoiceFile, {
          InvoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
          InvoiceDate: today,
          Supplier: invoiceSupplier || repairSupplier,
          Amount: invoiceAmount !== null && invoiceAmount !== undefined ? Number(invoiceAmount) : Number(repairCost) || 0,
          AssetID: assetId,
          Description: `Invoice for repair/service: ${problemDescription}`
        });
        if (invRecord && invRecord.InvoiceID) {
          effectiveInvoiceId = invRecord.InvoiceID;
        }
      } catch (err) {
        console.warn('Automatic invoice upload failed, creating local fallback record:', err);
      }
    } else if (!effectiveInvoiceId && invoiceNumber && invoiceNumber.trim()) {
      effectiveInvoiceId = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
      const newInvoice = {
        InvoiceID: effectiveInvoiceId,
        InvoiceNumber: invoiceNumber.trim(),
        InvoiceDate: today,
        Supplier: invoiceSupplier || repairSupplier,
        Amount: invoiceAmount !== null && invoiceAmount !== undefined ? Number(invoiceAmount) : Number(repairCost) || 0,
        AssetID: assetId,
        UserID: '',
        PrinterAssetID: '',
        ExpenseID: '',
        FileName: `Invoice_${invoiceNumber.trim()}.pdf`,
        FilePath: '',
        FileSize: '100 KB',
        UploadDate: today,
        Description: `Invoice for repair: ${problemDescription}`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    // 2. Normalize parts list (supports multiple parts on a single invoice/repair)
    let effectiveParts = [];
    if (Array.isArray(partsList) && partsList.length > 0) {
      effectiveParts = partsList.filter(p => p && (p.newPartDetails || p.oldPartDetails));
    } else if (hasPartReplacement && (newPartDetails || oldPartDetails)) {
      effectiveParts = [{
        partType: partType || 'RAM',
        isNewAdditionOnly: false,
        oldPartDetails: oldPartDetails || 'Original component',
        oldPartSerial: oldPartSerial || 'N/A',
        newPartDetails: newPartDetails || 'Replaced Part',
        newPartSerial: newPartSerial || 'N/A',
        partCost: Number(repairCost) || 0
      }];
    }

    // Formulate comprehensive parts summary text
    let generatedPartsSummary = partsReplaced;
    if (!generatedPartsSummary && effectiveParts.length > 0) {
      generatedPartsSummary = effectiveParts.map(p => {
        const typeStr = p.partType || 'Part';
        const newStr = p.newPartDetails || 'New Part';
        const snStr = p.newPartSerial && p.newPartSerial !== 'N/A' ? ` (S/N: ${p.newPartSerial})` : '';
        return `${typeStr}: ${newStr}${snStr}`;
      }).join('; ');
    }

    let defaultAction = actionTaken;
    if (!defaultAction) {
      if (effectiveParts.length > 0) {
        defaultAction = `Installed/Replaced ${effectiveParts.length} parts (${effectiveParts.map(p => p.partType || 'Part').join(', ')})`;
      } else {
        defaultAction = 'Routine Service / Inspection';
      }
    }

    // 3. Add Repair record
    const nextRepNum = repairs.length + 1;
    const repairId = `REP-${String(nextRepNum).padStart(4, '0')}`;
    const newRepair = {
      RepairID: repairId,
      AssetID: assetId,
      RepairDate: today,
      ProblemDescription: problemDescription,
      Diagnosis: diagnosis || problemDescription,
      ActionTaken: defaultAction,
      PartsReplaced: generatedPartsSummary || 'N/A',
      RepairSupplier: repairSupplier,
      Technician: technician,
      RepairCost: Number(repairCost) || 0,
      WarrantyCovered: warrantyCovered,
      Status: status,
      CompletedDate: status === 'Completed' ? (completedDate || today) : '',
      LastServiceDate: today,
      NextServiceDate: nextServiceDate,
      InvoiceID: effectiveInvoiceId,
      Notes: notes
    };
    await dbRepository.updateTable('Repairs', [newRepair, ...repairs]);

    // 4. Add all physical hardware parts (Multiple parts supported on the same repair/invoice!)
    if (effectiveParts.length > 0) {
      const newPartRecords = [];
      effectiveParts.forEach((p, idx) => {
        const nextPrtNum = parts.length + idx + 1;
        const partId = `PRT-${String(nextPrtNum).padStart(4, '0')}`;
        newPartRecords.push({
          PartID: partId,
          AssetID: assetId,
          RepairID: repairId,
          PartType: p.partType || 'Hardware Component',
          OldPartDetails: p.isNewAdditionOnly ? 'None (New Addition / Upgrade)' : (p.oldPartDetails || 'Original component'),
          OldPartSerial: p.isNewAdditionOnly ? 'N/A' : (p.oldPartSerial || 'N/A'),
          OldPartRemovedDate: today,
          NewPartDetails: p.newPartDetails || 'Replaced Hardware',
          NewPartSerial: p.newPartSerial || 'N/A',
          NewPartInstalledDate: today,
          Cost: Number(p.partCost) || (effectiveParts.length === 1 ? Number(repairCost) || 0 : 0),
          Supplier: repairSupplier,
          InvoiceID: effectiveInvoiceId,
          Notes: notes
        });
      });
      await dbRepository.updateTable('Parts', [...newPartRecords, ...parts]);
    }

    // 5. Record Expense if cost > 0
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
        DepartmentID: targetAsset && targetAsset.DepartmentID ? targetAsset.DepartmentID : 'DEP-0004',
        Supplier: repairSupplier,
        Description: `Repair for ${targetAsset ? targetAsset.Model : assetId}: ${problemDescription}${effectiveParts.length > 1 ? ` (${effectiveParts.length} parts replaced)` : ''}`,
        Amount: Number(repairCost) || 0,
        PaymentMethod: 'Company Cheque',
        InvoiceID: effectiveInvoiceId,
        Notes: notes
      };
      await dbRepository.updateTable('Expenses', [newExpense, ...expenses]);
    }

    // 5. Update Asset Status and Health Level
    const isWarning = status.includes('Warning') || status.includes('Observation') || !!warningNote;
    const printers = dbRepository.getTable('Printers');

    const updatedAssets = assets.map(a => {
      if (a.AssetID === assetId) {
        if (isWarning) {
          return {
            ...a,
            HealthStatus: 'Warning',
            WarningNote: warningNote || problemDescription || notes || 'Under daily observation',
            LastCheckedDate: today,
            Status: a.CurrentUserID ? 'Assigned' : 'Available',
            Notes: `${a.Notes || ''} [⚠️ Warning Logged ${today}: ${warningNote || problemDescription}]`.trim()
          };
        } else if (status === 'Completed' || status.includes('Healthy')) {
          return {
            ...a,
            HealthStatus: 'Healthy',
            WarningNote: '',
            LastCheckedDate: today,
            Status: a.CurrentUserID ? 'Assigned' : 'Available',
            Notes: `${a.Notes || ''} [Service completed on ${today}]`.trim()
          };
        } else if (status === 'In Progress' || status === 'Pending Parts') {
          return {
            ...a,
            HealthStatus: 'Critical',
            Status: 'Under Repair',
            Notes: `${a.Notes || ''} [In Repair: ${problemDescription}]`.trim()
          };
        }
      }
      return a;
    });
    await dbRepository.updateTable('Assets', updatedAssets);

    // If target asset is a printer, update printer status remark as well
    const updatedPrinters = printers.map(p => {
      if (p.AssetID === assetId) {
        return {
          ...p,
          Status: isWarning ? 'Error / Attention' : (status === 'Completed' ? 'In Use' : 'Under Maintenance'),
          Notes: isWarning ? (warningNote || problemDescription) : p.Notes
        };
      }
      return p;
    });
    await dbRepository.updateTable('Printers', updatedPrinters);

    return newRepair;
  }
};
