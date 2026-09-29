import fs from 'fs';
import path from 'path';

const dataPath = path.resolve('src/data/chilawFixedAssetsData.json');
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const assets = raw.assets;

// 1. Auditorium layout (92 chairs in 6 tiered rows)
const auditoriumChairs = assets.filter(a => a.isChair && a.zoneId === 'auditorium');
const leftXCoords = [160, 176, 192, 208, 224, 240, 256, 272];
const rightXCoords = [328, 344, 360, 376, 392, 408, 424, 440];
const rowYCoords = [415, 438, 461, 484, 507, 530];

let audIdx = 0;
for (const y of rowYCoords) {
  // Left bank
  for (const x of leftXCoords) {
    if (audIdx < auditoriumChairs.length) {
      const a = auditoriumChairs[audIdx++];
      a.physX = x;
      a.physY = y;
      a.rotation = 0; // facing stage (North)
      a.furnitureType = 'chair_auditorium';
      a.seatLabel = `Seat ${audIdx}`;
    }
  }
  // Right bank
  for (const x of rightXCoords) {
    if (audIdx < auditoriumChairs.length) {
      const a = auditoriumChairs[audIdx++];
      a.physX = x;
      a.physY = y;
      a.rotation = 0; // facing stage (North)
      a.furnitureType = 'chair_auditorium';
      a.seatLabel = `Seat ${audIdx}`;
    }
  }
}

// 2. MD's Office Room Layout
const mdAssets = assets.filter(a => a.zoneId === 'md_office');
const mdChairs = mdAssets.filter(a => a.isChair);
const mdTables = mdAssets.filter(a => a.keyword === 'Table & Desk');
const mdPCs = mdAssets.filter(a => a.category === 'Computers & IT');

// Executive Chair behind desk
if (mdChairs[0]) {
  mdChairs[0].physX = 300;
  mdChairs[0].physY = 612;
  mdChairs[0].rotation = 180; // facing down to desk
  mdChairs[0].furnitureType = 'chair_executive';
}
// Visitor chairs in front of desk
if (mdChairs[1]) {
  mdChairs[1].physX = 275;
  mdChairs[1].physY = 665;
  mdChairs[1].rotation = 0; // facing up to desk
  mdChairs[1].furnitureType = 'chair_visitor';
}
if (mdChairs[2]) {
  mdChairs[2].physX = 325;
  mdChairs[2].physY = 665;
  mdChairs[2].rotation = 0; // facing up to desk
  mdChairs[2].furnitureType = 'chair_visitor';
}
// Guest chairs around coffee table
if (mdChairs[3]) {
  mdChairs[3].physX = 375;
  mdChairs[3].physY = 620;
  mdChairs[3].rotation = 270;
  mdChairs[3].furnitureType = 'chair_office';
}
if (mdChairs[4]) {
  mdChairs[4].physX = 425;
  mdChairs[4].physY = 620;
  mdChairs[4].rotation = 90;
  mdChairs[4].furnitureType = 'chair_office';
}
if (mdChairs[5]) {
  mdChairs[5].physX = 400;
  mdChairs[5].physY = 645;
  mdChairs[5].rotation = 0;
  mdChairs[5].furnitureType = 'chair_office';
}
if (mdChairs[6]) {
  mdChairs[6].physX = 400;
  mdChairs[6].physY = 595;
  mdChairs[6].rotation = 180;
  mdChairs[6].furnitureType = 'chair_office';
}
if (mdChairs[7]) {
  mdChairs[7].physX = 230;
  mdChairs[7].physY = 595;
  mdChairs[7].rotation = 0;
  mdChairs[7].furnitureType = 'chair_stool';
}

