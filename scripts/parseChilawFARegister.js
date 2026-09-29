import fs from 'fs';
import path from 'path';
import xlsxModule from 'xlsx';
const XLSX = xlsxModule.default || xlsxModule;

const excelPath = path.resolve('Chilaw FA Register 2026 .xlsx');
if (!fs.existsSync(excelPath)) {
  console.error('File not found:', excelPath);
  process.exit(1);
}

const wb = XLSX.readFile(excelPath);

// 1. Index 2023/04 verifications
const v2023Map = new Map();
for (const sName of ['Furniture & Fittings', 'Office Equipment', 'CCTV,Computers & Printers', 'Lab Equipment']) {
  const ws = wb.Sheets[sName];
  if (!ws) continue;
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const v2023 = r[0] ? String(r[0]).trim() : '';
    const v2022 = r[1] ? String(r[1]).trim() : '';
    const item = r[3] ? String(r[3]).trim() : '';
    const desc = r[5] ? String(r[5]).trim() : '';
    const brand = r[7] ? String(r[7]).trim() : '';
    const serial = r[8] ? String(r[8]).trim() : '';
    const model = r[9] ? String(r[9]).trim() : '';
    const amount = r[14];
    const rec = { v2023, v2022, item, desc, brand, serial, model, amount };
    if (v2023) v2023Map.set(v2023.toLowerCase(), rec);
    if (v2022 && v2022 !== 'New') v2023Map.set(v2022.toLowerCase(), rec);
  }
}

// 2. Index Palavi & Damaged items
const palaviList = [];
if (wb.Sheets['Sent Palavi & Damaged Missing']) {
  const ws = wb.Sheets['Sent Palavi & Damaged Missing'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[2]) continue;
    palaviList.push({
      item: String(r[2]).trim(),
      unitCount: r[3] || 1,
      description: r[4] ? String(r[4]).trim() : '',
      brandModel: r[5] ? String(r[5]).trim() : '',
      serialNo: r[6] ? String(r[6]).trim() : '',
      usedBy: r[7] ? String(r[7]).trim() : '',
      chilawLoc: r[8] ? String(r[8]).trim() : '',
      remarks: r[9] ? String(r[9]).trim() : '',
      amount: r[10] || '',
      purchasedBy: r[11] || '',
      damagedDate: r[12] ? String(r[12]).trim() : ''
    });
  }
}

