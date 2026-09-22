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
    const users = dbRepository.getTable('Users');
    const repairs = dbRepository.getTable('Repairs');
    const invoices = dbRepository.getTable('Invoices');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parts.map(p => {
      const asset = assets.find(a => a.AssetID === p.AssetID) || {};
      const user = users.find(u => u.UserID === asset.CurrentUserID);
      const repair = repairs.find(r => r.RepairID === p.RepairID) || {};
      const invoice = invoices.find(i => i.InvoiceID === p.InvoiceID) || {};

      let remainingDays = null;
      let warrantyBadgeType = 'none'; // 'active', 'expiring-soon', 'expired', 'none'
      let warrantyStatus = p.WarrantyStatus || (p.WarrantyEnd ? 'Active' : 'No Warranty');

      if (p.WarrantyEnd) {
        const endDate = new Date(p.WarrantyEnd);
        endDate.setHours(0, 0, 0, 0);
        if (!isNaN(endDate.getTime())) {
          remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          if (remainingDays < 0) {
            warrantyBadgeType = 'expired';
            warrantyStatus = 'Expired';
          } else if (remainingDays <= 60) {
            warrantyBadgeType = 'expiring-soon';
            warrantyStatus = 'Expiring Soon';
          } else {
            warrantyBadgeType = 'active';
            warrantyStatus = 'Active';
          }
        }
      }

      return {
        ...p,
        AssetType: asset.AssetType || 'Device',
        Brand: asset.Brand || '',
        Model: asset.Model || '',
        VerifiedNo: asset.VerifiedNo || 'N/A',
        AssignedUserName: user ? user.Name : 'Unassigned',
        ProblemDescription: repair.ProblemDescription || '',
        RepairStatus: repair.Status || '',
        RepairDate: repair.RepairDate || p.NewPartInstalledDate || 'N/A',
        InvoiceNumber: invoice.InvoiceNumber || p.InvoiceID || '',
        InvoiceFile: invoice.FileName || '',
        InvoiceAmount: invoice.Amount || 0,
        WarrantyPeriod: p.WarrantyPeriod || (p.WarrantyEnd ? 'Covered' : 'None'),
        WarrantyStart: p.WarrantyStart || p.NewPartInstalledDate || '',
        WarrantyEnd: p.WarrantyEnd || '',
        WarrantyProvider: p.WarrantyProvider || p.Supplier || 'Vendor',
        WarrantyRemainingDays: remainingDays,
        WarrantyBadgeType: warrantyBadgeType,
        WarrantyStatus: warrantyStatus
      };
    }).sort((a, b) => new Date(b.NewPartInstalledDate || 0) - new Date(a.NewPartInstalledDate || 0));
  },

  getWarrantySummary() {
    const partsWithWarranty = this.getParts().filter(p => p.WarrantyEnd && p.WarrantyEnd.trim());
    const active = partsWithWarranty.filter(p => p.WarrantyBadgeType === 'active' || p.WarrantyBadgeType === 'expiring-soon');
    const expiringSoon = partsWithWarranty.filter(p => p.WarrantyBadgeType === 'expiring-soon');
    const expired = partsWithWarranty.filter(p => p.WarrantyBadgeType === 'expired');

    // Sort: expiring soonest first, then active, then expired
    const sortedParts = [...partsWithWarranty].sort((a, b) => {
      if (a.WarrantyRemainingDays === null) return 1;
      if (b.WarrantyRemainingDays === null) return -1;
      if (a.WarrantyRemainingDays >= 0 && b.WarrantyRemainingDays < 0) return -1;
      if (a.WarrantyRemainingDays < 0 && b.WarrantyRemainingDays >= 0) return 1;
      return a.WarrantyRemainingDays - b.WarrantyRemainingDays;
    });

    return {
      totalWarrantiedParts: partsWithWarranty.length,
      activeCount: active.length,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      warrantyParts: sortedParts
    };
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

    // Normalize parts list (supports multiple parts on a single invoice/repair)
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
        partCost: Number(repairCost) || 0,
        warrantyPeriod: '1 Year',
        warrantyStart: today,
        warrantyEnd: '',
        warrantyProvider: repairSupplier
      }];
    }

    // Auto-calculate total parts cost if user entered individual costs
    const totalPartsCost = effectiveParts.reduce((sum, p) => sum + (Number(p.partCost) || 0), 0);
    const effectiveRepairCost = Number(repairCost) > 0 ? Number(repairCost) : totalPartsCost;

    // 1. Process Invoice if a file is provided or invoice number was entered
    let effectiveInvoiceId = invoiceId;
    const finalInvoiceAmount = invoiceAmount !== null && invoiceAmount !== undefined && invoiceAmount !== ''
      ? Number(invoiceAmount)
      : effectiveRepairCost;

    if (invoiceFile) {
      try {
        const invRecord = await invoiceService.uploadInvoiceFile(invoiceFile, {
          InvoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
          InvoiceDate: today,
          Supplier: invoiceSupplier || repairSupplier,
          Amount: finalInvoiceAmount,
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
        Amount: finalInvoiceAmount,
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

    // Formulate comprehensive parts summary text with clear separators
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
      RepairCost: effectiveRepairCost,
      WarrantyCovered: warrantyCovered,
      Status: status,
      CompletedDate: status === 'Completed' ? (completedDate || today) : '',
      LastServiceDate: today,
      NextServiceDate: nextServiceDate,
      InvoiceID: effectiveInvoiceId,
      Notes: notes
    };
    await dbRepository.updateTable('Repairs', [newRepair, ...repairs]);

    // 4. Add all physical hardware parts (Multiple parts with individual warranty tracking)
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
          Cost: Number(p.partCost) || (effectiveParts.length === 1 ? effectiveRepairCost : 0),
          Supplier: repairSupplier,
          InvoiceID: effectiveInvoiceId,
          WarrantyPeriod: p.warrantyPeriod || '1 Year',
          WarrantyStart: p.warrantyStart || today,
          WarrantyEnd: p.warrantyEnd || '',
          WarrantyProvider: p.warrantyProvider || repairSupplier,
          WarrantyStatus: p.warrantyStatus || (p.warrantyEnd ? 'Active' : 'No Warranty'),
          Notes: notes
        });
      });
      await dbRepository.updateTable('Parts', [...newPartRecords, ...parts]);

      // 4b. If any newly installed component was marked to register as an official company asset (e.g. Mouse, Keyboard, Peripheral)
      const targetAssetForPeripheral = assets.find(a => a.AssetID === assetId);
      const recipientUserId = targetAssetForPeripheral ? targetAssetForPeripheral.CurrentUserID : '';
      const newPeripheralAssets = [];
      const newAssignmentRecords = [];
      const assignments = dbRepository.getTable('Assignments');

      effectiveParts.forEach((p) => {
        const isPeripheral = p.partType === 'Mouse' || p.partType === 'Keyboard' || p.partType === 'Keyboard & Mouse' || p.partType === 'Other';
        if (p.registerAsAsset || (p.isNewAdditionOnly && isPeripheral && p.registerAsAsset !== false)) {
          if (recipientUserId) {
            // Compute safe unique Asset ID and Tag
            const currentMaxAst = Math.max(
              ...assets.map(a => {
                const m = String(a.AssetID || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              }),
              ...newPeripheralAssets.map(a => {
                const m = String(a.AssetID || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              }),
              0
            );
            const nextAssetIndex = currentMaxAst + 1;
            const newAssetId = `AST-${String(nextAssetIndex).padStart(4, '0')}`;
            const tagNum = String(nextAssetIndex).padStart(3, '0');
            const assetType = p.partType === 'Mouse' ? 'Mouse' : p.partType === 'Keyboard' ? 'Keyboard' : 'Peripheral';

            newPeripheralAssets.push({
              AssetID: newAssetId,
              VerifiedNo: `KMN/CH/CP/${tagNum}`,
              AssetType: assetType,
              Brand: 'Standard',
              Model: p.newPartDetails || `${assetType} (New Issue)`,
              SerialNumber: p.newPartSerial || '',
              Specifications: p.newPartDetails || '',
              PurchaseDate: today,
              PurchaseCost: Number(p.partCost) || 0,
              WarrantyStart: p.warrantyStart || today,
              WarrantyEnd: p.warrantyEnd || '',
              Status: 'Assigned',
              CurrentUserID: recipientUserId,
              CurrentLocationID: targetAssetForPeripheral.CurrentLocationID || 'LOC-0001',
              Notes: `Issued to employee via Service Log ${repairId} on ${today} [Warranty: ${p.warrantyPeriod || '1 Year'}]`
            });

            const currentMaxAsn = Math.max(
              ...assignments.map(as => {
                const m = String(as.AssignmentID || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              }),
              ...newAssignmentRecords.map(as => {
                const m = String(as.AssignmentID || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              }),
              0
            );
            const newAssignmentId = `ASN-${String(currentMaxAsn + 1).padStart(4, '0')}`;

            newAssignmentRecords.push({
              AssignmentID: newAssignmentId,
              AssetID: newAssetId,
              UserID: recipientUserId,
              LocationID: targetAssetForPeripheral.CurrentLocationID || 'LOC-0001',
              AssignedDate: today,
              ReturnedDate: '',
              AssignmentStatus: 'Current',
              ConditionWhenAssigned: 'Brand New',
              ConditionWhenReturned: '',
              Reason: `Newly Issued Peripheral (${assetType}) to employee`,
              HandoverFormRef: effectiveInvoiceId || repairId,
              Notes: `Issued during service ${repairId}: ${problemDescription}`
            });
          }
        }
      });

      if (newPeripheralAssets.length > 0) {
        await dbRepository.updateTable('Assets', [...newPeripheralAssets, ...assets]);
      }
      if (newAssignmentRecords.length > 0) {
        await dbRepository.updateTable('Assignments', [...newAssignmentRecords, ...assignments]);
      }
    }

    // 5. Record Expense if cost > 0
    if (effectiveRepairCost > 0) {
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
        Amount: effectiveRepairCost,
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