// MD Tables
if (mdTables[0]) {
  mdTables[0].physX = 300;
  mdTables[0].physY = 635;
  mdTables[0].furnitureType = 'table_executive';
  mdTables[0].width = 90;
  mdTables[0].height = 36;
}
if (mdTables[1]) {
  mdTables[1].physX = 400;
  mdTables[1].physY = 620;
  mdTables[1].furnitureType = 'table_coffee';
  mdTables[1].width = 46;
  mdTables[1].height = 24;
}
if (mdTables[2]) {
  mdTables[2].physX = 230;
  mdTables[2].physY = 635;
  mdTables[2].furnitureType = 'table_side';
  mdTables[2].width = 24;
  mdTables[2].height = 24;
}

// MD PCs / Monitors
if (mdPCs[0]) {
  mdPCs[0].physX = 300;
  mdPCs[0].physY = 633;
  mdPCs[0].furnitureType = 'pc_monitor';
}
if (mdPCs[1]) {
  mdPCs[1].physX = 240;
  mdPCs[1].physY = 633;
  mdPCs[1].furnitureType = 'pc_monitor';
}

// 3. Ground Operations Hall (Main Office) Workstations Layout
const mainOffAssets = assets.filter(a => a.zoneId === 'main_office');
const mainChairs = mainOffAssets.filter(a => a.isChair);
const mainTables = mainOffAssets.filter(a => a.keyword === 'Table & Desk');
const mainPCs = mainOffAssets.filter(a => a.category === 'Computers & IT');

// Define 24 physical workstation desk & chair slots in Main Office:
// Cluster 1 (North pod: 8 desks in 2 rows facing each other: y = 205 and y = 245, x = 230, 280, 330, 380)
// Cluster 2 (Center pod: 8 desks in 2 rows facing each other: y = 305 and y = 345, x = 230, 280, 330, 380)
// Cluster 3 (East pod: 8 desks in 2 rows facing each other: y = 235 and y = 275, x = 440, 485; y = 335, 375, x = 440, 485)
const workstationSlots = [
  // Cluster 1 (North)
  { deskX: 230, deskY: 215, chairX: 230, chairY: 195, rot: 180, label: 'Desk 01' },
  { deskX: 280, deskY: 215, chairX: 280, chairY: 195, rot: 180, label: 'Desk 02' },
  { deskX: 330, deskY: 215, chairX: 330, chairY: 195, rot: 180, label: 'Desk 03' },
  { deskX: 380, deskY: 215, chairX: 380, chairY: 195, rot: 180, label: 'Desk 04' },
  { deskX: 230, deskY: 235, chairX: 230, chairY: 255, rot: 0, label: 'Desk 05' },
  { deskX: 280, deskY: 235, chairX: 280, chairY: 255, rot: 0, label: 'Desk 06' },
  { deskX: 330, deskY: 235, chairX: 330, chairY: 255, rot: 0, label: 'Desk 07' },
  { deskX: 380, deskY: 235, chairX: 380, chairY: 255, rot: 0, label: 'Desk 08' },

  // Cluster 2 (Center)
  { deskX: 230, deskY: 315, chairX: 230, chairY: 295, rot: 180, label: 'Desk 09' },
  { deskX: 280, deskY: 315, chairX: 280, chairY: 295, rot: 180, label: 'Desk 10' },
  { deskX: 330, deskY: 315, chairX: 330, chairY: 295, rot: 180, label: 'Desk 11' },
  { deskX: 380, deskY: 315, chairX: 380, chairY: 295, rot: 180, label: 'Desk 12' },
  { deskX: 230, deskY: 335, chairX: 230, chairY: 355, rot: 0, label: 'Desk 13' },
  { deskX: 280, deskY: 335, chairX: 280, chairY: 355, rot: 0, label: 'Desk 14' },
  { deskX: 330, deskY: 335, chairX: 330, chairY: 355, rot: 0, label: 'Desk 15' },
  { deskX: 380, deskY: 335, chairX: 380, chairY: 355, rot: 0, label: 'Desk 16' },

  // Cluster 3 (East side)
  { deskX: 440, deskY: 220, chairX: 440, chairY: 200, rot: 180, label: 'Desk 17' },
  { deskX: 485, deskY: 220, chairX: 485, chairY: 200, rot: 180, label: 'Desk 18' },
  { deskX: 440, deskY: 245, chairX: 440, chairY: 265, rot: 0, label: 'Desk 19' },
  { deskX: 485, deskY: 245, chairX: 485, chairY: 265, rot: 0, label: 'Desk 20' },
  { deskX: 440, deskY: 320, chairX: 440, chairY: 300, rot: 180, label: 'Desk 21' },
  { deskX: 485, deskY: 320, chairX: 485, chairY: 300, rot: 180, label: 'Desk 22' },
  { deskX: 440, deskY: 345, chairX: 440, chairY: 365, rot: 0, label: 'Desk 23' },
  { deskX: 485, deskY: 345, chairX: 485, chairY: 365, rot: 0, label: 'Desk 24' }
];