// Room Zone Definitions with exact Floor Plan (X, Y) centers
const ZONE_DEFINITIONS = {
  // Ground Floor
  md_office: {
    zoneId: 'md_office',
    name: "MD's Office Room",
    floor: 'Ground Floor',
    centerX: 330,
    centerY: 630,
    bounds: { minX: 180, maxX: 470, minY: 570, maxY: 685 }
  },
  md_lobby: {
    zoneId: 'md_lobby',
    name: 'MD Office Lobby',
    floor: 'Ground Floor',
    centerX: 390,
    centerY: 550,
    bounds: { minX: 300, maxX: 470, minY: 515, maxY: 570 }
  },
  reception: {
    zoneId: 'reception',
    name: 'Reception & Front Lobby',
    floor: 'Ground Floor',
    centerX: 620,
    centerY: 440,
    bounds: { minX: 480, maxX: 750, minY: 350, maxY: 520 }
  },
  main_office: {
    zoneId: 'main_office',
    name: 'Ground Operations Hall (Main Office)',
    floor: 'Ground Floor',
    centerX: 380,
    centerY: 280,
    bounds: { minX: 180, maxX: 525, minY: 170, maxY: 450 }
  },
  recovery_office: {
    zoneId: 'recovery_office',
    name: 'Recovery Team Office Room',
    floor: 'Ground Floor',
    centerX: 330,
    centerY: 745,
    bounds: { minX: 180, maxX: 470, minY: 685, maxY: 800 }
  },
  stationary_room: {
    zoneId: 'stationary_room',
    name: 'Stationary & Records Room',
    floor: 'Ground Floor',
    centerX: 330,
    centerY: 860,
    bounds: { minX: 180, maxX: 470, minY: 800, maxY: 920 }
  },
  ground_dining: {
    zoneId: 'ground_dining',
    name: 'Ground Floor Dining & Pantry',
    floor: 'Ground Floor',
    centerX: 270,
    centerY: 115,
    bounds: { minX: 180, maxX: 365, minY: 60, maxY: 170 }
  },
  stores: {
    zoneId: 'stores',
    name: 'Chilaw Stores (Mr. Wasantha)',
    floor: 'Ground Floor',
    centerX: 830,
    centerY: 500,
    bounds: { minX: 750, maxX: 905, minY: 445, maxY: 570 }
  },
  fish_tank: {
    zoneId: 'fish_tank',
    name: 'Fish Tank Gallery',
    floor: 'Ground Floor',
    centerX: 395,
    centerY: 535,
    bounds: { minX: 299, maxX: 480, minY: 510, maxY: 565 }
  },
  stairs_entrance: {
    zoneId: 'stairs_entrance',
    name: 'Stairs & Entrance Corridor',
    floor: 'Ground Floor',
    centerX: 240,
    centerY: 480,
    bounds: { minX: 180, maxX: 300, minY: 450, maxY: 515 }
  },
  generator_room: {
    zoneId: 'generator_room',
    name: 'Generator Room & Utilities',
    floor: 'Ground Floor',
    centerX: 830,
    centerY: 240,
    bounds: { minX: 750, maxX: 905, minY: 170, maxY: 350 }
  },

  // 1st Floor
  auditorium: {
    zoneId: 'auditorium',
    name: 'Main Auditorium',
    floor: '1st Floor',
    centerX: 300,
    centerY: 460,
    bounds: { minX: 140, maxX: 460, minY: 365, maxY: 560 }
  },
  nadun_office: {
    zoneId: 'nadun_office',
    name: "Mr. Nadun's Room (Executive Director)",
    floor: '1st Floor',
    centerX: 775,
    centerY: 405,
    bounds: { minX: 670, maxX: 880, minY: 365, maxY: 440 }
  },
  nadun_lobby: {
    zoneId: 'nadun_lobby',
    name: "1st Floor Main Hall & Nadun's Lobby",
    floor: '1st Floor',
    centerX: 620,
    centerY: 500,
    bounds: { minX: 460, maxX: 880, minY: 365, maxY: 560 }
  },
  conference_room: {
    zoneId: 'conference_room',
    name: 'Main Conference Room',
    floor: '1st Floor',
    centerX: 730,
    centerY: 210,
    bounds: { minX: 580, maxX: 880, minY: 150, maxY: 270 }
  },
  first_dining: {
    zoneId: 'first_dining',
    name: '1st Floor Dining Room (Lunch Room)',
    floor: '1st Floor',
    centerX: 730,
    centerY: 318,
    bounds: { minX: 580, maxX: 880, minY: 270, maxY: 365 }
  },
  chilaw_lab: {
    zoneId: 'chilaw_lab',
    name: 'Chilaw Lab (New Lab Annex)',
    floor: '1st Floor',
    centerX: 325,
    centerY: 160,
    bounds: { minX: 250, maxX: 400, minY: 85, maxY: 235 }
  },
  rest_room: {
    zoneId: 'rest_room',
    name: 'Discussion Room / Rest Room',
    floor: '1st Floor',
    centerX: 730,
    centerY: 100,
    bounds: { minX: 580, maxX: 880, minY: 45, maxY: 150 }
  },

  // Off-Site
  palavi: {
    zoneId: 'palavi',
    name: 'Palavi Branch Office',
    floor: 'Off-Site',
    isOffSite: true
  },
  second_land: {
    zoneId: 'second_land',
    name: '2nd Land Facility / Hatchery',
    floor: 'Off-Site',
    isOffSite: true
  },
  home_residence: {
    zoneId: 'home_residence',
    name: 'Home Residence / External',
    floor: 'Off-Site',
    isOffSite: true
  }
};

