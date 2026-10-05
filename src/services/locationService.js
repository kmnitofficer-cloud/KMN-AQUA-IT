import { dbRepository } from './dbRepository.js';

const STORAGE_KEY = 'kmn_active_facility';

export const LOCATION_OPTIONS = [
  {
    id: 'All',
    label: 'All Facilities',
    shortLabel: 'All',
    icon: 'Building2',
    color: '#3B82F6',
    description: 'Chilaw HQ & Palawiya Branch'
  },
  {
    id: 'Chilaw',
    locationId: 'LOC-0001',
    label: 'Chilaw Office (HQ)',
    shortLabel: 'Chilaw',
    icon: 'MapPin',
    color: '#10B981',
    description: 'Headquarters & Main Operational Facility'
  },
  {
    id: 'Palawiya',
    locationId: 'LOC-0002',
    label: 'Palawiya Office (Branch)',
    shortLabel: 'Palawiya',
    icon: 'MapPin',
    color: '#06B6D4',
    description: 'Regional Branch & Hatchery Complex'
  }
];

class LocationService {
  constructor() {
    this.listeners = new Set();
    this.currentLocation = this.getInitialLocation();
  }

  getInitialLocation() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['All', 'Chilaw', 'Palawiya'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // Local storage unavailable
    }
    return 'All';
  }

  getSelectedLocation() {
    return this.currentLocation;
  }

  setSelectedLocation(location) {
    if (!['All', 'Chilaw', 'Palawiya'].includes(location)) {
      location = 'All';
    }
    this.currentLocation = location;
    try {
      localStorage.setItem(STORAGE_KEY, location);
    } catch (e) {}

    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.currentLocation);
      } catch (err) {
        console.error('Error in location listener:', err);
      }
    }
  }

  /**
   * Helper to check if a user belongs to the target location
   */
  matchesUser(user, targetLocation = this.currentLocation) {
    if (!user) return false;
    if (targetLocation === 'All') return true;

    const locId = user.OfficeLocationID || '';
    const locName = String(user.Office || user.LocationName || '').toLowerCase();

    if (targetLocation === 'Palawiya') {
      return (
        locId === 'LOC-0002' ||
        locName.includes('palawi') ||
        locName.includes('palavi')
      );
    }

    if (targetLocation === 'Chilaw') {
      // Chilaw includes LOC-0001 (HQ), LOC-0003 (HR Lobby), LOC-0004 (IT Store)
      return (
        locId === 'LOC-0001' ||
        locId === 'LOC-0003' ||
        locId === 'LOC-0004' ||
        (!locId && !locName.includes('palawi') && !locName.includes('palavi')) ||
        locName.includes('chilaw') ||
        locName.includes('hq')
      );
    }

    return true;
  }

  /**
   * Helper to check if an asset belongs to the target location
   */
  matchesAsset(asset, targetLocation = this.currentLocation, usersMap = null) {
    if (!asset) return false;
    if (targetLocation === 'All') return true;

    const locId = asset.CurrentLocationID || '';
    const locName = String(asset.LocationName || asset.office || '').toLowerCase();

    // Check if assigned user is in target location
    let userMatches = false;
    if (asset.CurrentUserID && asset.CurrentUserID !== 'SHARED_NETWORK') {
      let user = null;
      if (usersMap && usersMap[asset.CurrentUserID]) {
        user = usersMap[asset.CurrentUserID];
      } else {
        const allUsers = dbRepository.getTable('Users');
        user = allUsers.find(u => u.UserID === asset.CurrentUserID);
      }
      if (user) {
        userMatches = this.matchesUser(user, targetLocation);
      }
    }

    if (targetLocation === 'Palawiya') {
      return (
        locId === 'LOC-0002' ||
        locName.includes('palawi') ||
        locName.includes('palavi') ||
        userMatches
      );
    }

    if (targetLocation === 'Chilaw') {
      if (locId === 'LOC-0002' || locName.includes('palawi') || locName.includes('palavi')) {
        return false;
      }
      return (
        locId === 'LOC-0001' ||
        locId === 'LOC-0003' ||
        locId === 'LOC-0004' ||
        userMatches ||
        !locId
      );
    }

    return true;
  }

  /**
   * Helper to check if a CCTV bill belongs to the target location
   */
  matchesCCTV(bill, targetLocation = this.currentLocation) {
    if (!bill) return false;
    if (targetLocation === 'All') return true;

    const office = String(bill.Office || '').toLowerCase();
    const isSplit = office === 'split';

    if (targetLocation === 'Palawiya') {
      return (
        office === 'palawiya' ||
        office.includes('palawi') ||
        bill.LocationID === 'LOC-0002' ||
        (isSplit && Number(bill.PalawiyaAmount) > 0)
      );
    }

    if (targetLocation === 'Chilaw') {
      return (
        office === 'chilaw' ||
        bill.LocationID === 'LOC-0001' ||
        (isSplit && Number(bill.ChilawAmount) > 0)
      );
    }

    return true;
  }

  /**
   * Resolves default location ID to use when adding new records
   */
  getDefaultLocationId(targetLocation = this.currentLocation) {
    if (targetLocation === 'Palawiya') return 'LOC-0002';
    return 'LOC-0001';
  }

  /**
   * Resolves display name for a location ID
   */
  getLocationName(locationId) {
    if (locationId === 'LOC-0002') return 'Palawiya Office';
    if (locationId === 'LOC-0003') return 'HR Lobby';
    if (locationId === 'LOC-0004') return 'IT Store / Storage';
    return 'Chilaw Office';
  }
}

export const locationService = new LocationService();
export default locationService;
