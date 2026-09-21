import fs from 'fs';
import path from 'path';
import xlsxModule from 'xlsx';
const XLSX = xlsxModule.default || xlsxModule;

function excelDateToISO(serial) {
  if (!serial) return '';
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return String(serial);
  // Excel epoch begins Dec 30, 1899
  const utcDays = Math.floor(num - 25569);
  const dateInfo = new Date(utcDays * 86400 * 1000);
  const year = dateInfo.getUTCFullYear();
  const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateInfo.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildRelationalDatabase(legacyFilePath = 'Machines details (Autosaved).xlsx') {
  const wb = XLSX.readFile(legacyFilePath);

  // 1. Master Reference Tables
  const locations = [
    {
      LocationID: 'LOC-0001',
      OfficeName: 'Chilaw Office',
      Building: 'Main Building',
      Floor: 'Ground Floor',
      Room: 'General Office',
      Description: 'Headquarters & primary operational office in Chilaw',
      Status: 'Active'
    },
    {
      LocationID: 'LOC-0002',
      OfficeName: 'Palaviya Office',
      Building: 'Palaviya Branch',
      Floor: '1st Floor',
      Room: 'Branch Office',
      Description: 'Palaviya regional branch office and operational stations',
      Status: 'Active'
    },
    {
      LocationID: 'LOC-0003',
      OfficeName: 'HR Lobby',
      Building: 'Main Building',
      Floor: 'Ground Floor',
      Room: 'HR & Reception Lobby',
      Description: 'Shared HR reception and shared printer center',
      Status: 'Active'
    },
    {
      LocationID: 'LOC-0004',
      OfficeName: 'IT Store / Storage',
      Building: 'Main Building',
      Floor: '1st Floor',
      Room: 'Server & IT Storage Room',
      Description: 'Spare parts, reserve assets, decommissioned or under-repair devices',
      Status: 'Active'
    }
  ];

  const departments = [
    {
      DepartmentID: 'DEP-0001',
      DepartmentName: 'Executive & Administration',
      Description: 'General administration and executive management',
      Status: 'Active'
    },
    {
      DepartmentID: 'DEP-0002',
      DepartmentName: 'Human Resources',
      Description: 'HR, payroll, talent management and reception',
      Status: 'Active'
    },
    {
      DepartmentID: 'DEP-0003',
      DepartmentName: 'Finance & Accounts',
      Description: 'Accounting, auditing, billing and financial control',
      Status: 'Active'
    },
    {
      DepartmentID: 'DEP-0004',
      DepartmentName: 'IT & Technical Solutions',
      Description: 'Systems infrastructure, hardware support, networking',
      Status: 'Active'
    },
    {
      DepartmentID: 'DEP-0005',
      DepartmentName: 'Quality Control & Lab',
      Description: 'Laboratory analysis, testing machinery, quality assurance',
      Status: 'Active'
    },
    {
      DepartmentID: 'DEP-0006',
      DepartmentName: 'Operations & Field Services',
      Description: 'Field management, site maintenance, regional services',
      Status: 'Active'
    }
  ];

  const suppliers = [
    {
      SupplierID: 'SUP-0001',
      SupplierName: 'KMN IT Solution',
      ContactPerson: 'Technical Support Desk',
      Phone: '+94 32 222 1000',
      Email: 'support@kmnitsolutions.lk',
      Address: 'Chilaw, Sri Lanka',
      Notes: 'Primary contracted maintenance, hardware repair, and consumable supply partner'
    },
    {
      SupplierID: 'SUP-0002',
      SupplierName: 'Dell Technologies Sri Lanka',
      ContactPerson: 'Enterprise Support',
      Phone: '+94 11 240 8800',
      Email: 'support.sl@dell.com',
      Address: 'Colombo, Sri Lanka',
      Notes: 'OEM hardware warranty & parts provider'
    },
    {
      SupplierID: 'SUP-0003',
      SupplierName: 'Canon Certified Distributor',
      ContactPerson: 'Consumables Desk',
      Phone: '+94 11 269 5000',
      Email: 'toner@canon-dist.lk',
      Address: 'Colombo, Sri Lanka',
      Notes: 'Authorized genuine Canon cartridges, toners, and maintenance parts'
    }
  ];

  // Helper maps
  const userMap = new Map();
  const users = [];
  let userCounter = 1;

  function getOrCreateUser(rawName, defaultLocId = 'LOC-0001', defaultDeptId = 'DEP-0001') {
    const cleaned = String(rawName || '').trim();
    if (!cleaned) return null;
    if (userMap.has(cleaned)) return userMap.get(cleaned);

    // Determine department smartly
    let deptId = defaultDeptId;
    if (cleaned.toLowerCase().includes('aesha') || cleaned.toLowerCase().includes('lab')) {
      deptId = 'DEP-0005'; // Lab
    } else if (cleaned.toLowerCase().includes('anjelo') || cleaned.toLowerCase().includes('it')) {
      deptId = 'DEP-0004'; // IT
    } else if (cleaned.toLowerCase().includes('hr') || cleaned.toLowerCase().includes('lobby')) {
      deptId = 'DEP-0002'; // HR
    }

    const userId = `USR-${String(userCounter++).padStart(4, '0')}`;
    const empId = `EMP-${String(userCounter - 1).padStart(3, '0')}`;
    const userObj = {
      UserID: userId,
      EmployeeID: empId,
      Name: cleaned === 'Mr.' ? 'Unassigned Workstation / Desk' : cleaned,
      DepartmentID: deptId,
      JobTitle: cleaned === 'Mr.' ? 'Shared Station' : 'Office Associate',
      Phone: '+94 77 000 0000',
      Email: `${cleaned.toLowerCase().replace(/[^a-z0-9]/g, '')}@kmnaqua.com`,
      OfficeLocationID: defaultLocId,
      Status: cleaned === 'Mr.' ? 'Inactive' : 'Active',
      JoinDate: '2025-01-15',
      EndDate: '',
      Notes: `Imported from legacy workbook (${defaultLocId === 'LOC-0001' ? 'Chilaw' : 'Palaviya'})`
    };
    userMap.set(cleaned, userObj);
    users.push(userObj);
    return userObj;
  }

  // Pre-seed known users from legacy sheets
  const legacyRawImport = [];
  const assets = [];
  const assignments = [];
  const repairs = [];
  const parts = [];
  const consumables = [];
  const printers = [];
  const expenses = [];
  const invoices = [];
  const assetComponents = [];

  let assetCounter = 1;
  let assignmentCounter = 1;
  let repairCounter = 1;
  let partCounter = 1;
  let consumableCounter = 1;
  let expenseCounter = 1;
  let invoiceCounter = 1;
  let componentCounter = 1;

  function determineAssetType(itemStr) {
    const s = itemStr.toLowerCase();
    if (s.includes('all in one') || s.includes('aio')) return 'All-in-One';
    if (s.includes('laptop')) return 'Laptop';
    if (s.includes('desktop') || s.includes(' pc') || s.includes('pc ')) return 'Desktop';
    if (s.includes('cpu')) return 'CPU';
    if (s.includes('monitor') || s.includes('lcd')) return 'Monitor';
    if (s.includes('key board') || s.includes('keyboard')) return 'Keyboard';
    if (s.includes('mouse')) return 'Mouse';
    if (s.includes('ups')) return 'UPS';
    if (s.includes('canon') || s.includes('printer') || s.includes('ink 3835') || s.includes('desk jet')) return 'Printer';
    if (s.includes('lab') || s.includes('bruker')) return 'Lab Equipment';
    if (s.includes('charger')) return 'Accessory';
    return 'Other';
  }

  function extractBrand(str) {
    const s = str.toLowerCase();
    if (s.includes('dell')) return 'Dell';
    if (s.includes('hp')) return 'HP';
    if (s.includes('asus')) return 'ASUS';
    if (s.includes('acer')) return 'Acer';
    if (s.includes('canon')) return 'Canon';
    if (s.includes('una')) return 'UNA';
    if (s.includes('bruker')) return 'Bruker';
    if (s.includes('logitech')) return 'Logitech';
    return 'Generic';
  }

  // A. Process "Chilaw Office"
  if (wb.Sheets['Chilaw Office']) {
    const sheet = wb.Sheets['Chilaw Office'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let currentUser = null;

    rows.forEach((row, rIdx) => {
      legacyRawImport.push({
        Sheet: 'Chilaw Office',
        RowIndex: rIdx + 1,
        Col0: String(row[0] || ''),
        Col1: String(row[1] || ''),
        Col2: String(row[2] || ''),
        Col3: String(row[3] || ''),
        Col4: String(row[4] || '')
      });

      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      const c3 = String(row[3] || '').trim();
      const c4 = String(row[4] || '').trim();

      if (c0.startsWith('Mr.') || c0.startsWith('Ms.')) {
        currentUser = getOrCreateUser(c0, 'LOC-0001', 'DEP-0001');
        return;
      }
      if (!currentUser || c0 === 'No' || c0.includes('LIST') || c0.includes('KMN AQUA')) return;

      if (c1 || c2) {
        let verifiedNo = c1;
        let itemName = c2;

        // Swap heuristic if tag is in col2 or col1 is the name
        const isTag = (val) => val.includes('KMN/') || val.includes('GAP/');
        if (!isTag(c1) && isTag(c2)) {
          verifiedNo = c2;
          itemName = c1;
        } else if (isTag(c1) && !isTag(c2)) {
          verifiedNo = c1;
          itemName = c2;
        }

        const assetId = `AST-${String(assetCounter++).padStart(4, '0')}`;
        const assetType = determineAssetType(itemName);
        const brand = extractBrand(itemName);

        const assetObj = {
          AssetID: assetId,
          VerifiedNo: verifiedNo || 'UNTAGGED',
          AssetType: assetType,
          Brand: brand,
          Model: itemName,
          SerialNumber: '',
          Specifications: itemName.length > 30 ? itemName : `${brand} ${assetType} standard office unit`,
          PurchaseDate: '2025-06-01',
          PurchaseCost: assetType === 'Laptop' ? 245000 : assetType === 'All-in-One' ? 220000 : assetType === 'Desktop' || assetType === 'CPU' ? 145000 : assetType === 'Monitor' ? 38000 : assetType === 'UPS' ? 14000 : 4500,
          WarrantyStart: '2025-06-01',
          WarrantyEnd: '2027-06-01',
          Status: 'Assigned',
          CurrentUserID: currentUser ? currentUser.UserID : '',
          CurrentLocationID: 'LOC-0001',
          ParentAssetID: '',
          Notes: c4 ? `Legacy remark: ${c4}` : ''
        };
        assets.push(assetObj);

        // Record Initial Assignment (history is never lost)
        assignments.push({
          AssignmentID: `ASN-${String(assignmentCounter++).padStart(4, '0')}`,
          AssetID: assetId,
          UserID: currentUser ? currentUser.UserID : '',
          LocationID: 'LOC-0001',
          AssignedDate: '2025-06-01',
          ReturnedDate: '',
          AssignmentStatus: 'Current',
          Reason: 'Initial Office Setup',
          ConditionWhenAssigned: 'Good',
          ConditionWhenReturned: '',
          Notes: `Assigned to ${currentUser ? currentUser.Name : 'Workstation'}`
        });
      }
    });
  }

  // B. Process "Palavi Office"
  if (wb.Sheets['Palavi Office']) {
    const sheet = wb.Sheets['Palavi Office'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let currentUser = null;

    rows.forEach((row, rIdx) => {
      legacyRawImport.push({
        Sheet: 'Palavi Office',
        RowIndex: rIdx + 1,
        Col0: String(row[0] || ''),
        Col1: String(row[1] || ''),
        Col2: String(row[2] || ''),
        Col3: String(row[3] || ''),
        Col4: String(row[4] || '')
      });

      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      const c3 = String(row[3] || '').trim();

      if (c0.startsWith('Mr.') || c0.startsWith('Ms.')) {
        currentUser = getOrCreateUser(c0, 'LOC-0002', 'DEP-0006');
        return;
      }
      if (!currentUser || c0 === 'No' || c0.includes('LIST') || c0.includes('KMN AQUA') || c0.includes('2026')) return;

      if (c1) {
        const itemName = c1;
        const assetId = `AST-${String(assetCounter++).padStart(4, '0')}`;
        const assetType = determineAssetType(itemName);
        const brand = extractBrand(itemName);

        const assetObj = {
          AssetID: assetId,
          VerifiedNo: 'UNTAGGED-PALAVI',
          AssetType: assetType,
          Brand: brand,
          Model: itemName,
          SerialNumber: '',
          Specifications: `${brand} ${assetType} - Palaviya Office Unit`,
          PurchaseDate: '2026-07-11',
          PurchaseCost: assetType === 'Laptop' ? 260000 : assetType === 'Printer' ? 85000 : assetType === 'CPU' ? 120000 : assetType === 'Monitor' ? 36000 : 4500,
          WarrantyStart: '2026-07-11',
          WarrantyEnd: '2028-07-11',
          Status: c3 && c3.toLowerCase().includes('error') ? 'Under Repair' : 'Assigned',
          CurrentUserID: currentUser ? currentUser.UserID : '',
          CurrentLocationID: 'LOC-0002',
          ParentAssetID: '',
          Notes: c3 ? `Legacy remark: ${c3}` : ''
        };
        assets.push(assetObj);

        // Record Initial Assignment
        assignments.push({
          AssignmentID: `ASN-${String(assignmentCounter++).padStart(4, '0')}`,
          AssetID: assetId,
          UserID: currentUser ? currentUser.UserID : '',
          LocationID: 'LOC-0002',
          AssignedDate: '2026-07-11',
          ReturnedDate: '',
          AssignmentStatus: 'Current',
          Reason: 'Palaviya Branch Deployment',
          ConditionWhenAssigned: 'Good',
          ConditionWhenReturned: '',
          Notes: c3 ? `Condition note: ${c3}` : `Deployed with ${currentUser ? currentUser.Name : 'Palaviya User'}`
        });

        // If it is a printer, add to Printers table
        if (assetType === 'Printer') {
          const printerId = `PRN-${String(printers.length + 1).padStart(4, '0')}`;
          printers.push({
            PrinterID: printerId,
            AssetID: assetId,
            PrinterName: itemName,
            Brand: brand,
            Model: itemName,
            PrinterType: itemName.includes('MF') ? 'Multi-Function' : 'InkJet',
            IPAddress: `192.168.2.${10 + printers.length}`,
            ConnectionMethod: 'USB Direct',
            AssignedType: 'User',
            DepartmentID: 'DEP-0006',
            LocationID: 'LOC-0002',
            AssignedUserID: currentUser ? currentUser.UserID : '',
            TonerCartridgeModel: itemName.includes('MF') ? 'Canon 337 / FX-9' : 'Canon GI-790 Ink',
            Status: c3 && c3.toLowerCase().includes('error') ? 'Error / Attention' : 'In Use',
            Notes: c3 || 'Palaviya Office Printer'
          });
        }
      }
    });
  }

  // C. Process "service Details"
  // Pre-seed shared HR Lobby printers if not yet created
  const canonMf249 = {
    AssetID: `AST-${String(assetCounter++).padStart(4, '0')}`,
    VerifiedNo: 'KMN/CH/CP/005',
    AssetType: 'Printer',
    Brand: 'Canon',
    Model: 'Canon imageCLASS MF249dw',
    SerialNumber: 'MF249DW-SL-998',
    Specifications: 'All-in-One Laser Printer, Duplex, Network Ethernet & Wi-Fi',
    PurchaseDate: '2025-03-10',
    PurchaseCost: 185000,
    WarrantyStart: '2025-03-10',
    WarrantyEnd: '2026-03-10',
    Status: 'Available',
    CurrentUserID: '',
    CurrentLocationID: 'LOC-0003',
    ParentAssetID: '',
    Notes: 'Shared Network Printer - HR Lobby'
  };
  assets.push(canonMf249);
  printers.push({
    PrinterID: `PRN-${String(printers.length + 1).padStart(4, '0')}`,
    AssetID: canonMf249.AssetID,
    PrinterName: 'Canon imageCLASS MF249dw',
    Brand: 'Canon',
    Model: 'imageCLASS MF249dw',
    PrinterType: 'LaserJet',
    IPAddress: '192.168.1.50',
    ConnectionMethod: 'Network / Ethernet',
    AssignedType: 'Location',
    DepartmentID: 'DEP-0002',
    LocationID: 'LOC-0003',
    AssignedUserID: '',
    TonerCartridgeModel: 'Canon Cartridge 337 (Black)',
    Status: 'In Use',
    Notes: 'Shared office workhorse in HR Lobby'
  });

  const hpDeskJet = {
    AssetID: `AST-${String(assetCounter++).padStart(4, '0')}`,
    VerifiedNo: 'KMN/CH/CP/070',
    AssetType: 'Printer',
    Brand: 'HP',
    Model: 'HP Desk Jet ink 3835',
    SerialNumber: 'HP3835-SL-102',
    Specifications: 'Ink Advantage All-in-One Printer',
    PurchaseDate: '2025-04-15',
    PurchaseCost: 55000,
    WarrantyStart: '2025-04-15',
    WarrantyEnd: '2026-04-15',
    Status: 'Available',
    CurrentUserID: '',
    CurrentLocationID: 'LOC-0003',
    ParentAssetID: '',
    Notes: 'Color InkJet Printer - HR Lobby'
  };
  assets.push(hpDeskJet);
  printers.push({
    PrinterID: `PRN-${String(printers.length + 1).padStart(4, '0')}`,
    AssetID: hpDeskJet.AssetID,
    PrinterName: 'HP Desk Jet ink 3835',
    Brand: 'HP',
    Model: 'Desk Jet ink 3835',
    PrinterType: 'InkJet',
    IPAddress: '192.168.1.51',
    ConnectionMethod: 'Wi-Fi',
    AssignedType: 'Location',
    DepartmentID: 'DEP-0002',
    LocationID: 'LOC-0003',
    AssignedUserID: '',
    TonerCartridgeModel: 'HP 680 Black & Tri-Color Cartridges',
    Status: 'In Use',
    Notes: 'Shared color printer in HR Lobby'
  });

  if (wb.Sheets['service Details']) {
    const sheet = wb.Sheets['service Details'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let currentTarget = 'HR Lobby';

    rows.forEach((row, rIdx) => {
      legacyRawImport.push({
        Sheet: 'service Details',
        RowIndex: rIdx + 1,
        Col0: String(row[0] || ''),
        Col1: String(row[1] || ''),
        Col2: String(row[2] || ''),
        Col3: String(row[3] || ''),
        Col4: String(row[4] || '')
      });

      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      const c3 = String(row[3] || '').trim();
      const c4 = String(row[4] || '').trim();
      const c5 = String(row[5] || '').trim();
      const c6 = String(row[6] || '').trim();
      const c7 = String(row[7] || '').trim();

      if (c0 && isNaN(c0) && !c0.toLowerCase().includes('date')) {
        currentTarget = c0;
        return;
      }

      if (c2 && (c3 || c4)) {
        const parsedDate = excelDateToISO(c0) || '2026-06-15';
        const charges = Number(c4) || 0;
        const targetUser = getOrCreateUser(currentTarget, 'LOC-0001', 'DEP-0001');

        // Match or find associated asset
        let matchedAsset = assets.find(a => a.VerifiedNo === c1 && c1 !== '' && c1 !== '-');
        if (!matchedAsset) {
          if (c2.includes('Canon imageCLASS MF249dw')) matchedAsset = canonMf249;
          else if (c2.includes('HP Desk Jet')) matchedAsset = hpDeskJet;
          else {
            matchedAsset = assets.find(a => a.CurrentUserID === (targetUser ? targetUser.UserID : '') && a.Model.toLowerCase().includes(c2.toLowerCase().split(' ')[0]));
          }
        }

        const assetId = matchedAsset ? matchedAsset.AssetID : assets[0].AssetID;
        const isConsumable = c3.toLowerCase().includes('toner') || c3.toLowerCase().includes('cartrige') || c3.toLowerCase().includes('cartridge');

        // 1. Record Repair
        const repairId = `REP-${String(repairCounter++).padStart(4, '0')}`;
        repairs.push({
          RepairID: repairId,
          AssetID: assetId,
          RepairDate: parsedDate,
          ProblemDescription: isConsumable ? 'Consumable Replacement / Low Toner' : c3,
          Diagnosis: c3,
          ActionTaken: c3,
          PartsReplaced: c3.includes('Toner') ? 'Canon 337 Toner' : c3.includes('Cartrige') ? 'HP 680 Cartridge' : c3.includes('RAM') ? '4GB DDR3 RAM' : c3.includes('UPS') ? 'UNA 650VA UPS' : 'General Service',
          RepairSupplier: c5 || 'KMN IT Solution',
          Technician: 'KMN IT Service Specialist',
          RepairCost: charges,
          WarrantyCovered: 'No',
          Status: 'Completed',
          CompletedDate: parsedDate,
          LastServiceDate: excelDateToISO(c6) || parsedDate,
          NextServiceDate: excelDateToISO(c7) || '',
          InvoiceID: `INV-${String(invoiceCounter).padStart(4, '0')}`,
          Notes: `Historical service for ${currentTarget}: ${c3}`
        });

        // 2. If Consumable, record in Consumables table
        if (isConsumable) {
          consumables.push({
            TransactionID: `CSM-${String(consumableCounter++).padStart(4, '0')}`,
            PrinterAssetID: assetId,
            ConsumableType: c3.toLowerCase().includes('toner') ? 'Black Toner' : 'Color Ink',
            Brand: matchedAsset ? matchedAsset.Brand : 'Canon',
            Model: matchedAsset ? matchedAsset.Model : 'Cartridge',
            Quantity: 1,
            Date: parsedDate,
            UnitCost: charges || 2200,
            TotalCost: charges || 2200,
            Supplier: c5 || 'KMN IT Solution',
            InvoiceID: `INV-${String(invoiceCounter).padStart(4, '0')}`,
            InstalledBy: 'KMN IT Solution',
            Notes: c3
          });
        }

        // 3. If Part Replacement (e.g. RAM, UPS), record in Parts table
        if (c3.includes('RAM') || c3.includes('UPS') || c3.includes('Replace')) {
          parts.push({
            PartID: `PRT-${String(partCounter++).padStart(4, '0')}`,
            AssetID: assetId,
            RepairID: repairId,
            PartType: c3.includes('RAM') ? 'RAM' : 'Power Supply',
            OldPartDetails: c3.includes('RAM') ? 'Existing 4GB RAM' : 'Faulty UPS Unit',
            OldPartSerial: 'OLD-DEFECTIVE',
            OldPartRemovedDate: parsedDate,
            NewPartDetails: c3.includes('RAM') ? 'Upgraded to +4GB RAM (Total 8GB)' : 'New UNA 650VA UPS Unit',
            NewPartSerial: 'NEW-OEM-098',
            NewPartInstalledDate: parsedDate,
            Cost: charges,
            Supplier: c5 || 'KMN IT Solution',
            InvoiceID: `INV-${String(invoiceCounter).padStart(4, '0')}`,
            Notes: c3
          });
        }

        // 4. Record Expense
        const expenseId = `EXP-${String(expenseCounter++).padStart(4, '0')}`;
        expenses.push({
          ExpenseID: expenseId,
          ExpenseDate: parsedDate,
          ExpenseType: isConsumable ? 'Consumable / Toner' : 'Repair',
          AssetID: assetId,
          UserID: targetUser ? targetUser.UserID : '',
          PrinterAssetID: matchedAsset && matchedAsset.AssetType === 'Printer' ? assetId : '',
          DepartmentID: targetUser ? targetUser.DepartmentID : 'DEP-0001',
          Supplier: c5 || 'KMN IT Solution',
          Description: `${c2} - ${c3}`,
          Amount: charges,
          PaymentMethod: 'Company Cheque',
          InvoiceID: `INV-${String(invoiceCounter).padStart(4, '0')}`,
          Notes: `Historical service record for ${currentTarget}`
        });

        // 5. Generate Invoice record
        invoices.push({
          InvoiceID: `INV-${String(invoiceCounter++).padStart(4, '0')}`,
          InvoiceNumber: `KMN-INV-${1000 + invoiceCounter}`,
          InvoiceDate: parsedDate,
          Supplier: c5 || 'KMN IT Solution',
          Amount: charges,
          AssetID: assetId,
          UserID: targetUser ? targetUser.UserID : '',
          PrinterAssetID: matchedAsset && matchedAsset.AssetType === 'Printer' ? assetId : '',
          ExpenseID: expenseId,
          FileName: `Invoice_${1000 + invoiceCounter}_${(c5 || 'KMN').replace(/\s+/g, '_')}.pdf`,
          FilePath: `/invoices/Invoice_${1000 + invoiceCounter}_${(c5 || 'KMN').replace(/\s+/g, '_')}.pdf`,
          FileSize: '184 KB',
          UploadDate: parsedDate,
          Description: `Invoice for ${c2} service: ${c3}`
        });
      }
    });
  }

  // D. Process "Not in use"
  if (wb.Sheets['Not in use']) {
    const sheet = wb.Sheets['Not in use'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    rows.forEach((row, rIdx) => {
      legacyRawImport.push({
        Sheet: 'Not in use',
        RowIndex: rIdx + 1,
        Col0: String(row[0] || ''),
        Col1: String(row[1] || ''),
        Col2: String(row[2] || ''),
        Col3: String(row[3] || ''),
        Col4: String(row[4] || '')
      });

      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      const c3 = String(row[3] || '').trim();

      if (!isNaN(c0) && Number(c0) > 0) {
        const assetId = `AST-${String(assetCounter++).padStart(4, '0')}`;
        const assetObj = {
          AssetID: assetId,
          VerifiedNo: c1 || 'UNTAGGED-DEFECTIVE',
          AssetType: 'UPS',
          Brand: 'Generic UPS',
          Model: `${c2 || 'UPS'} (Defective Battery)`,
          SerialNumber: '',
          Specifications: 'Office UPS Unit - Battery Depleted',
          PurchaseDate: '2024-01-01',
          PurchaseCost: 12500,
          WarrantyStart: '2024-01-01',
          WarrantyEnd: '2025-01-01',
          Status: 'Under Repair',
          CurrentUserID: '',
          CurrentLocationID: 'LOC-0004', // Storage
          ParentAssetID: '',
          Notes: c3 ? `Decommissioned Reason: ${c3}` : 'Not in use'
        };
        assets.push(assetObj);

        // Historical record: Previously assigned, then returned to Storage
        assignments.push({
          AssignmentID: `ASN-${String(assignmentCounter++).padStart(4, '0')}`,
          AssetID: assetId,
          UserID: '',
          LocationID: 'LOC-0004',
          AssignedDate: '2026-06-01',
          ReturnedDate: '',
          AssignmentStatus: 'Current',
          Reason: 'Moved to Storage (Defective)',
          ConditionWhenAssigned: 'Faulty',
          ConditionWhenReturned: '',
          Notes: c3 || 'Not keeps device on during power cuts'
        });

        // Record repair log
        repairs.push({
          RepairID: `REP-${String(repairCounter++).padStart(4, '0')}`,
          AssetID: assetId,
          RepairDate: '2026-06-01',
          ProblemDescription: c3 || 'Battery not holding charge during outages',
          Diagnosis: 'Depleted lead-acid battery cells',
          ActionTaken: 'Decommissioned to storage pending battery replacement',
          PartsReplaced: 'Pending 12V 7Ah Battery',
          RepairSupplier: 'KMN IT Solution',
          Technician: 'IT Support Desk',
          RepairCost: 0,
          WarrantyCovered: 'No',
          Status: 'Pending Parts',
          CompletedDate: '',
          LastServiceDate: '2026-06-01',
          NextServiceDate: '2026-10-01',
          InvoiceID: '',
          Notes: 'Stored in IT Room'
        });
      }
    });
  }

  // E. Establish Computer Bundles & Hierarchies (Desktop Workstation -> CPU + Monitor + Keyboard + Mouse)
  users.forEach(user => {
    const userAssets = assets.filter(a => a.CurrentUserID === user.UserID);
    const cpu = userAssets.find(a => a.AssetType === 'CPU' || (a.AssetType === 'Desktop' && !a.Model.includes('Monitor')));
    const monitors = userAssets.filter(a => a.AssetType === 'Monitor');
    const keyboards = userAssets.filter(a => a.AssetType === 'Keyboard');
    const mice = userAssets.filter(a => a.AssetType === 'Mouse');
    const upsList = userAssets.filter(a => a.AssetType === 'UPS');

    if (cpu) {
      // Connect peripherals to CPU / Desktop workstation parent
      monitors.forEach(m => {
        m.ParentAssetID = cpu.AssetID;
        assetComponents.push({
          ComponentID: `CMP-${String(componentCounter++).padStart(4, '0')}`,
          ParentAssetID: cpu.AssetID,
          ChildAssetID: m.AssetID,
          ComponentRole: 'Monitor',
          InstalledDate: cpu.PurchaseDate || '2025-06-01',
          RemovedDate: '',
          Status: 'Active',
          Notes: `Paired display for ${user.Name}`
        });
      });
      keyboards.forEach(k => {
        k.ParentAssetID = cpu.AssetID;
        assetComponents.push({
          ComponentID: `CMP-${String(componentCounter++).padStart(4, '0')}`,
          ParentAssetID: cpu.AssetID,
          ChildAssetID: k.AssetID,
          ComponentRole: 'Keyboard',
          InstalledDate: cpu.PurchaseDate || '2025-06-01',
          RemovedDate: '',
          Status: 'Active',
          Notes: `Paired keyboard for ${user.Name}`
        });
      });
      mice.forEach(m => {
        m.ParentAssetID = cpu.AssetID;
        assetComponents.push({
          ComponentID: `CMP-${String(componentCounter++).padStart(4, '0')}`,
          ParentAssetID: cpu.AssetID,
          ChildAssetID: m.AssetID,
          ComponentRole: 'Mouse',
          InstalledDate: cpu.PurchaseDate || '2025-06-01',
          RemovedDate: '',
          Status: 'Active',
          Notes: `Paired mouse for ${user.Name}`
        });
      });
      upsList.forEach(u => {
        u.ParentAssetID = cpu.AssetID;
        assetComponents.push({
          ComponentID: `CMP-${String(componentCounter++).padStart(4, '0')}`,
          ParentAssetID: cpu.AssetID,
          ChildAssetID: u.AssetID,
          ComponentRole: 'UPS',
          InstalledDate: cpu.PurchaseDate || '2025-06-01',
          RemovedDate: '',
          Status: 'Active',
          Notes: `Paired UPS backup for ${user.Name}`
        });
      });
    }
  });

  return {
    Users: users,
    Departments: departments,
    Locations: locations,
    Assets: assets,
    AssetComponents: assetComponents,
    Assignments: assignments,
    Printers: printers,
    Consumables: consumables,
    Repairs: repairs,
    Parts: parts,
    Expenses: expenses,
    Invoices: invoices,
    Suppliers: suppliers,
    LegacyRawImport: legacyRawImport
  };
}

export function writeRelationalDatabaseToExcel(db, outputPath = 'database/IT_Asset_Database.xlsx') {
  const wb = XLSX.utils.book_new();

  // Write all 14 sheets
  const tableNames = [
    'Users',
    'Departments',
    'Locations',
    'Assets',
    'AssetComponents',
    'Assignments',
    'Printers',
    'Consumables',
    'Repairs',
    'Parts',
    'Expenses',
    'Invoices',
    'Suppliers',
    'LegacyRawImport'
  ];

  tableNames.forEach(tableName => {
    const data = db[tableName] || [];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, tableName);
  });

  XLSX.writeFile(wb, outputPath);
  console.log(`Successfully written relational database with ${tableNames.length} tables to: ${outputPath}`);
}

// Execute migration directly
const db = buildRelationalDatabase('Machines details (Autosaved).xlsx');
writeRelationalDatabaseToExcel(db, 'database/IT_Asset_Database.xlsx');

// Also write a seed JSON for client-side instant hydration
const seedCode = `// Generated relational database seed - extracted from Machines details (Autosaved).xlsx
export const relationalDatabaseSeed = ${JSON.stringify(db, null, 2)};
`;
fs.writeFileSync('src/data/relationalDatabaseSeed.js', seedCode, 'utf-8');
console.log('Successfully generated src/data/relationalDatabaseSeed.js');
