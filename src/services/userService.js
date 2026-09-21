import { dbRepository } from './dbRepository';

export const userService = {
  getUsers(filter = 'All') {
    const users = dbRepository.getTable('Users');
    if (filter === 'Active') return users.filter(u => u.Status === 'Active');
    if (filter === 'Inactive') return users.filter(u => u.Status === 'Inactive');
    return users;
  },

  getUserById(userId) {
    const users = dbRepository.getTable('Users');
    return users.find(u => u.UserID === userId) || null;
  },

  getUserCurrentAssets(userId) {
    const assets = dbRepository.getTable('Assets');
    return assets.filter(a => a.CurrentUserID === userId);
  },

  getUserAssignmentHistory(userId) {
    const assignments = dbRepository.getTable('Assignments');
    const assets = dbRepository.getTable('Assets');
    const userAssignments = assignments.filter(a => a.UserID === userId);

    return userAssignments.map(asgn => {
      const asset = assets.find(a => a.AssetID === asgn.AssetID) || {};
      return {
        ...asgn,
        AssetType: asset.AssetType || 'Device',
        Brand: asset.Brand || '',
        Model: asset.Model || '',
        VerifiedNo: asset.VerifiedNo || ''
      };
    }).sort((a, b) => new Date(b.AssignedDate || 0) - new Date(a.AssignedDate || 0));
  },

  getUserCosts(userId) {
    const currentAssets = this.getUserCurrentAssets(userId);
    const history = this.getUserAssignmentHistory(userId);
    const historicalAssetIds = new Set(history.map(h => h.AssetID));
    
    const repairs = dbRepository.getTable('Repairs');
    const expenses = dbRepository.getTable('Expenses');

    // 1. Direct expenses assigned to user
    const directExpenses = expenses
      .filter(e => e.UserID === userId)
      .reduce((sum, e) => sum + (Number(e.Amount) || 0), 0);

    // 2. Repairs incurred by user's assigned assets (current and historical)
    const repairCosts = repairs
      .filter(r => historicalAssetIds.has(r.AssetID))
      .reduce((sum, r) => sum + (Number(r.RepairCost) || 0), 0);

    // 3. Accessories costs (mice, keyboards, chargers, UPS)
    const accessoriesCost = currentAssets
      .filter(a => ['Mouse', 'Keyboard', 'UPS', 'Accessory'].includes(a.AssetType))
      .reduce((sum, a) => sum + (Number(a.PurchaseCost) || 0), 0);

    const totalCost = directExpenses + repairCosts + accessoriesCost;

    return {
      currentAssetsCount: currentAssets.length,
      historicalAssetsCount: history.length,
      directExpenses,
      repairCosts,
      accessoriesCost,
      totalCost
    };
  },

  async saveUser(user) {
    const users = dbRepository.getTable('Users');
    let updated;

    if (user.UserID) {
      // Update existing
      updated = users.map(u => u.UserID === user.UserID ? { ...u, ...user } : u);
    } else {
      // Create new
      const nextNum = users.length + 1;
      const newId = `USR-${String(nextNum).padStart(4, '0')}`;
      const newEmpId = user.EmployeeID || `EMP-${String(nextNum).padStart(3, '0')}`;
      const newUser = {
        ...user,
        UserID: newId,
        EmployeeID: newEmpId,
        Status: user.Status || 'Active',
        JoinDate: user.JoinDate || new Date().toISOString().split('T')[0]
      };
      updated = [newUser, ...users];
    }

    await dbRepository.updateTable('Users', updated);
    return user;
  },

  async toggleStatus(userId) {
    const users = dbRepository.getTable('Users');
    const updated = users.map(u => {
      if (u.UserID === userId) {
        return {
          ...u,
          Status: u.Status === 'Active' ? 'Inactive' : 'Active',
          EndDate: u.Status === 'Active' ? new Date().toISOString().split('T')[0] : ''
        };
      }
      return u;
    });
    await dbRepository.updateTable('Users', updated);
  }
};
