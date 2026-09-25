import { dbRepository } from './dbRepository';

export const AC_FLOORS = ['Ground Floor', 'First Floor'];

export const AC_BRANDS = ['Panasonic', 'Daikin', 'Mitsubishi', 'LG', 'Gree', 'Samsung', 'Carrier', 'Singer', 'Other'];

export const AC_STATUSES = ['Active', 'Needs Service', 'Under Repair', 'Decommissioned'];

export const AC_WORK_MODES = [
  'Normal Cooling',
  'Eco Cooling',
  'Turbo Cooling',
  'Continuous 24/7',
  'Low Power',
  'Quiet / Normal',
  'Off / Standby',
  'Off / Error'
];

export const acService = {
  getACUnits(floorFilter = 'All', statusFilter = 'All') {
    const rawUnits = dbRepository.getTable('ACUnits') || [];
    const allServices = dbRepository.getTable('ACServices') || [];
    const allRepairs = dbRepository.getTable('ACRepairs') || [];
    const allReplacements = dbRepository.getTable('ACReplacements') || [];

    return rawUnits
      .filter(u => {
        if (!u) return false;
        const matchesFloor = floorFilter === 'All' || u.Floor === floorFilter;
        const matchesStatus = statusFilter === 'All' || u.Status === statusFilter;
        return matchesFloor && matchesStatus;
      })
      .map(unit => {
        const services = allServices
          .filter(s => s.UnitID === unit.UnitID)
          .sort((a, b) => new Date(b.ServiceDate || 0) - new Date(a.ServiceDate || 0));

        const repairs = allRepairs
          .filter(r => r.UnitID === unit.UnitID)
          .sort((a, b) => new Date(b.IssueDate || 0) - new Date(a.IssueDate || 0));

        const replacements = allReplacements
          .filter(rep => rep.NewUnitID === unit.UnitID || rep.SpotCode === unit.UnitCode)
          .sort((a, b) => new Date(b.RemovalDate || 0) - new Date(a.RemovalDate || 0));

        const purchasePrice = Number(unit.PurchasePrice) || 0;
        const lifetimeServiceCost = services.reduce((acc, s) => acc + (Number(s.Cost) || 0), 0);
        const lifetimeRepairCost = repairs.reduce((acc, r) => acc + (Number(r.RepairCost) || 0), 0);
        const totalInvestedCost = purchasePrice + lifetimeServiceCost + lifetimeRepairCost;

        let normalizedRoomName = unit.RoomName;
        let normalizedCoordX = unit.CoordX;
        let normalizedCoordY = unit.CoordY;
        let normalizedUnitNumber = unit.UnitNumber;
        let normalizedUnitCode = unit.UnitCode;
        let normalizedStatus = unit.Status;
        let normalizedWallPosition = unit.WallPosition;

        if (unit.Floor === 'First Floor') {
          const ac1FMap = {
            'AC-0008': { UnitNumber: '08', UnitCode: '1F-AC-08', RoomName: "Nadun's Office (Executive Cabin)", WallPosition: "East Wall (Nadun's Office)", CoordX: 800, CoordY: 412, Status: 'Active' },
            'AC-0009': { UnitNumber: '09', UnitCode: '1F-AC-09', RoomName: '1st Floor Main Hall (East Wall)', WallPosition: 'East Wall (Main Hall)', CoordX: 830, CoordY: 506, Status: 'Active' },
            'AC-0010': { UnitNumber: '10', UnitCode: '1F-AC-10', RoomName: 'Main Auditorium (East Unit)', WallPosition: 'South Wall (East Section)', CoordX: 390, CoordY: 546, Status: 'Active' },
            'AC-0011': { UnitNumber: '11', UnitCode: '1F-AC-11', RoomName: 'Main Auditorium (Center Unit)', WallPosition: 'South Wall (Center Section)', CoordX: 300, CoordY: 546, Status: 'Active' },
            'AC-0012': { UnitNumber: '12', UnitCode: '1F-AC-12', RoomName: 'Main Auditorium (West Unit)', WallPosition: 'South Wall (West Section)', CoordX: 210, CoordY: 546, Status: 'Active' },
            'AC-0013': { UnitNumber: '13', UnitCode: '1F-AC-13', RoomName: 'Middle Connector', WallPosition: 'East Wall (Middle Connector)', CoordX: 740, CoordY: 315, Status: 'Active' },
            'AC-0014': { UnitNumber: '14', UnitCode: '1F-AC-14', RoomName: 'Main Conference Room', WallPosition: 'East Partition Wall', CoordX: 730, CoordY: 210, Status: 'Active' },
            'AC-0015': { UnitNumber: '15', UnitCode: '1F-AC-15', RoomName: '1st Floor Main Hall (Old South Wall - Removed)', WallPosition: 'South Wall', CoordX: 0, CoordY: 0, Status: 'Decommissioned' },
            'AC-0016': { UnitNumber: '16', UnitCode: '1F-AC-16', RoomName: '1st Floor Main Hall (Old South Wall - Removed)', WallPosition: 'South Wall', CoordX: 0, CoordY: 0, Status: 'Decommissioned' }
          };

          const target = ac1FMap[unit.UnitID];
          if (target) {
            normalizedUnitNumber = target.UnitNumber;
            normalizedUnitCode = target.UnitCode;
            normalizedRoomName = target.RoomName;
            normalizedCoordX = target.CoordX;
            normalizedCoordY = target.CoordY;
            normalizedStatus = target.Status;
            normalizedWallPosition = target.WallPosition;
          }
        }

        return {
          ...unit,
          UnitNumber: normalizedUnitNumber,
          UnitCode: normalizedUnitCode,
          RoomName: normalizedRoomName,
          CoordX: normalizedCoordX,
          CoordY: normalizedCoordY,
          Status: normalizedStatus,
          WallPosition: normalizedWallPosition,
          PurchasePrice: purchasePrice,
          lifetimeServiceCost,
          lifetimeRepairCost,
          totalInvestedCost,
          serviceCount: services.length,
          repairCount: repairs.length,
          services,
          repairs,
          replacements
        };
      })
      .sort((a, b) => {
        const numA = parseInt(a.UnitNumber || '0', 10);
        const numB = parseInt(b.UnitNumber || '0', 10);
        return numA - numB;
      });
  },

  getACUnitById(unitId) {
    const units = this.getACUnits();
    return units.find(u => u.UnitID === unitId || u.UnitCode === unitId) || null;
  },

  getACSummary() {
    const units = this.getACUnits();
    const allServices = dbRepository.getTable('ACServices') || [];
    const allRepairs = dbRepository.getTable('ACRepairs') || [];
    const allReplacements = dbRepository.getTable('ACReplacements') || [];

    const totalUnits = units.length;
    const activeUnits = units.filter(u => u.Status === 'Active').length;
    const needsServiceUnits = units.filter(u => u.Status === 'Needs Service').length;
    const underRepairUnits = units.filter(u => u.Status === 'Under Repair').length;
    const decommissionedUnits = units.filter(u => u.Status === 'Decommissioned').length;

    const totalAssetCost = units.reduce((acc, u) => acc + (Number(u.PurchasePrice) || 0), 0);
    const totalServiceCost = allServices.reduce((acc, s) => acc + (Number(s.Cost) || 0), 0);
    const totalRepairCost = allRepairs.reduce((acc, r) => acc + (Number(r.RepairCost) || 0), 0);
    const grandTotalExpense = totalAssetCost + totalServiceCost + totalRepairCost;

    // Floor breakdown
    const groundFloorUnits = units.filter(u => u.Floor === 'Ground Floor');
    const firstFloorUnits = units.filter(u => u.Floor === 'First Floor');

    return {
      totalUnits,
      activeUnits,
      needsServiceUnits,
      underRepairUnits,
      decommissionedUnits,
      totalAssetCost,
      totalServiceCost,
      totalRepairCost,
      grandTotalExpense,
      totalReplacements: allReplacements.length,
      groundFloor: {
        total: groundFloorUnits.length,
        active: groundFloorUnits.filter(u => u.Status === 'Active').length,
        needsService: groundFloorUnits.filter(u => u.Status === 'Needs Service').length,
        underRepair: groundFloorUnits.filter(u => u.Status === 'Under Repair').length,
        assetCost: groundFloorUnits.reduce((acc, u) => acc + (Number(u.PurchasePrice) || 0), 0),
        serviceCost: groundFloorUnits.reduce((acc, u) => acc + u.lifetimeServiceCost, 0),
        repairCost: groundFloorUnits.reduce((acc, u) => acc + u.lifetimeRepairCost, 0)
      },
      firstFloor: {
        total: firstFloorUnits.length,
        active: firstFloorUnits.filter(u => u.Status === 'Active').length,
        needsService: firstFloorUnits.filter(u => u.Status === 'Needs Service').length,
        underRepair: firstFloorUnits.filter(u => u.Status === 'Under Repair').length,
        assetCost: firstFloorUnits.reduce((acc, u) => acc + (Number(u.PurchasePrice) || 0), 0),
        serviceCost: firstFloorUnits.reduce((acc, u) => acc + u.lifetimeServiceCost, 0),
        repairCost: firstFloorUnits.reduce((acc, u) => acc + u.lifetimeRepairCost, 0)
      }
    };
  },

  async logService(serviceData) {
    const existingServices = dbRepository.getTable('ACServices') || [];
    const nextNum = existingServices.length + 1;
    const serviceId = `ACS-${String(nextNum).padStart(4, '0')}`;

    let filePath = '';
    let fileName = '';
    let fileSize = '';

    if (serviceData.billFile) {
      fileName = serviceData.billFile.name;
      fileSize = `${Math.round(serviceData.billFile.size / 1024)} KB`;
      try {
        const base64Data = await this.readFileAsBase64(serviceData.billFile);
        const res = await fetch('/api/excel-database/upload-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `${serviceData.InvoiceNo || serviceId}_${fileName}`,
            fileData: base64Data
          })
        });
        if (res.ok) {
          const json = await res.json();
          filePath = json.filePath || `/invoices/${fileName}`;
        } else {
          filePath = `/invoices/${fileName}`;
        }
      } catch {
        filePath = `/invoices/${fileName}`;
      }
    }

    const newService = {
      ServiceID: serviceId,
      UnitID: serviceData.UnitID,
      ServiceDate: serviceData.ServiceDate || new Date().toISOString().split('T')[0],
      ServiceType: serviceData.ServiceType || 'Routine Maintenance',
      Cost: Number(serviceData.Cost) || 0,
      Technician: serviceData.Technician || 'External Service Contractor',
      InvoiceNo: serviceData.InvoiceNo || '',
      GasRefillPSI: serviceData.GasRefillPSI || 'Normal',
      FilterCleaned: Boolean(serviceData.FilterCleaned),
      CoilCleaned: Boolean(serviceData.CoilCleaned),
      NextServiceDue: serviceData.NextServiceDue || '',
      Notes: serviceData.Notes || '',
      FilePath: filePath,
      FileName: fileName,
      FileSize: fileSize
    };

    // Update the unit's LastServiceDate and NextServiceDue, and if 'Needs Service', reset to 'Active'
    const units = dbRepository.getTable('ACUnits') || [];
    const updatedUnits = units.map(u => {
      if (u.UnitID === serviceData.UnitID) {
        return {
          ...u,
          LastServiceDate: newService.ServiceDate,
          NextServiceDue: newService.NextServiceDue || u.NextServiceDue,
          Status: u.Status === 'Needs Service' ? 'Active' : u.Status
        };
      }
      return u;
    });

    // Mirror to Invoices table for unified expense vault
    if (newService.Cost > 0) {
      const invoices = dbRepository.getTable('Invoices') || [];
      const newInvoice = {
        InvoiceID: serviceId,
        InvoiceNumber: newService.InvoiceNo || serviceId,
        InvoiceDate: newService.ServiceDate,
        Supplier: newService.Technician,
        Amount: newService.Cost,
        AssetID: newService.UnitID,
        UserID: '',
        PrinterAssetID: '',
        ExpenseID: serviceId,
        FileName: fileName,
        FilePath: filePath,
        FileSize: fileSize,
        UploadDate: newService.ServiceDate,
        Description: `[AC Service - ${newService.UnitID}] ${newService.ServiceType}: ${newService.Notes}`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    await dbRepository.updateTable('ACUnits', updatedUnits);
    await dbRepository.updateTable('ACServices', [newService, ...existingServices]);

    return newService;
  },

  async logRepair(repairData) {
    const existingRepairs = dbRepository.getTable('ACRepairs') || [];
    const nextNum = existingRepairs.length + 1;
    const repairId = `ACR-${String(nextNum).padStart(4, '0')}`;

    let filePath = '';
    let fileName = '';
    let fileSize = '';

    if (repairData.billFile) {
      fileName = repairData.billFile.name;
      fileSize = `${Math.round(repairData.billFile.size / 1024)} KB`;
      try {
        const base64Data = await this.readFileAsBase64(repairData.billFile);
        const res = await fetch('/api/excel-database/upload-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `${repairData.InvoiceNo || repairId}_${fileName}`,
            fileData: base64Data
          })
        });
        if (res.ok) {
          const json = await res.json();
          filePath = json.filePath || `/invoices/${fileName}`;
        } else {
          filePath = `/invoices/${fileName}`;
        }
      } catch {
        filePath = `/invoices/${fileName}`;
      }
    }

    const newRepair = {
      RepairID: repairId,
      UnitID: repairData.UnitID,
      IssueDate: repairData.IssueDate || new Date().toISOString().split('T')[0],
      ResolvedDate: repairData.ResolvedDate || '',
      IssueDescription: repairData.IssueDescription || '',
      PartsReplaced: repairData.PartsReplaced || '',
      RepairCost: Number(repairData.RepairCost) || 0,
      Technician: repairData.Technician || '',
      Status: repairData.Status || 'In Progress', // 'In Progress', 'Completed'
      InvoiceNo: repairData.InvoiceNo || '',
      Notes: repairData.Notes || '',
      FilePath: filePath,
      FileName: fileName,
      FileSize: fileSize
    };

    // Update unit status based on repair status
    const units = dbRepository.getTable('ACUnits') || [];
    const updatedUnits = units.map(u => {
      if (u.UnitID === repairData.UnitID) {
        let newStatus = u.Status;
        if (newRepair.Status === 'In Progress') {
          newStatus = 'Under Repair';
        } else if (newRepair.Status === 'Completed' && u.Status === 'Under Repair') {
          newStatus = 'Active';
        }
        return {
          ...u,
          Status: newStatus
        };
      }
      return u;
    });

    // Mirror to Invoices table if cost > 0
    if (newRepair.RepairCost > 0) {
      const invoices = dbRepository.getTable('Invoices') || [];
      const newInvoice = {
        InvoiceID: repairId,
        InvoiceNumber: newRepair.InvoiceNo || repairId,
        InvoiceDate: newRepair.IssueDate,
        Supplier: newRepair.Technician,
        Amount: newRepair.RepairCost,
        AssetID: newRepair.UnitID,
        UserID: '',
        PrinterAssetID: '',
        ExpenseID: repairId,
        FileName: fileName,
        FilePath: filePath,
        FileSize: fileSize,
        UploadDate: newRepair.IssueDate,
        Description: `[AC Repair - ${newRepair.UnitID}] ${newRepair.IssueDescription}`
      };
      await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    }

    await dbRepository.updateTable('ACUnits', updatedUnits);
    await dbRepository.updateTable('ACRepairs', [newRepair, ...existingRepairs]);

    return newRepair;
  },

  async replaceUnit(data) {
    // data contains: oldUnitId, newUnitData: { Brand, Model, CapacityBTU, RefrigerantType, PurchasePrice, PurchaseDate, Supplier, WarrantyUntil, Notes }, reason, finalCondition
    const oldUnit = this.getACUnitById(data.oldUnitId);
    if (!oldUnit) throw new Error('Existing AC unit not found for replacement');

    const existingReplacements = dbRepository.getTable('ACReplacements') || [];
    const repNum = existingReplacements.length + 1;
    const replacementId = `ACREP-${String(repNum).padStart(4, '0')}`;

    const existingUnits = dbRepository.getTable('ACUnits') || [];
    const nextUnitNum = existingUnits.length + 1;
    const newUnitId = `AC-${String(nextUnitNum).padStart(4, '0')}`;

    // Create the new active unit installed in this spot
    const newUnit = {
      UnitID: newUnitId,
      UnitNumber: oldUnit.UnitNumber, // inherits spot number
      UnitCode: oldUnit.UnitCode,     // inherits code, e.g. '1F-AC-12'
      Floor: oldUnit.Floor,
      RoomName: oldUnit.RoomName,
      WallPosition: oldUnit.WallPosition,
      Brand: data.newUnitData.Brand || 'Panasonic',
      Model: data.newUnitData.Model || '',
      CapacityBTU: data.newUnitData.CapacityBTU || oldUnit.CapacityBTU,
      RefrigerantType: data.newUnitData.RefrigerantType || 'R32',
      PowerRating: data.newUnitData.PowerRating || '1.5 kW',
      PurchaseDate: data.newUnitData.PurchaseDate || new Date().toISOString().split('T')[0],
      PurchasePrice: Number(data.newUnitData.PurchasePrice) || 0,
      Supplier: data.newUnitData.Supplier || '',
      WarrantyUntil: data.newUnitData.WarrantyUntil || '',
      Status: 'Active',
      WorkMode: 'Normal Cooling',
      TargetTemp: 22,
      CoordX: oldUnit.CoordX,
      CoordY: oldUnit.CoordY,
      LastServiceDate: data.newUnitData.PurchaseDate || new Date().toISOString().split('T')[0],
      NextServiceDue: '',
      Notes: `Installed as replacement for old ${oldUnit.Brand} ${oldUnit.Model} on ${data.RemovalDate || new Date().toISOString().split('T')[0]}. ${data.newUnitData.Notes || ''}`
    };

    // Replacement record documenting old machine's lifetime costs and decommissioning reason
    const replacementLog = {
      ReplacementID: replacementId,
      SpotCode: oldUnit.UnitCode,
      RoomName: oldUnit.RoomName,
      Floor: oldUnit.Floor,
      OldUnitBrand: oldUnit.Brand,
      OldUnitModel: oldUnit.Model,
      OldUnitPurchaseYear: oldUnit.PurchaseDate ? oldUnit.PurchaseDate.split('-')[0] : '',
      OldUnitLifetimeServiceCost: oldUnit.lifetimeServiceCost,
      OldUnitLifetimeRepairCost: oldUnit.lifetimeRepairCost,
      RemovalDate: data.RemovalDate || new Date().toISOString().split('T')[0],
      RemovalReason: data.RemovalReason || 'Decommissioned / Upgraded',
      FinalCondition: data.FinalCondition || 'Scrapped / Salvaged',
      NewUnitID: newUnitId,
      Notes: data.Notes || `Replaced with brand new ${newUnit.Brand} ${newUnit.Model}`
    };

    // Update old unit to Decommissioned and modify its spot code so new unit takes the active spot
    const updatedUnits = existingUnits.map(u => {
      if (u.UnitID === oldUnit.UnitID) {
        return {
          ...u,
          Status: 'Decommissioned',
          UnitCode: `${u.UnitCode}-OLD`,
          Notes: `[DECOMMISSIONED on ${replacementLog.RemovalDate}] Reason: ${replacementLog.RemovalReason}. Replaced by ${newUnitId}. ${u.Notes || ''}`
        };
      }
      return u;
    });

    // Add new unit to table
    updatedUnits.push(newUnit);

    // Save replacement history & units
    await dbRepository.updateTable('ACReplacements', [replacementLog, ...existingReplacements]);
    await dbRepository.updateTable('ACUnits', updatedUnits);

    return { replacementLog, newUnit };
  },

  async addACUnit(unitData) {
    const existingUnits = dbRepository.getTable('ACUnits') || [];
    const nextNum = existingUnits.length + 1;
    const unitId = `AC-${String(nextNum).padStart(4, '0')}`;
    const unitNumber = String(unitData.UnitNumber || nextNum).padStart(2, '0');

    const newUnit = {
      UnitID: unitId,
      UnitNumber: unitNumber,
      UnitCode: unitData.UnitCode || `${unitData.Floor === 'Ground Floor' ? 'GF' : '1F'}-AC-${unitNumber}`,
      Floor: unitData.Floor || 'Ground Floor',
      RoomName: unitData.RoomName || 'General Office Space',
      WallPosition: unitData.WallPosition || 'North Wall',
      Brand: unitData.Brand || 'Panasonic',
      Model: unitData.Model || '',
      CapacityBTU: unitData.CapacityBTU || '18,000 BTU',
      RefrigerantType: unitData.RefrigerantType || 'R32',
      PowerRating: unitData.PowerRating || '1.5 kW',
      PurchaseDate: unitData.PurchaseDate || new Date().toISOString().split('T')[0],
      PurchasePrice: Number(unitData.PurchasePrice) || 0,
      Supplier: unitData.Supplier || '',
      WarrantyUntil: unitData.WarrantyUntil || '',
      Status: unitData.Status || 'Active',
      WorkMode: unitData.WorkMode || 'Normal Cooling',
      TargetTemp: Number(unitData.TargetTemp) || 22,
      CoordX: Number(unitData.CoordX) || 200,
      CoordY: Number(unitData.CoordY) || 200,
      LastServiceDate: unitData.LastServiceDate || '',
      NextServiceDue: unitData.NextServiceDue || '',
      Notes: unitData.Notes || ''
    };

    await dbRepository.updateTable('ACUnits', [...existingUnits, newUnit]);
    return newUnit;
  },

  async updateACUnit(unitId, fields) {
    const existingUnits = dbRepository.getTable('ACUnits') || [];
    const updated = existingUnits.map(u => {
      if (u.UnitID === unitId) {
        return {
          ...u,
          ...fields,
          PurchasePrice: fields.PurchasePrice !== undefined ? Number(fields.PurchasePrice) : u.PurchasePrice,
          TargetTemp: fields.TargetTemp !== undefined ? Number(fields.TargetTemp) : u.TargetTemp
        };
      }
      return u;
    });

    await dbRepository.updateTable('ACUnits', updated);
  },

  async deleteACUnit(unitId) {
    const existingUnits = dbRepository.getTable('ACUnits') || [];
    const filtered = existingUnits.filter(u => u.UnitID !== unitId);
    await dbRepository.updateTable('ACUnits', filtered);
  },

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
