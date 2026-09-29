import initialData from '../data/chilawFixedAssetsData.json';

const STORAGE_KEY = 'kmn_chilaw_fixed_assets_v3';
const STORAGE_ZONES_KEY = 'kmn_chilaw_fa_zones_v3';

class FixedAssetService {
  constructor() {
    this.listeners = new Set();
    this.assets = [];
    this.zones = initialData.zones || {};
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.assets = JSON.parse(stored);
      } else {
        this.assets = initialData.assets || [];
        this.save();
      }

      const storedZones = localStorage.getItem(STORAGE_ZONES_KEY);
      if (storedZones) {
        this.zones = JSON.parse(storedZones);
      } else {
        this.zones = initialData.zones || {};
      }
    } catch (e) {
      console.warn('Failed to load fixed assets from storage, using default data:', e);
      this.assets = initialData.assets || [];
      this.zones = initialData.zones || {};
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assets));
      localStorage.setItem(STORAGE_ZONES_KEY, JSON.stringify(this.zones));
    } catch (e) {
      console.error('Failed to save fixed assets to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.assets);
      } catch (err) {
        console.error('FixedAssetService notification error:', err);
      }
    }
  }

  getAssets() {
    return [...this.assets];
  }

  getAssetById(id) {
    return this.assets.find(a => a.id === id || a.tagNumber === id) || null;
  }

  getZones() {
    return { ...this.zones };
  }

  getSummary() {
    const total = this.assets.length;
    const chairs = this.assets.filter(a => a.isChair).length;
    const tables = this.assets.filter(a => a.keyword === 'Table & Desk').length;
    const computers = this.assets.filter(a => a.category === 'Computers & IT').length;
    const officeEq = this.assets.filter(a => a.category === 'Office Equipment').length;
    const labEq = this.assets.filter(a => a.category === 'Lab Equipment').length;
    const cctv = this.assets.filter(a => a.category === 'CCTV & Security').length;
    const acUnits = this.assets.filter(a => a.category === 'Air Conditioners').length;
    const storageRacks = this.assets.filter(a => a.keyword === 'Storage & Racks').length;

    const groundFloor = this.assets.filter(a => a.floor === 'Ground Floor').length;
    const firstFloor = this.assets.filter(a => a.floor === '1st Floor').length;
    const offSite = this.assets.filter(a => a.isOffSite).length;

    const usable = this.assets.filter(a => a.condition === 'Usable' || a.condition === 'New').length;
    const damaged = this.assets.filter(a => a.condition === 'Damaged' || a.condition === 'Needs Repair').length;

    return {
      total,
      chairs,
      tables,
      computers,
      officeEq,
      labEq,
      cctv,
      acUnits,
      storageRacks,
      groundFloor,
      firstFloor,
      offSite,
      usable,
      damaged
    };
  }

  updateAsset(id, updates) {
    const index = this.assets.findIndex(a => a.id === id);
    if (index === -1) return null;

    const current = this.assets[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If room or zone changed, adjust coordinates
    if (updates.zoneId && updates.zoneId !== current.zoneId && this.zones[updates.zoneId]) {
      const newZone = this.zones[updates.zoneId];
      updated.zoneName = newZone.name;
      updated.floor = newZone.floor;
      updated.isOffSite = !!newZone.isOffSite;
      if (newZone.centerX) {
        updated.coordX = newZone.centerX + (Math.floor(Math.random() * 20) - 10);
        updated.coordY = newZone.centerY + (Math.floor(Math.random() * 20) - 10);
      }
    }

    this.assets[index] = updated;
    this.save();
    return updated;
  }

  detectZoneForCoordinates(floor, x, y) {
    const isGround = !floor || floor.includes('Ground') || floor.includes('GF');
    for (const [zId, zone] of Object.entries(this.zones)) {
      if (zone.bounds) {
        const matchesFloor = isGround ? zone.floor === 'Ground Floor' : (zone.floor === '1st Floor' || zId === 'chilaw_lab');
        if (matchesFloor) {
          const { minX, maxX, minY, maxY } = zone.bounds;
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return zone;
          }
        }
      }
    }
    return isGround ? this.zones.main_office : this.zones.nadun_lobby;
  }

  updatePosition(id, physX, physY, rotation = null) {
    const asset = this.getAssetById(id);
    if (!asset) return null;

    const detectedZone = this.detectZoneForCoordinates(asset.floor, physX, physY);

    const updates = {
      physX: Math.round(physX),
      physY: Math.round(physY),
      coordX: Math.round(physX),
      coordY: Math.round(physY)
    };

    if (rotation !== null && rotation !== undefined) {
      updates.rotation = rotation;
    }

    if (detectedZone && detectedZone.zoneId !== asset.zoneId) {
      updates.zoneId = detectedZone.zoneId;
      updates.zoneName = detectedZone.name;
      updates.locationName = detectedZone.name;
    }

    return this.updateAsset(id, updates);
  }

  saveBulkPositions(positionsMap) {
    let changedCount = 0;
    this.assets = this.assets.map(asset => {
      if (positionsMap[asset.id]) {
        const p = positionsMap[asset.id];
        changedCount++;
        const detectedZone = this.detectZoneForCoordinates(asset.floor, p.physX, p.physY);
        return {
          ...asset,
          physX: Math.round(p.physX),
          physY: Math.round(p.physY),
          coordX: Math.round(p.physX),
          coordY: Math.round(p.physY),
          rotation: p.rotation !== undefined ? p.rotation : (asset.rotation || 0),
          zoneId: detectedZone ? detectedZone.zoneId : asset.zoneId,
          zoneName: detectedZone ? detectedZone.name : asset.zoneName,
          locationName: detectedZone ? detectedZone.name : asset.locationName,
          updatedAt: new Date().toISOString()
        };
      }
      return asset;
    });

    if (changedCount > 0) {
      this.save();
    }
    return changedCount;
  }

  logTransfer(id, { toZoneId, newCustodian, reason, authorizedBy }) {
    const asset = this.getAssetById(id);
    if (!asset) return null;

    const targetZone = this.zones[toZoneId] || { name: toZoneId, floor: 'Ground Floor' };
    const transferEntry = {
      date: new Date().toISOString().split('T')[0],
      fromLocation: asset.zoneName || asset.locationName,
      toLocation: targetZone.name,
      custodian: newCustodian || asset.user,
      reason: reason || 'Internal asset reallocation',
      authorizedBy: authorizedBy || 'Operations / IT Dept'
    };

    const newTransferHistory = [transferEntry, ...(asset.transferHistory || [])];

    return this.updateAsset(id, {
      zoneId: toZoneId,
      zoneName: targetZone.name,
      locationName: targetZone.name,
      floor: targetZone.floor,
      user: newCustodian || asset.user,
      isOffSite: !!targetZone.isOffSite,
      transferHistory: newTransferHistory
    });
  }

  addAsset(assetData) {
    const newId = `FA-${String(this.assets.length + 1).padStart(4, '0')}`;
    const zone = this.zones[assetData.zoneId] || this.zones.main_office;

    const newAsset = {
      id: newId,
      tagNumber: assetData.tagNumber || `KMN/CH/FA/${String(this.assets.length + 1).padStart(4, '0')}`,
      verified2026: assetData.verified2026 || '',
      verified2025: '',
      verified2024: '',
      verified2023: '',
      verified2022: '',
      dateOfPurchase: assetData.dateOfPurchase || new Date().toISOString().split('T')[0],
      itemName: assetData.itemName || 'New Asset',
      keyword: assetData.keyword || 'Furniture',
      category: assetData.category || 'Furniture & Fittings',
      description: assetData.description || '',
      purchasedBy: assetData.purchasedBy || '',
      brand: assetData.brand || '',
      serialNo: assetData.serialNo || '',
      model: assetData.model || '',
      user: assetData.user || 'Common',
      locationName: zone.name,
      zoneId: zone.zoneId,
      zoneName: zone.name,
      floor: zone.floor,
      coordX: zone.centerX || 380,
      coordY: zone.centerY || 280,
      condition: assetData.condition || 'New',
      amount: assetData.amount || '-',
      remarks: assetData.remarks || '',
      isOffSite: !!zone.isOffSite,
      isChair: (assetData.keyword === 'Chair' || (assetData.itemName || '').toLowerCase().includes('chair')),
      auditTimeline: [
        {
          auditCycle: '2026/08',
          tagNumber: assetData.tagNumber || newId,
          date: new Date().toISOString().split('T')[0],
          status: 'Newly Registered',
          location: zone.name,
          verifiedBy: 'IT System Admin'
        }
      ],
      transferHistory: []
    };

    this.assets.unshift(newAsset);
    this.save();
    return newAsset;
  }

  deleteAsset(id) {
    const idx = this.assets.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.assets.splice(idx, 1);
    this.save();
    return true;
  }

  resetToExcelDefaults() {
    this.assets = initialData.assets || [];
    this.zones = initialData.zones || {};
    this.save();
    return this.assets;
  }
}

export const fixedAssetService = new FixedAssetService();
export default fixedAssetService;
