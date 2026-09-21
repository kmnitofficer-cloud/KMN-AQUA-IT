import { dbRepository } from './dbRepository';

export const assignmentService = {
  getAssignments() {
    const assignments = dbRepository.getTable('Assignments');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const locations = dbRepository.getTable('Locations');

    return assignments.map(asgn => {
      const asset = assets.find(a => a.AssetID === asgn.AssetID) || {};
      const user = users.find(u => u.UserID === asgn.UserID) || {};
      const loc = locations.find(l => l.LocationID === asgn.LocationID) || {};

      return {
        ...asgn,
        AssetType: asset.AssetType || 'Device',
        Brand: asset.Brand || '',
        Model: asset.Model || '',
        VerifiedNo: asset.VerifiedNo || '',
        UserName: user.Name || 'Unassigned / Storage',
        LocationName: loc.OfficeName || 'General Office'
      };
    }).sort((a, b) => new Date(b.AssignedDate || 0) - new Date(a.AssignedDate || 0));
  },

  async reassignAsset({
    assetId,
    toUserId,
    locationId,
    reason = 'Reassigned',
    conditionWhenAssigned = 'Good',
    conditionWhenReturned = 'Good',
    notes = ''
  }) {
    const today = new Date().toISOString().split('T')[0];
    const assignments = dbRepository.getTable('Assignments');
    const assets = dbRepository.getTable('Assets');

    // 1. Close any currently active assignment for this asset
    const updatedAssignments = assignments.map(a => {
      if (a.AssetID === assetId && a.AssignmentStatus === 'Current') {
        return {
          ...a,
          ReturnedDate: today,
          AssignmentStatus: 'Returned',
          ConditionWhenReturned: conditionWhenReturned || a.ConditionWhenAssigned,
          Notes: `${a.Notes || ''} [Closed on reassignment: ${reason}]`.trim()
        };
      }
      return a;
    });

    // 2. Add the new Assignment record
    const nextNum = assignments.length + 1;
    const newAssignment = {
      AssignmentID: `ASN-${String(nextNum).padStart(4, '0')}`,
      AssetID: assetId,
      UserID: toUserId || '',
      LocationID: locationId || 'LOC-0001',
      AssignedDate: today,
      ReturnedDate: '',
      AssignmentStatus: 'Current',
      Reason: reason,
      ConditionWhenAssigned: conditionWhenAssigned,
      ConditionWhenReturned: '',
      Notes: notes
    };
    updatedAssignments.unshift(newAssignment);

    // 3. Update the Asset record
    const updatedAssets = assets.map(ast => {
      if (ast.AssetID === assetId) {
        return {
          ...ast,
          CurrentUserID: toUserId || '',
          CurrentLocationID: locationId || ast.CurrentLocationID,
          Status: toUserId ? 'Assigned' : 'Available'
        };
      }
      return ast;
    });

    await dbRepository.updateTable('Assignments', updatedAssignments);
    await dbRepository.updateTable('Assets', updatedAssets);
    return newAssignment;
  },

  async returnAsset({
    assetId,
    locationId = 'LOC-0004',
    reason = 'Returned to Storage',
    conditionWhenReturned = 'Working',
    notes = ''
  }) {
    const today = new Date().toISOString().split('T')[0];
    const assignments = dbRepository.getTable('Assignments');
    const assets = dbRepository.getTable('Assets');

    // 1. Close active assignment
    const updatedAssignments = assignments.map(a => {
      if (a.AssetID === assetId && a.AssignmentStatus === 'Current') {
        return {
          ...a,
          ReturnedDate: today,
          AssignmentStatus: 'Returned',
          ConditionWhenReturned: conditionWhenReturned,
          Notes: `${a.Notes || ''} [${reason}]`.trim()
        };
      }
      return a;
    });

    // 2. Update asset status to Available / In Storage
    const updatedAssets = assets.map(ast => {
      if (ast.AssetID === assetId) {
        return {
          ...ast,
          CurrentUserID: '',
          CurrentLocationID: locationId,
          Status: conditionWhenReturned.toLowerCase().includes('fault') || conditionWhenReturned.toLowerCase().includes('defect')
            ? 'Under Repair'
            : 'In Storage'
        };
      }
      return ast;
    });

    await dbRepository.updateTable('Assignments', updatedAssignments);
    await dbRepository.updateTable('Assets', updatedAssets);
  }
};
