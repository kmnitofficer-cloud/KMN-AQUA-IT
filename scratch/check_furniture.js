import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./src/data/chilawFixedAssetsData.json', 'utf8'));
const gf = data.assets.filter(a => a.floor === 'Ground Floor');

const zones = ['md_office', 'recovery_office', 'reception', 'main_office', 'ground_dining', 'stationary_room', 'fish_tank', 'stores'];

zones.forEach(z => {
  const inZone = gf.filter(a => a.zoneId === z && (a.isChair || a.keyword === 'Table & Desk'));
  console.log('\n=== ZONE:', z, 'count:', inZone.length);
  inZone.forEach(a => {
    console.log('  [' + a.id + '] ' + a.itemName + ' | User: ' + (a.user || 'None') + ' | isChair: ' + a.isChair + ' | pos: (' + a.physX + ', ' + a.physY + ') rot: ' + a.rotation);
  });
});