mainChairs.forEach((chair, i) => {
  const slot = workstationSlots[i % workstationSlots.length];
  chair.physX = slot.chairX;
  chair.physY = slot.chairY;
  chair.rotation = slot.rot;
  chair.furnitureType = 'chair_office';
  chair.workstationSlot = slot.label;
});

mainTables.forEach((table, i) => {
  const slot = workstationSlots[i % workstationSlots.length];
  table.physX = slot.deskX;
  table.physY = slot.deskY;
  table.furnitureType = 'table_desk';
  table.width = 44;
  table.height = 20;
  table.workstationSlot = slot.label;
});

mainPCs.forEach((pc, i) => {
  const slot = workstationSlots[i % workstationSlots.length];
  pc.physX = slot.deskX;
  pc.physY = slot.deskY;
  pc.furnitureType = 'pc_monitor';
});

// 4. Reception Layout
const recAssets = assets.filter(a => a.zoneId === 'reception');
const recChairs = recAssets.filter(a => a.isChair);
// Receptionist behind counter
if (recChairs[0]) {
  recChairs[0].physX = 615;
  recChairs[0].physY = 370;
  recChairs[0].rotation = 180; // facing counter
  recChairs[0].furnitureType = 'chair_office';
}
// Visitor chairs
const recVisCoords = [
  { x: 540, y: 440, rot: 0 },
  { x: 575, y: 440, rot: 0 },
  { x: 645, y: 440, rot: 0 },
  { x: 680, y: 440, rot: 0 }
];
for (let i = 1; i < recChairs.length; i++) {
  const c = recVisCoords[(i - 1) % recVisCoords.length];
  recChairs[i].physX = c.x;
  recChairs[i].physY = c.y;
  recChairs[i].rotation = c.rot;
  recChairs[i].furnitureType = 'chair_visitor';
}

// 5. Ground Floor Dining Layout (Square table + 4 chairs)
const diningAssets = assets.filter(a => a.zoneId === 'ground_dining');
const diningChairs = diningAssets.filter(a => a.isChair);
const dTableX = 270, dTableY = 115;
const dChairOffsets = [
  { x: dTableX, y: dTableY - 26, rot: 180 }, // top facing down
  { x: dTableX + 26, y: dTableY, rot: 270 }, // right facing left
  { x: dTableX, y: dTableY + 26, rot: 0 },   // bottom facing up
  { x: dTableX - 26, y: dTableY, rot: 90 },  // left facing right
  { x: dTableX + 50, y: dTableY, rot: 270 }
];
diningChairs.forEach((chair, i) => {
  const o = dChairOffsets[i % dChairOffsets.length];
  chair.physX = o.x;
  chair.physY = o.y;
  chair.rotation = o.rot;
  chair.furnitureType = 'chair_dining';
});

// 6. Recovery Team Office
const recovAssets = assets.filter(a => a.zoneId === 'recovery_office');
const recovChairs = recovAssets.filter(a => a.isChair);
const recovSlots = [
  { chairX: 250, chairY: 725, rot: 180 },
  { chairX: 320, chairY: 725, rot: 180 },
  { chairX: 390, chairY: 725, rot: 180 },
  { chairX: 280, chairY: 765, rot: 0 },
  { chairX: 360, chairY: 765, rot: 0 }
];
recovChairs.forEach((chair, i) => {
  const s = recovSlots[i % recovSlots.length];
  chair.physX = s.chairX;
  chair.physY = s.chairY;
  chair.rotation = s.rot;
  chair.furnitureType = 'chair_office';
});

