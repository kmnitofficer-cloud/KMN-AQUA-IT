import xlsxModule from 'xlsx';
const XLSX = xlsxModule.default || xlsxModule;

const wb = XLSX.readFile('database/IT_Asset_Database.xlsx');
const assets = XLSX.utils.sheet_to_json(wb.Sheets['Assets']);
const users = XLSX.utils.sheet_to_json(wb.Sheets['Users']);

const userMap = new Map(users.map(u => [u.UserID, u.Name]));

const cleanedAssets = assets.map(a => {
  let brand = String(a.Brand || '').trim();
  let model = String(a.Model || '').trim();
  const type = String(a.AssetType || 'Device').trim();

  // If brand is "NONE", determine better brand
  if (brand.toUpperCase() === 'NONE' || !brand) {
    if (type === 'UPS') brand = 'Office Standard';
    else if (type === 'Mouse' || type === 'Keyboard') brand = 'Standard';
    else brand = 'Generic';
  }

  // If model is "NONE" or empty or matches brand
  if (model.toUpperCase() === 'NONE' || !model || model.toUpperCase() === brand.toUpperCase()) {
    if (type === 'UPS') {
      model = a.VerifiedNo ? `Office UPS Backup Unit (${a.VerifiedNo})` : 'Office UPS Backup Unit';
    } else if (type === 'Mouse') {
      model = `${brand !== 'Standard' && brand !== 'Generic' && brand !== 'Office Standard' ? brand + ' ' : ''}Optical USB Mouse`;
    } else if (type === 'Keyboard') {
      model = `${brand !== 'Standard' && brand !== 'Generic' && brand !== 'Office Standard' ? brand + ' ' : ''}Standard Keyboard`;
    } else if (type === 'Monitor') {
      model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Display Monitor`;
    } else if (type === 'Desktop' || type === 'CPU') {
      model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Desktop PC Workstation`;
    } else if (type === 'Laptop') {
      model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Business Laptop`;
    } else if (type === 'Lab Equipment') {
      model = `${brand !== 'Generic' ? brand + ' ' : ''}Laboratory Testing Machine`;
    } else {
      model = `${brand !== 'Generic' ? brand + ' ' : ''}${type}`;
    }
  }

  // Remove duplicate brand prefix if present
  if (model.toLowerCase().startsWith(brand.toLowerCase() + ' ')) {
    model = model.slice(brand.length + 1).trim();
  }

  return {
    ...a,
    Brand: brand,
    Model: model
  };
});

// Update worksheet
const newWs = XLSX.utils.json_to_sheet(cleanedAssets);
wb.Sheets['Assets'] = newWs;
XLSX.writeFile(wb, 'database/IT_Asset_Database.xlsx');
console.log('Successfully cleaned up Assets table in database/IT_Asset_Database.xlsx');

// Print sample labels
cleanedAssets.slice(0, 15).forEach(a => {
  const userName = userMap.get(a.CurrentUserID) || 'Unassigned / Storage';
  const tag = a.VerifiedNo ? `(${a.VerifiedNo})` : '';
  const label = `${userName} ➔ [${a.AssetType}] ${a.Brand} ${a.Model} ${tag} [${a.Status || 'Active'}]`.replace(/\s+/g, ' ');
  console.log('SAMPLE:', label);
});
