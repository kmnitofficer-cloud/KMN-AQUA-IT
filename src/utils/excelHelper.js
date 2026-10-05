import * as XLSX from 'xlsx';

/**
 * Export machine records to an Excel (.xlsx) file
 */
export function exportMachinesToExcel(machines, filename = 'Machines_Inventory.xlsx') {
  const exportData = machines.map((m, idx) => {
    const locId = m.CurrentLocationID || '';
    const locName = m.LocationName || m.office || '';
    const isPalawiya = locId === 'LOC-0002' || locName.toLowerCase().includes('palawi') || locName.toLowerCase().includes('palavi');
    const officeName = isPalawiya ? 'Palawiya Office' : (m.office || m.LocationName || 'Chilaw Office');

    return {
      'No': idx + 1,
      'Verified No': m.verified_no || m.VerifiedNo || 'N/A',
      'Item Name': m.item_name || `${m.Brand || ''} ${m.Model || ''}`.trim() || '',
      'Category': m.category || m.AssetType || 'Other',
      'Office / Branch': officeName,
      'Assigned To': m.assigned_to || m.AssignedUserName || 'Unassigned',
      'Status': m.status || m.Status || 'Working',
      'Remarks / Specs': m.remarks || m.Specifications || m.Notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for a clean Excel appearance
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Verified No
    { wch: 32 }, // Item Name
    { wch: 18 }, // Category
    { wch: 20 }, // Office
    { wch: 20 }, // Assigned To
    { wch: 14 }, // Status
    { wch: 45 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Computers & Assets');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export complete workbook with both Machines and Service Details sheets
 */
export function exportFullWorkbook(machines, services, filename = 'KMN_IT_Asset_Master.xlsx') {
  const machinesData = machines.map((m, idx) => {
    const locId = m.CurrentLocationID || '';
    const locName = m.LocationName || m.office || '';
    const isPalawiya = locId === 'LOC-0002' || locName.toLowerCase().includes('palawi') || locName.toLowerCase().includes('palavi');
    const officeName = isPalawiya ? 'Palawiya Office' : (m.office || m.LocationName || 'Chilaw Office');

    return {
      'No': idx + 1,
      'Verified No': m.verified_no || m.VerifiedNo || 'N/A',
      'Item Name': m.item_name || `${m.Brand || ''} ${m.Model || ''}`.trim() || '',
      'Category': m.category || m.AssetType || 'Other',
      'Office': officeName,
      'Assigned User': m.assigned_to || m.AssignedUserName || 'Unassigned',
      'Status': m.status || m.Status || 'Working',
      'Remarks / Specifications': m.remarks || m.Specifications || m.Notes || '',
    };
  });

  const servicesData = services.map((s, idx) => ({
    'No': idx + 1,
    'Date': s.service_date || '',
    'Verified No': s.verified_no || '',
    'Device Name': s.device_name || '',
    'Assigned To': s.assigned_to || '',
    'Service Details': s.service_details || '',
    'Charges (LKR)': s.charges || 0,
    'Remarks / Vendor': s.vendor_remarks || '',
    'Last Service': s.last_service || '',
    'Next Service': s.next_service || '',
  }));

  const wb = XLSX.utils.book_new();

  const wsMachines = XLSX.utils.json_to_sheet(machinesData);
  wsMachines['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 32 }, { wch: 18 },
    { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMachines, 'Machines Inventory');

  const wsServices = XLSX.utils.json_to_sheet(servicesData);
  wsServices['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 30 },
    { wch: 18 }, { wch: 35 }, { wch: 16 }, { wch: 22 },
    { wch: 14 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsServices, 'Service Details');

  XLSX.writeFile(wb, filename);
}

/**
 * Parse an uploaded Excel or CSV file to extract machine records
 */
export async function parseExcelImport(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          resolve([]);
          return;
        }

        // Find header row or parse rows
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const rowStr = (jsonData[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('item') || rowStr.includes('verified') || rowStr.includes('device') || rowStr.includes('name')) {
            headerRowIndex = i;
            break;
          }
        }

        const items = [];
        let currentUser = 'Chilaw Office';

        const rowsToProcess = headerRowIndex !== -1 ? jsonData.slice(headerRowIndex + 1) : jsonData;

        for (const row of rowsToProcess) {
          if (!row || row.length === 0) continue;
          
          const col0 = String(row[0] || '').trim();
          const col1 = String(row[1] || '').trim();
          const col2 = String(row[2] || '').trim();
          const col3 = String(row[3] || '').trim();
          const col4 = String(row[4] || '').trim();

          // Check if this row is a person header (e.g., "Mr. Sampath" or "Ms. Mishel")
          if (col0.startsWith('Mr.') || col0.startsWith('Ms.') || col0.startsWith('HR') || col0.startsWith('Accounts')) {
            currentUser = col0;
            continue;
          }
          if (col0.toLowerCase() === 'no' || col0.includes('LIST') || col0.includes('SERVICES')) {
            continue;
          }

          let verifiedNo = col1;
          let itemName = col2;

          // Swap if col1 is the item name and col2 is asset tag
          if (col1 && !col1.startsWith('KMN') && (col2.startsWith('KMN') || !col2)) {
            if (col2.startsWith('KMN')) {
              itemName = col1;
              verifiedNo = col2;
            }
          }

          if (!itemName && !verifiedNo && !col0) continue;
          if (!itemName && verifiedNo) {
            itemName = verifiedNo;
            verifiedNo = '';
          }

          items.push({
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            verified_no: verifiedNo,
            item_name: itemName || 'Imported Device',
            category: detectCategory(itemName),
            office: 'Chilaw Office',
            assigned_to: currentUser,
            status: col3 || 'Working',
            remarks: col4 || '',
          });
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function detectCategory(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('cpu') || n.includes('intel') || n.includes('vostro') || n.includes('desktop')) return 'CPU / Desktop';
  if (n.includes('laptop')) return 'Laptop';
  if (n.includes('monitor')) return 'Monitor';
  if (n.includes('key board') || n.includes('keyboard')) return 'Keyboard';
  if (n.includes('mouse')) return 'Mouse';
  if (n.includes('ups')) return 'UPS';
  if (n.includes('printer') || n.includes('canon') || n.includes('imageclass') || n.includes('ink')) return 'Printer / Scanner';
  return 'Other Accessory';
}