// 7. MD Office Lobby
const mdLobbyChairs = assets.filter(a => a.isChair && a.zoneId === 'md_lobby');
const mdLobbyCoords = [
  { x: 345, y: 540, rot: 90 },
  { x: 375, y: 540, rot: 90 },
  { x: 415, y: 540, rot: 270 },
  { x: 445, y: 540, rot: 270 }
];
mdLobbyChairs.forEach((chair, i) => {
  const c = mdLobbyCoords[i % mdLobbyCoords.length];
  chair.physX = c.x;
  chair.physY = c.y;
  chair.rotation = c.rot;
  chair.furnitureType = 'chair_visitor';
});

// 8. Chilaw Lab (New Lab Annex) - Lab Stools
const labChairs = assets.filter(a => a.isChair && a.zoneId === 'chilaw_lab');
const labCoords = [
  { x: 285, y: 125, rot: 180 },
  { x: 315, y: 125, rot: 180 },
  { x: 345, y: 125, rot: 180 },
  { x: 375, y: 125, rot: 180 },
  { x: 295, y: 165, rot: 90 },
  { x: 295, y: 195, rot: 90 },
  { x: 335, y: 165, rot: 270 },
  { x: 335, y: 195, rot: 270 }
];
labChairs.forEach((chair, i) => {
  const c = labCoords[i % labCoords.length];
  chair.physX = c.x;
  chair.physY = c.y;
  chair.rotation = c.rot;
  chair.furnitureType = 'chair_stool';
});

// 9. Mr. Nadun's Office
const nadunChairs = assets.filter(a => a.isChair && a.zoneId === 'nadun_office');
if (nadunChairs[0]) {
  nadunChairs[0].physX = 770;
  nadunChairs[0].physY = 385;
  nadunChairs[0].rotation = 180;
  nadunChairs[0].furnitureType = 'chair_executive';
}
if (nadunChairs[1]) {
  nadunChairs[1].physX = 770;
  nadunChairs[1].physY = 425;
  nadunChairs[1].rotation = 0;
  nadunChairs[1].furnitureType = 'chair_visitor';
}

// 10. 1st Floor Dining Room
const firstDiningChairs = assets.filter(a => a.isChair && a.zoneId === 'first_dining');
if (firstDiningChairs[0]) {
  firstDiningChairs[0].physX = 715;
  firstDiningChairs[0].physY = 318;
  firstDiningChairs[0].rotation = 90;
  firstDiningChairs[0].furnitureType = 'chair_dining';
}
if (firstDiningChairs[1]) {
  firstDiningChairs[1].physX = 745;
  firstDiningChairs[1].physY = 318;
  firstDiningChairs[1].rotation = 270;
  firstDiningChairs[1].furnitureType = 'chair_dining';
}

// Fallback for any remaining assets: use coordX, coordY
assets.forEach(a => {
  if (a.physX === undefined) a.physX = a.coordX;
  if (a.physY === undefined) a.physY = a.coordY;
  if (a.rotation === undefined) a.rotation = 0;
  if (a.furnitureType === undefined) {
    a.furnitureType = a.isChair ? 'chair_office' : a.keyword === 'Table & Desk' ? 'table_desk' : 'generic_item';
  }
});

fs.writeFileSync(dataPath, JSON.stringify(raw, null, 2));
console.log('Successfully assigned physical architectural coordinates to all assets!');
console.log(`Auditorium chairs placed: ${auditoriumChairs.length}`);
console.log(`Main office chairs placed: ${mainChairs.length}`);
console.log(`MD chairs placed: ${mdChairs.length}`);
