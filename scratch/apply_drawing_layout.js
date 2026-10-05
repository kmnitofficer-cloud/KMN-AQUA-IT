import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./src/data/chilawFixedAssetsData.json', 'utf8'));

// Exact positions based on the user's hand-drawn paper photo
const positionMap = {
  // === MD'S OFFICE ("Boss office") ===
  'FA-0012': { physX: 330, physY: 625, rotation: 0, user: 'MD (Boss)', zoneId: 'md_office' }, // Boss Executive Desk
  'FA-0005': { physX: 330, physY: 598, rotation: 180, user: 'MD (Boss)', zoneId: 'md_office' }, // Boss Executive Chair
  'FA-0006': { physX: 298, physY: 656, rotation: 0, user: 'Boss Office Visitor', zoneId: 'md_office' }, // Visitor Chair 1
  'FA-0009': { physX: 330, physY: 656, rotation: 0, user: 'Boss Office Visitor', zoneId: 'md_office' }, // Visitor Chair 2
  'FA-0010': { physX: 362, physY: 656, rotation: 0, user: 'Boss Office Visitor', zoneId: 'md_office' }, // Visitor Chair 3
  'FA-0004': { physX: 240, physY: 625, rotation: 0, user: 'MD (Boss)', zoneId: 'md_office' }, // Coffee Table
  'FA-0001': { physX: 240, physY: 598, rotation: 180, user: 'MD (Boss)', zoneId: 'md_office' }, // Buddha Statue Stool
  'FA-0007': { physX: 240, physY: 655, rotation: 0, user: 'MD Office Guest', zoneId: 'md_office' }, // Side chair
  'FA-0008': { physX: 410, physY: 625, rotation: 270, user: 'MD Office Guest', zoneId: 'md_office' }, // Side chair
  'FA-0011': { physX: 410, physY: 655, rotation: 270, user: 'MD Office Guest', zoneId: 'md_office' },

  // === RECOVERY TEAM OFFICE ("HRO chiry") ===
  'FA-0050': { physX: 275, physY: 740, rotation: 0, user: 'HRO (HR Officer)', zoneId: 'recovery_office' }, // HR Officer Desk
  'FA-0058': { physX: 275, physY: 715, rotation: 180, user: 'HRO (HR Officer)', zoneId: 'recovery_office' }, // HR Officer Chair
  'FA-0060': { physX: 275, physY: 768, rotation: 0, user: 'HRO Visitor', zoneId: 'recovery_office' }, // Visitor chair in front
  'FA-0055': { physX: 220, physY: 740, rotation: 0, user: 'Recovery Team', zoneId: 'recovery_office' }, // Side L-table
  'FA-0049': { physX: 200, physY: 740, rotation: 90, user: 'Recovery Team', zoneId: 'recovery_office' }, // Side chair
  'FA-0056': { physX: 360, physY: 755, rotation: 0, user: 'Recovery Staff 1', zoneId: 'recovery_office' }, // Connected Desk 1
  'FA-0059': { physX: 360, physY: 730, rotation: 180, user: 'Recovery Staff 1', zoneId: 'recovery_office' }, // Chair 1
  'FA-0057': { physX: 398, physY: 755, rotation: 0, user: 'Recovery Staff 2', zoneId: 'recovery_office' }, // Connected Desk 2
  'FA-0061': { physX: 398, physY: 730, rotation: 180, user: 'Recovery Staff 2', zoneId: 'recovery_office' }, // Chair 2
  'FA-0042': { physX: 436, physY: 755, rotation: 0, user: 'Recovery Staff 3', zoneId: 'recovery_office' }, // Connected Desk 3

  // === RECEPTION LOBBY ("guest chairs" & "<- 6 black chairs") ===
  'FA-0116': { physX: 630, physY: 252, rotation: 180, user: 'Ms. Mishel (Reception)', zoneId: 'reception' }, // Reception desk chair
  'FA-0124': { physX: 705, physY: 252, rotation: 180, user: 'Reception Staff', zoneId: 'reception' }, // Right desk chair
  'FA-0117': { physX: 580, physY: 415, rotation: 90, user: 'Guest Chair', zoneId: 'reception' }, // Guest Chair 1
  'FA-0118': { physX: 580, physY: 442, rotation: 90, user: 'Guest Chair', zoneId: 'reception' }, // Guest Chair 2
  'FA-0119': { physX: 690, physY: 435, rotation: 90, user: 'Guest Chair', zoneId: 'reception' }, // Waiting area chair
  // The 6 Black Chairs lined up along the right wall:
  'FA-0141': { physX: 735, physY: 330, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },
  'FA-0142': { physX: 735, physY: 355, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },
  'FA-0143': { physX: 735, physY: 380, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },
  'FA-0144': { physX: 735, physY: 405, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },
  'FA-0248': { physX: 735, physY: 430, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },
  'FA-0323': { physX: 735, physY: 455, rotation: 270, user: '6 Black Chairs (Lobby)', zoneId: 'reception' },

  // === GROUND OPERATIONS HALL (Main Office) ===
  // Left Vertical Desks
  'FA-0082': { physX: 245, physY: 260, rotation: 90, user: 'Mrs. Deepika', zoneId: 'main_office' }, // Vertical Desk 1 (Deepika)
  'FA-0084': { physX: 218, physY: 260, rotation: 90, user: 'Mrs. Deepika', zoneId: 'main_office' }, // Chair (Deepika)
  'FA-0083': { physX: 218, physY: 285, rotation: 90, user: 'Mrs. Deepika (Guest)', zoneId: 'main_office' },

  'FA-0148': { physX: 245, physY: 345, rotation: 90, user: 'Mrs. Ishara', zoneId: 'main_office' }, // Vertical Desk 2 (Ishara)
  'FA-0149': { physX: 218, physY: 345, rotation: 90, user: 'Mrs. Ishara', zoneId: 'main_office' }, // Chair (Ishara)
  'FA-0150': { physX: 218, physY: 370, rotation: 90, user: 'Mrs. Ishara (Guest)', zoneId: 'main_office' },

  'FA-0100': { physX: 250, physY: 425, rotation: 90, user: 'Ms Dilushi', zoneId: 'main_office' }, // Vertical Desk 3 (Dilushi)
  'FA-0101': { physX: 222, physY: 425, rotation: 90, user: 'Ms Dilushi', zoneId: 'main_office' }, // Chair (Dilushi)
  'FA-0102': { physX: 250, physY: 450, rotation: 90, user: 'Ms Dilushi (Printer Table)', zoneId: 'main_office' },

  'FA-0094': { physX: 235, physY: 480, rotation: 0, user: 'Ms. Narmada', zoneId: 'main_office' }, // Corner Desk 4 (Narmada)
  'FA-0095': { physX: 235, physY: 498, rotation: 0, user: 'Ms. Narmada', zoneId: 'main_office' }, // Chair (Narmada)

  // Top Desks (Lahiru & Chaminda)
  'FA-0072': { physX: 335, physY: 260, rotation: 0, user: 'Mr. Lahiru', zoneId: 'main_office' }, // Top Desk (Lahiru)
  'FA-0073': { physX: 335, physY: 238, rotation: 180, user: 'Mr. Lahiru', zoneId: 'main_office' }, // Chair (Lahiru)
  'FA-0074': { physX: 360, physY: 238, rotation: 180, user: 'Mr. Lahiru (Guest)', zoneId: 'main_office' },

  'FA-0079': { physX: 425, physY: 260, rotation: 0, user: 'Mr. Chaminda', zoneId: 'main_office' }, // Top Desk (Chaminda)
  'FA-0080': { physX: 425, physY: 238, rotation: 180, user: 'Mr. Chaminda', zoneId: 'main_office' }, // Chair (Chaminda)
  'FA-0081': { physX: 450, physY: 238, rotation: 180, user: 'Mr. Chaminda (Guest)', zoneId: 'main_office' },

  // Center Angled / Staggered Row Workstations
  'FA-0135': { physX: 305, physY: 365, rotation: 0, user: 'Mr. Anjitha', zoneId: 'main_office' }, // Station 1
  'FA-0136': { physX: 305, physY: 342, rotation: 180, user: 'Mr. Anjitha', zoneId: 'main_office' },

  'FA-0166': { physX: 345, physY: 375, rotation: 0, user: 'Ms. Sachini / Hiruni', zoneId: 'main_office' }, // Station 2
  'FA-0167': { physX: 345, physY: 352, rotation: 180, user: 'Ms. Sachini / Hiruni', zoneId: 'main_office' },

  'FA-0176': { physX: 385, physY: 385, rotation: 0, user: 'Ms. Mahima', zoneId: 'main_office' }, // Station 3
  'FA-0177': { physX: 385, physY: 362, rotation: 180, user: 'Ms. Mahima', zoneId: 'main_office' },

  'FA-0178': { physX: 425, physY: 395, rotation: 0, user: 'Ms. Lakshani', zoneId: 'main_office' }, // Station 4
  'FA-0179': { physX: 425, physY: 372, rotation: 180, user: 'Ms. Lakshani', zoneId: 'main_office' },

  // Lower Main Office Stations
  'FA-0182': { physX: 305, physY: 440, rotation: 0, user: 'Ms. Chalani', zoneId: 'main_office' },
  'FA-0187': { physX: 305, physY: 462, rotation: 0, user: 'Ms. Chalani', zoneId: 'main_office' },

  'FA-0160': { physX: 370, physY: 440, rotation: 0, user: 'Ms. Heshani', zoneId: 'main_office' },
  'FA-0161': { physX: 370, physY: 462, rotation: 0, user: 'Ms. Heshani', zoneId: 'main_office' },

  'FA-0488': { physX: 425, physY: 445, rotation: 0, user: 'Mr. Kalpana', zoneId: 'main_office' },
  'FA-0489': { physX: 425, physY: 468, rotation: 0, user: 'Mr. Kalpana', zoneId: 'main_office' },

  'FA-0092': { physX: 350, physY: 485, rotation: 0, user: 'Mr. Indika', zoneId: 'main_office' },
  'FA-0093': { physX: 350, physY: 502, rotation: 0, user: 'Mr. Indika', zoneId: 'main_office' },

  // === KITCHEN & DINING ===
  'FA-0213': { physX: 270, physY: 115, rotation: 0, user: 'Kitchen & Dining', zoneId: 'ground_dining' },
  'FA-0209': { physX: 270, physY: 92, rotation: 180, user: 'Dining Chair', zoneId: 'ground_dining' },
  'FA-0211': { physX: 270, physY: 138, rotation: 0, user: 'Dining Chair', zoneId: 'ground_dining' },
  'FA-0212': { physX: 246, physY: 115, rotation: 90, user: 'Dining Chair', zoneId: 'ground_dining' },
  'FA-0210': { physX: 294, physY: 115, rotation: 270, user: 'Dining Chair', zoneId: 'ground_dining' },
  'FA-0217': { physX: 340, physY: 115, rotation: 270, user: 'Kitchen Stool', zoneId: 'ground_dining' }
};

let updatedCount = 0;
data.assets = data.assets.map(asset => {
  if (positionMap[asset.id]) {
    const p = positionMap[asset.id];
    updatedCount++;
    return {
      ...asset,
      physX: p.physX,
      physY: p.physY,
      coordX: p.physX,
      coordY: p.physY,
      rotation: p.rotation,
      user: p.user || asset.user,
      zoneId: p.zoneId || asset.zoneId
    };
  }
  return asset;
});

fs.writeFileSync('./src/data/chilawFixedAssetsData.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated', updatedCount, 'Ground Floor assets to match user drawing!');
