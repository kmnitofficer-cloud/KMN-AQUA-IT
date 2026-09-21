import { dbRepository } from './dbRepository';

export const assetService = {
  getAssets(filter = 'All') {
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');

    // Enrich with User & Location info
    const enriched = assets.map(a => {
      const user = users.find(u => u.UserID === a.CurrentUserID);
      const loc = locations.find(l => l.LocationID === a.CurrentLocationID);
      return {
        ...a,
        AssignedUserName: user ? user.Name : 'Unassigned',
        LocationName: loc ? loc.OfficeName : 'General Storage'
      };
    });

    if (filter === 'All') return enriched;
    if (filter === 'Computers') return enriched.filter(a => ['Desktop', 'CPU', 'All-in-One'].includes(a.AssetType));
    if (filter === 'Laptops') return enriched.filter(a => a.AssetType === 'Laptop');
    if (filter === 'Monitors') return enriched.filter(a => a.AssetType === 'Monitor');
    if (filter === 'Printers') return enriched.filter(a => a.AssetType === 'Printer');
    if (filter === 'Accessories') return enriched.filter(a => ['Keyboard', 'Mouse', 'UPS', 'Accessory', 'Other'].includes(a.AssetType));
    if (filter === 'Unassigned') return enriched.filter(a => !a.CurrentUserID || a.Status === 'Available' || a.Status === 'In Storage');
    if (filter === 'Under Repair') return enriched.filter(a => a.Status === 'Under Repair');
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

    if (asset.AssetID) {
      updated = assets.map(a => a.AssetID === asset.AssetID ? { ...a, ...asset } : a);
    } else {
      const nextNum = assets.length + 1;
      const newId = `AST-${String(nextNum).padStart(4, '0')}`;
      const newAsset = {
        ...asset,
        AssetID: newId,
        Status: asset.Status || 'Available',
        PurchaseDate: asset.PurchaseDate || new Date().toISOString().split('T')[0]
      };
      updated = [newAsset, ...assets];
    }

    await dbRepository.updateTable('Assets', updated);
    return asset;
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
  }
};