function resolveZone(locStr, userStr) {
  const s = ((locStr || '') + ' ' + (userStr || '')).toLowerCase();

  // Off-site
  if (s.includes('palavi')) return ZONE_DEFINITIONS.palavi;
  if (s.includes('2nd land') || s.includes('hatchery') || s.includes('ga') || s.includes('green aqua')) return ZONE_DEFINITIONS.second_land;
  if (s.includes('home') && !s.includes('office')) return ZONE_DEFINITIONS.home_residence;

  // 1st Floor
  if (s.includes('auditorium')) return ZONE_DEFINITIONS.auditorium;
  if (s.includes('nadun') && (s.includes('room') || s.includes('office') || s.includes('director'))) return ZONE_DEFINITIONS.nadun_office;
  if (s.includes('nadun') && s.includes('lobby')) return ZONE_DEFINITIONS.nadun_lobby;
  if (s.includes('conference')) return ZONE_DEFINITIONS.conference_room;
  if (s.includes('upstair dining') || (s.includes('dining') && (s.includes('upstair') || s.includes('1st')))) return ZONE_DEFINITIONS.first_dining;
  if (s.includes('lab')) return ZONE_DEFINITIONS.chilaw_lab;
  if (s.includes('rest room') || s.includes('bed room')) return ZONE_DEFINITIONS.rest_room;

  // Ground Floor
  if (s.includes("md s' office") || s.includes("md's office") || s.includes('boss room') || s.includes('boss office')) return ZONE_DEFINITIONS.md_office;
  if (s.includes("md s'  office lobby") || s.includes("md's lobby") || s.includes('md lobby') || s.includes('infornt of boss')) return ZONE_DEFINITIONS.md_lobby;
  if (s.includes('recovery')) return ZONE_DEFINITIONS.recovery_office;
  if (s.includes('stationary') || s.includes('record room')) return ZONE_DEFINITIONS.stationary_room;
  if (s.includes('reception') || s.includes('ground floor  lobby') || s.includes('office loby') || s.includes('mishel')) return ZONE_DEFINITIONS.reception;
  if (s.includes('ground floor dining') || (s.includes('dining') && s.includes('ground')) || s.includes('kitchen')) return ZONE_DEFINITIONS.ground_dining;
  if (s.includes('store') || s.includes('wasantha')) return ZONE_DEFINITIONS.stores;
  if (s.includes('fish tank')) return ZONE_DEFINITIONS.fish_tank;
  if (s.includes('generator')) return ZONE_DEFINITIONS.generator_room;
  if (s.includes('stairs') || s.includes('carporch')) return ZONE_DEFINITIONS.stairs_entrance;

  // Default Ground Office Hall
  return ZONE_DEFINITIONS.main_office;
}

// 3. Normalize Category and Keyword
function normalizeCategoryAndKeyword(rawCategory, rawKeyword, itemName) {
  const text = ((rawKeyword || '') + ' ' + (itemName || '') + ' ' + (rawCategory || '')).toLowerCase();

  let category = 'Other';
  let keyword = rawKeyword ? String(rawKeyword).trim() : 'Other';

  if (text.includes('chair') || text.includes('stool')) {
    category = 'Furniture & Fittings';
    keyword = 'Chair';
  } else if (text.includes('table') || text.includes('desk') || text.includes('pedestal')) {
    category = 'Furniture & Fittings';
    keyword = 'Table & Desk';
  } else if (text.includes('cupboard') || text.includes('rack') || text.includes('drawer') || text.includes('cabinet') || text.includes('wardrobe')) {
    category = 'Furniture & Fittings';
    keyword = 'Storage & Racks';
  } else if (text.includes('sofa') || text.includes('bed') || text.includes('mattress') || text.includes('towel') || text.includes('mirror') || text.includes('white board')) {
    category = 'Furniture & Fittings';
    keyword = 'Furniture';
  } else if (text.includes('computer') || text.includes('laptop') || text.includes('cpu') || text.includes('monitor') || text.includes('mouse') || text.includes('keyboard') || text.includes('ups') || text.includes('printer') || text.includes('scanner') || text.includes('hard disk')) {
    category = 'Computers & IT';
    if (text.includes('printer')) keyword = 'Printer';
    else if (text.includes('monitor')) keyword = 'Monitor';
    else if (text.includes('laptop')) keyword = 'Laptop';
    else if (text.includes('ups')) keyword = 'UPS';
    else keyword = 'Computer & Hardware';
  } else if (text.includes('cctv') || text.includes('camera') || text.includes('decoder')) {
    category = 'CCTV & Security';
    keyword = 'CCTV & Camera';
  } else if (text.includes('air conditioner') || text.includes('a/c') || text.includes('ac machine') || text.includes('inverter')) {
    category = 'Air Conditioners';
    keyword = 'Air Conditioner';
  } else if (text.includes('phone') || text.includes('fan') || text.includes('shredder') || text.includes('calculator') || text.includes('clock') || text.includes('iron') || text.includes('blender') || text.includes('fridge') || text.includes('refrigerator') || text.includes('kettle') || text.includes('gas cooker') || text.includes('dispenser') || text.includes('projector') || text.includes('screen') || text.includes('amplifier') || text.includes('speaker') || text.includes('mic')) {
    category = 'Office Equipment';
    if (text.includes('fan')) keyword = 'Fan';
    else if (text.includes('phone')) keyword = 'Telephone';
    else keyword = 'Office Equipment';
  } else if (text.includes('lab') || text.includes('microscope') || text.includes('autoclave') || text.includes('centrifuge') || text.includes('meter') || text.includes('incubator') || text.includes('distiller') || text.includes('balance') || text.includes('scale')) {
    category = 'Lab Equipment';
    keyword = 'Lab Equipment';
  }

  return { category, keyword };
}

