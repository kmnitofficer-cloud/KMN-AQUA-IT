import { dbRepository } from './dbRepository';

export const assetService = {
  getAssets(filter = 'All') {
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');
    const departments = dbRepository.getTable('Departments');

    // Enrich with User & Location info
    const enriched = assets.map(a => {
      const isShared = a.CurrentUserID === 'SHARED_NETWORK' || a.Status === 'Shared / Networked';
      const user = isShared ? null : users.find(u => u.UserID === a.CurrentUserID);
      const loc = locations.find(l => l.LocationID === a.CurrentLocationID);
      const dept = user ? departments.find(d => d.DepartmentID === user.DepartmentID) : null;
      return {
        ...a,
        IsSharedNetwork: isShared,
        AssignedUserName: isShared ? '🌐 Shared Network (All Staff)' : (user ? user.Name : 'Unassigned (Storage)'),
        AssignedUserDepartment: isShared ? 'Branch Wide' : (dept ? dept.DepartmentName : ''),
        LocationName: loc ? loc.OfficeName : 'General Storage'
      };
    });

    if (filter === 'All') return enriched;
    if (filter === 'Computers') return enriched.filter(a => ['Desktop', 'CPU', 'All-in-One'].includes(a.AssetType));
    if (filter === 'Laptops') return enriched.filter(a => a.AssetType === 'Laptop');
    if (filter === 'Monitors') return enriched.filter(a => a.AssetType === 'Monitor');
    if (filter === 'Printers') return enriched.filter(a => a.AssetType === 'Printer');
    if (filter === 'Accessories') return enriched.filter(a => ['Keyboard', 'Mouse', 'UPS', 'Accessory', 'Other'].includes(a.AssetType));
    if (filter === 'Shared') return enriched.filter(a => a.IsSharedNetwork || a.Status === 'Shared / Networked');
    if (filter === 'Unassigned') return enriched.filter(a => !a.IsSharedNetwork && (!a.CurrentUserID || a.Status === 'Available' || a.Status === 'In Storage'));
    if (filter === 'Under Repair') return enriched.filter(a => a.Status === 'Under Repair');
    if (filter === 'Warnings') return enriched.filter(a => a.HealthStatus === 'Warning' || (a.Status && a.Status.includes('Warning')) || (a.Notes && (a.Notes.toLowerCase().includes('warning') || a.Notes.toLowerCase().includes('low performance') || a.Notes.toLowerCase().includes('error'))));
    return enriched;
  },

  getAssetById(assetId) {
    const assets = this.getAssets('All');
    return assets.find(a => a.AssetID === assetId) || null;
  },

  getAssetComponents(assetId) {
    const components = dbRepository.getTable('AssetComponents');
    const assets = this.getAssets('All');
    
    // Components where this asset is the parent
    const childLinks = components.filter(c => c.ParentAssetID === assetId);
    return childLinks.map(c => {
      const childAsset = assets.find(a => a.AssetID === c.ChildAssetID) || {};
      return {
        ...c,
        ChildAsset: childAsset
      };
    });
  },

  getAssetTimeline(assetId) {
    const asset = this.getAssetById(assetId);
    if (!asset) return [];

    const assignments = dbRepository.getTable('Assignments').filter(a => a.AssetID === assetId);
    const repairs = dbRepository.getTable('Repairs').filter(r => r.AssetID === assetId);
    const parts = dbRepository.getTable('Parts').filter(p => p.AssetID === assetId);
    const consumables = dbRepository.getTable('Consumables').filter(c => c.PrinterAssetID === assetId);
    const expenses = dbRepository.getTable('Expenses').filter(e => e.AssetID === assetId || e.PrinterAssetID === assetId);
    const invoices = dbRepository.getTable('Invoices').filter(i => i.AssetID === assetId || i.PrinterAssetID === assetId);
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');

    const timeline = [];

    // 1. Initial Purchase / Intake
    if (asset.PurchaseDate) {
      timeline.push({
        id: `timeline-purchase-${asset.AssetID}`,
        type: 'purchase',
        date: asset.PurchaseDate,
        title: `Purchased & Registered`,
        description: `Acquired for Rs. ${Number(asset.PurchaseCost || 0).toLocaleString()} (${asset.Brand} ${asset.Model})`,
        cost: asset.PurchaseCost,
        icon: 'ShoppingCart',
        badge: 'Acquisition'
      });
    }

    // 2. Assignments & Returns
    assignments.forEach(asgn => {
      const u = users.find(usr => usr.UserID === asgn.UserID);
      const l = locations.find(loc => loc.LocationID === asgn.LocationID);
      const userName = u ? u.Name : 'Office Storage / Shared Desk';
      const locName = l ? l.OfficeName : 'Office';

      timeline.push({
        id: `timeline-asgn-${asgn.AssignmentID}`,
        type: 'assignment',
        date: asgn.AssignedDate,
        title: `Assigned to ${userName}`,
        description: `Location: ${locName}. Reason: ${asgn.Reason || 'Standard assignment'}. Condition: ${asgn.ConditionWhenAssigned || 'Working'}.`,
        notes: asgn.Notes,
        icon: 'UserCheck',
        badge: asgn.AssignmentStatus === 'Current' ? 'Current Assignment' : 'Historical Assignment'
      });

      if (asgn.ReturnedDate) {
        timeline.push({
          id: `timeline-ret-${asgn.AssignmentID}`,
          type: 'return',
          date: asgn.ReturnedDate,
          title: `Returned by ${userName}`,
          description: `Condition: ${asgn.ConditionWhenReturned || 'Normal'}. Reason: ${asgn.Reason || 'Returned'}`,
          icon: 'UserMinus',
          badge: 'Returned'
        });
      }
    });

    // 3. Repairs & Maintenance
    repairs.forEach(rep => {
      timeline.push({
        id: `timeline-rep-${rep.RepairID}`,
        type: 'repair',
        date: rep.RepairDate,
        title: `Repair / Maintenance: ${rep.ActionTaken || rep.ProblemDescription}`,
        description: `Vendor: ${rep.RepairSupplier || 'KMN IT Solution'}. Diagnosis: ${rep.Diagnosis || rep.ProblemDescription}. Parts: ${rep.PartsReplaced || 'N/A'}. Cost: Rs. ${Number(rep.RepairCost || 0).toLocaleString()}`,
        cost: rep.RepairCost,
        icon: 'Wrench',
        badge: rep.Status || 'Completed'
      });
    });

    // 4. Parts Replacement (Old vs New)
    parts.forEach(part => {
      timeline.push({
        id: `timeline-part-${part.PartID}`,
        type: 'part',
        date: part.NewPartInstalledDate || part.OldPartRemovedDate,
        title: `Component Replacement: ${part.PartType}`,
        description: `Old: ${part.OldPartDetails || 'N/A'} (Removed) ➔ New: ${part.NewPartDetails || 'N/A'} (Installed). Cost: Rs. ${Number(part.Cost || 0).toLocaleString()}`,
        cost: part.Cost,
        icon: 'Cpu',
        badge: 'Part Upgrade'
      });
    });

    // 5. Consumables / Toner History (for printers)
    consumables.forEach(csm => {
      timeline.push({
        id: `timeline-csm-${csm.TransactionID}`,
        type: 'consumable',
        date: csm.Date,
        title: `Consumable Replaced: ${csm.ConsumableType}`,
        description: `Cartridge: ${csm.Model || 'Standard'} (Qty: ${csm.Quantity || 1}). Cost: Rs. ${Number(csm.TotalCost || 0).toLocaleString()}. Supplier: ${csm.Supplier}`,
        cost: csm.TotalCost,
        icon: 'Printer',
        badge: 'Consumable'
      });
    });

    // 6. Invoices & Expenses
    invoices.forEach(inv => {
      timeline.push({
        id: `timeline-inv-${inv.InvoiceID}`,
        type: 'invoice',
        date: inv.InvoiceDate,
        title: `Invoice Attached: ${inv.InvoiceNumber}`,
        description: `Vendor: ${inv.Supplier}. Amount: Rs. ${Number(inv.Amount || 0).toLocaleString()}. Document: ${inv.FileName}`,
        cost: inv.Amount,
        invoiceFile: inv.FilePath,
        icon: 'FileText',
        badge: 'Document'
      });
    });

    // Sort chronologically (descending for recent events first)
    return timeline.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  },

  async saveAsset(asset) {
    const assets = dbRepository.getTable('Assets');
    let updated;
    let savedAsset;

    const isShared = asset.CurrentUserID === 'SHARED_NETWORK' || asset.Status === 'Shared / Networked';

    if (asset.AssetID) {
      savedAsset = {
        ...asset,
        Status: isShared ? 'Shared / Networked' : (asset.CurrentUserID ? 'Assigned' : (asset.Status || 'Available'))
      };
      updated = assets.map(a => a.AssetID === asset.AssetID ? { ...a, ...savedAsset } : a);
    } else {
      const newId = dbRepository.getNextId('Assets', 'AST-', 'AssetID');
      savedAsset = {
        ...asset,
        AssetID: newId,
        Status: isShared ? 'Shared / Networked' : (asset.CurrentUserID ? 'Assigned' : (asset.Status || 'Available')),
        PurchaseDate: asset.PurchaseDate || new Date().toISOString().split('T')[0]
      };
      updated = [savedAsset, ...assets];
    }

    await dbRepository.updateTable('Assets', updated);

    // If it is a printer, ensure it's synced with the Printers table
    if (savedAsset.AssetType === 'Printer') {
      const printers = dbRepository.getTable('Printers');
      const existingPrinter = printers.find(p => p.AssetID === savedAsset.AssetID);
      if (existingPrinter) {
        const updatedPrinters = printers.map(p => p.AssetID === savedAsset.AssetID ? {
          ...p,
          PrinterName: `${savedAsset.Brand} ${savedAsset.Model}`.trim(),
          LocationID: savedAsset.CurrentLocationID || p.LocationID || 'LOC-0001',
          AssignedUserID: savedAsset.CurrentUserID || 'SHARED_NETWORK',
          Status: isShared ? 'In Use (Shared Network)' : (savedAsset.Status || 'In Use')
        } : p);
        await dbRepository.updateTable('Printers', updatedPrinters);
      } else {
        const newPrinterId = dbRepository.getNextId('Printers', 'PRN-', 'PrinterID');
        const newPrinter = {
          PrinterID: newPrinterId,
          AssetID: savedAsset.AssetID,
          PrinterName: `${savedAsset.Brand} ${savedAsset.Model}`.trim(),
          IPAddress: savedAsset.IPAddress || '192.168.1.xxx',
          LocationID: savedAsset.CurrentLocationID || 'LOC-0001',
          DepartmentID: 'DEP-0004',
          AssignedUserID: savedAsset.CurrentUserID || 'SHARED_NETWORK',
          Status: isShared ? 'In Use (Shared Network)' : (savedAsset.Status || 'In Use'),
          TonerCartridgeModel: 'Standard Toner',
          Notes: savedAsset.Notes || 'Shared Network Printer for office staff'
        };
        await dbRepository.updateTable('Printers', [newPrinter, ...printers]);
      }
    }

    return savedAsset;
  },

  async archiveAsset(assetId, reason = 'Disposed') {
    const assets = dbRepository.getTable('Assets');
    const updated = assets.map(a => {
      if (a.AssetID === assetId) {
        return {
          ...a,
          Status: reason,
          CurrentUserID: '',
          Notes: `${a.Notes || ''} [Archived: ${reason} on ${new Date().toISOString().split('T')[0]}]`
        };
      }
      return a;
    });
    await dbRepository.updateTable('Assets', updated);
  },

  async setAssetHealth(assetId, healthStatus = 'Warning', warningNote = '') {
    const assets = dbRepository.getTable('Assets');
    const today = new Date().toISOString().split('T')[0];
    const updated = assets.map(a => {
      if (a.AssetID === assetId) {
        return {
          ...a,
          HealthStatus: healthStatus,
          WarningNote: warningNote,
          LastCheckedDate: today,
          Notes: warningNote ? `${a.Notes || ''} [Warning logged ${today}: ${warningNote}]`.trim() : a.Notes
        };
      }
      return a;
    });
    await dbRepository.updateTable('Assets', updated);
  },

  async clearAssetWarning(assetId) {
    const assets = dbRepository.getTable('Assets');
    const today = new Date().toISOString().split('T')[0];
    const updated = assets.map(a => {
      if (a.AssetID === assetId) {
        return {
          ...a,
          HealthStatus: 'Healthy',
          WarningNote: '',
          LastCheckedDate: today,
          Notes: `${a.Notes || ''} [Warning cleared on ${today}]`.trim()
        };
      }
      return a;
    });
    await dbRepository.updateTable('Assets', updated);
  },

  getCleanHardwareName(a) {
    if (!a) return '';

    // For Printers, prioritize the canonical PrinterName from the Printers table
    if (a.AssetType === 'Printer') {
      const printers = dbRepository.getTable('Printers');
      const prn = printers.find(p => p.AssetID === a.AssetID);
      if (prn && prn.PrinterName && prn.PrinterName.trim() !== '' && prn.PrinterName.toLowerCase() !== 'printer') {
        return prn.PrinterName.trim();
      }
    }

    let brand = String(a.Brand || '').trim();
    let model = String(a.Model || '').trim();
    const type = String(a.AssetType || 'Device').trim();

    if (brand.toUpperCase() === 'NONE' || brand.toLowerCase() === 'generic' || brand.toLowerCase() === 'office standard') {
      brand = '';
    }
    if (model.toUpperCase() === 'NONE' || !model) {
      if (type === 'UPS') model = 'Office UPS Backup Unit';
      else if (type === 'Mouse') model = 'Optical USB Mouse';
      else if (type === 'Keyboard') model = 'Standard Keyboard';
      else if (type === 'Monitor') model = 'Display Monitor';
      else if (type === 'Desktop' || type === 'CPU') model = 'Desktop PC Workstation';
      else if (type === 'Laptop') model = 'Business Laptop';
      else model = type;
    }
    if (brand && model.toLowerCase().startsWith(brand.toLowerCase() + ' ')) {
      model = model.slice(brand.length + 1).trim();
    }
    return [brand, model].filter(Boolean).join(' ') || type;
  },

  formatAssetLabel(a) {
    if (!a) return '';
    const user = a.AssignedUserName && a.AssignedUserName !== 'Unassigned'
      ? a.AssignedUserName
      : 'Unassigned (Storage)';
    const type = String(a.AssetType || 'Device').toUpperCase();
    const hardware = this.getCleanHardwareName(a);
    const tag = a.VerifiedNo && !a.VerifiedNo.includes('UNTAGGED') && a.VerifiedNo.trim() !== ''
      ? `(Tag: ${a.VerifiedNo})`
      : '(No Tag)';
    const status = a.Status ? `[${a.Status}]` : '';

    return `${user} ➔ [${type}] ${hardware} ${tag} ${status}`.replace(/\s+/g, ' ').trim();
  },

  groupAssetsByUser(assetsList) {
    const groupsMap = new Map();

    const typeOrder = {
      'DESKTOP': 1,
      'CPU': 1,
      'ALL-IN-ONE': 1,
      'LAPTOP': 2,
      'MONITOR': 3,
      'UPS': 4,
      'PRINTER': 5,
      'KEYBOARD': 6,
      'MOUSE': 7,
      'ACCESSORY': 8,
      'LAB EQUIPMENT': 9,
      'OTHER': 10
    };

    assetsList.forEach(a => {
      let groupKey;
      let groupLabel;
      let isAssigned = false;
      const isShared = a.IsSharedNetwork || a.CurrentUserID === 'SHARED_NETWORK' || a.Status === 'Shared / Networked';

      if (isShared) {
        groupKey = '🌐 Shared Network Devices (All Staff)';
        groupLabel = `🌐 Shared Network Devices (All Staff • ${a.LocationName || 'Office'})`;
        isAssigned = true;
      } else if (a.AssignedUserName && a.AssignedUserName !== 'Unassigned' && !a.AssignedUserName.includes('Unassigned')) {
        groupKey = a.AssignedUserName;
        const dept = a.AssignedUserDepartment ? ` • ${a.AssignedUserDepartment}` : '';
        groupLabel = `👤 ${groupKey}${dept}`;
        isAssigned = true;
      } else {
        groupKey = 'Unassigned / Office Storage';
        groupLabel = `📦 Unassigned / Office Storage`;
        isAssigned = false;
      }

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          groupKey,
          groupLabel,
          isAssigned,
          isShared,
          items: []
        });
      }
      groupsMap.get(groupKey).items.push(a);
    });

    const groups = Array.from(groupsMap.values());

    // Sort groups: Shared network first, then assigned users alphabetically, Unassigned at the bottom
    groups.sort((ga, gb) => {
      if (ga.isShared && !gb.isShared) return -1;
      if (!ga.isShared && gb.isShared) return 1;
      if (ga.isAssigned && !gb.isAssigned) return -1;
      if (!ga.isAssigned && gb.isAssigned) return 1;
      return ga.groupKey.localeCompare(gb.groupKey);
    });

    // Within each group, sort items by AssetType priority, then by Tag
    groups.forEach(g => {
      g.items.sort((ia, ib) => {
        const orderA = typeOrder[(ia.AssetType || '').toUpperCase()] || 50;
        const orderB = typeOrder[(ib.AssetType || '').toUpperCase()] || 50;
        if (orderA !== orderB) return orderA - orderB;
        return (ia.VerifiedNo || '').localeCompare(ib.VerifiedNo || '');
      });
    });

    return groups;
  }
};