// 4. Parse Orginal sheet
const orgWs = wb.Sheets['Orginal'];
const orgRows = XLSX.utils.sheet_to_json(orgWs, { header: 1 });
let currentSectionLoc = '';
const assets = [];

// Jitter counter per zone to disperse markers nicely within room bounds
const zoneCounts = {};

for (let i = 2; i < orgRows.length; i++) {
  const r = orgRows[i];
  if (!r || r.length === 0) continue;

  if (r.length <= 3 && r[1] && typeof r[1] === 'string' && !r[0]) {
    currentSectionLoc = r[1].trim();
    continue;
  }

  const v2026 = r[0] ? String(r[0]).trim() : '';
  const v2025 = r[1] ? String(r[1]).trim() : '';
  const v2024 = r[2] ? String(r[2]).trim() : '';
  const v2022 = r[3] ? String(r[3]).trim() : '';
  const itemName = r[5] ? String(r[5]).trim() : '';

  if (!itemName && !v2026 && !v2025 && !v2024 && !v2022) continue;

  const rawKeyword = r[6] ? String(r[6]).trim() : '';
  const rawCat = r[7] ? String(r[7]).trim() : '';
  const desc = r[8] ? String(r[8]).trim() : '';
  const purchasedBy = r[9] ? String(r[9]).trim() : '';
  const brand = r[10] ? String(r[10]).trim() : '';
  const serialNo = r[11] ? String(r[11]).trim() : '';
  const model = r[12] ? String(r[12]).trim() : '';
  const user = (r[13] || r[14]) ? String(r[13] || r[14]).trim() : '';
  const rawLoc = (r[15] ? String(r[15]).trim() : currentSectionLoc) || 'Chilaw Office';
  const condition = r[16] ? String(r[16]).trim() : 'Usable';
  const amount = r[17] ? String(r[17]).trim() : '';
  const remarks = r[18] ? String(r[18]).trim() : '';
  const dateOfPurchase = r[4] ? String(r[4]).trim() : '';

  const zone = resolveZone(rawLoc, user);
  const { category, keyword } = normalizeCategoryAndKeyword(rawCat, rawKeyword, itemName);

  // Cross reference 2023 verification
  let v2023 = '';
  const lookup24 = v2024.toLowerCase();
  const lookup22 = v2022.toLowerCase();
  if (v2023Map.has(lookup24)) {
    v2023 = v2023Map.get(lookup24).v2023;
  } else if (v2023Map.has(lookup22)) {
    v2023 = v2023Map.get(lookup22).v2023;
  }

  // Cross reference Palavi transfer or Damaged incident
  const matchedPalavi = palaviList.find(p => {
    if (serialNo && serialNo !== '-' && p.serialNo && p.serialNo === serialNo) return true;
    if (p.item.toLowerCase() === itemName.toLowerCase() && (p.description && desc && p.description.toLowerCase().includes(desc.toLowerCase().slice(0, 15)))) return true;
    return false;
  });

  // Calculate dispersed coordinates within room bounds
  zoneCounts[zone.zoneId] = (zoneCounts[zone.zoneId] || 0) + 1;
  const countInZone = zoneCounts[zone.zoneId];

  let coordX = zone.centerX || 0;
  let coordY = zone.centerY || 0;
  if (zone.bounds) {
    const { minX, maxX, minY, maxY } = zone.bounds;
    const padding = 16;
    const innerW = Math.max(20, (maxX - minX) - padding * 2);
    const innerH = Math.max(20, (maxY - minY) - padding * 2);
    // Pseudo-random deterministic scatter based on item index
    const colIndex = (countInZone * 7) % 11;
    const rowIndex = (countInZone * 13) % 9;
    coordX = Math.round(minX + padding + (innerW * (colIndex + 0.5) / 11));
    coordY = Math.round(minY + padding + (innerH * (rowIndex + 0.5) / 9));
  }

  // Build Audit Verification Timeline
  const auditTimeline = [];
  if (v2026) {
    auditTimeline.push({
      auditCycle: '2026/08',
      tagNumber: v2026,
      date: '2026-08',
      status: condition === 'Damaged' ? 'Damaged / Needs Attention' : 'Verified & Usable',
      location: zone.name,
      verifiedBy: 'Annual Physical Asset Audit 2026'
    });
  }
  if (v2025) {
    auditTimeline.push({
      auditCycle: '2025/09',
      tagNumber: v2025,
      date: '2025-09-22',
      status: 'Verified & Usable',
      location: zone.name,
      verifiedBy: 'Audit Committee 2025'
    });
  }
  if (v2024) {
    auditTimeline.push({
      auditCycle: '2024/04',
      tagNumber: v2024,
      date: '2024-04',
      status: 'Verified & Usable',
      location: zone.name,
      verifiedBy: 'Audit Committee 2024'
    });
  }
  if (v2023) {
    auditTimeline.push({
      auditCycle: '2023/04',
      tagNumber: v2023,
      date: '2023-04',
      status: 'Verified Usable',
      location: zone.name,
      verifiedBy: 'Category Audit 2023'
    });
  }
  if (v2022) {
    auditTimeline.push({
      auditCycle: '2022/06',
      tagNumber: v2022,
      date: '2022-06',
      status: 'Baseline Asset Registration',
      location: zone.name,
      verifiedBy: 'Asset Register Baseline 2022'
    });
  }

  // Transfer / Relocation History
  const transferHistory = [];
  if (matchedPalavi) {
    transferHistory.push({
      date: matchedPalavi.damagedDate || '2023-05',
      fromLocation: matchedPalavi.chilawLoc || 'Chilaw Head Office',
      toLocation: 'Palavi Branch Office',
      custodian: matchedPalavi.usedBy || 'Palavi Office',
      reason: matchedPalavi.remarks || 'Branch Asset Allocation / Replacement',
      authorizedBy: matchedPalavi.purchasedBy || 'IT / Administration'
    });
  } else if (zone.isOffSite) {
    transferHistory.push({
      date: '2024-01',
      fromLocation: 'Chilaw Head Office',
      toLocation: zone.name,
      custodian: user || 'Designated Custodian',
      reason: 'Assigned to Off-Site facility'
    });
  }

  const primaryTag = v2026 || v2025 || v2024 || v2023 || v2022 || `KMN/CH/FA/${String(assets.length + 1).padStart(4, '0')}`;

  assets.push({
    id: `FA-${String(assets.length + 1).padStart(4, '0')}`,
    tagNumber: primaryTag,
    verified2026: v2026,
    verified2025: v2025,
    verified2024: v2024,
    verified2023: v2023,
    verified2022: v2022,
    dateOfPurchase,
    itemName,
    keyword,
    category,
    description: desc,
    purchasedBy,
    brand,
    serialNo,
    model,
    user: user || 'Common / Facility',
    locationName: rawLoc,
    zoneId: zone.zoneId,
    zoneName: zone.name,
    floor: zone.floor,
    coordX,
    coordY,
    condition: condition || 'Usable',
    amount: amount || '-',
    remarks,
    isOffSite: !!zone.isOffSite,
    isChair: keyword === 'Chair' || itemName.toLowerCase().includes('chair'),
    auditTimeline,
    transferHistory
  });
}

console.log(`Successfully compiled ${assets.length} assets!`);
console.log(`Total Chairs: ${assets.filter(a => a.isChair).length}`);

// Output summary of categories
const catSummary = {};
assets.forEach(a => {
  catSummary[a.category] = (catSummary[a.category] || 0) + 1;
});
console.log('Categories summary:', catSummary);

const outputPath = path.resolve('src/data/chilawFixedAssetsData.json');
fs.writeFileSync(outputPath, JSON.stringify({
  version: '2026.1',
  generatedAt: new Date().toISOString(),
  totalCount: assets.length,
  zones: ZONE_DEFINITIONS,
  assets
}, null, 2));

console.log('Saved to:', outputPath);
