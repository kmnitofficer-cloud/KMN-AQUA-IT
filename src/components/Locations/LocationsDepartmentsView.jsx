import React, { useState } from 'react';
import { MapPin, Building, Laptop, Users } from 'lucide-react';
import { dbRepository } from '../../services/dbRepository';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';

export default function LocationsDepartmentsView() {
  const locations = dbRepository.getTable('Locations');
  const departments = dbRepository.getTable('Departments');
  const allAssets = assetService.getAssets('All');
  const allUsers = userService.getUsers('All');

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Office Locations & Departmental Structure</h2>
          <p className="text-muted">
            Organizational layout of physical branches, storage centers, and functional departments across KMN Aqua Services.
          </p>
        </div>
      </div>

      {/* Locations Section */}
      <div className="section-title mt-2 mb-4">
        <h3>Physical Facilities & Branch Locations</h3>
      </div>
      <div className="locations-grid">
        {locations.map(loc => {
          const locAssets = allAssets.filter(a => a.CurrentLocationID === loc.LocationID);
          const locUsers = allUsers.filter(u => u.OfficeLocationID === loc.LocationID);

          return (
            <div key={loc.LocationID} className="location-card">
              <div className="location-card-header">
                <div className="location-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-base">{loc.OfficeName}</h4>
                  <span className="text-xs text-muted font-mono">{loc.LocationID} • {loc.Building} ({loc.Floor})</span>
                </div>
              </div>
              <p className="location-desc">{loc.Description}</p>
              <div className="location-stats">
                <div className="flex items-center gap-1.5">
                  <Laptop size={14} className="text-primary" />
                  <span className="text-xs font-semibold">{locAssets.length} Assets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  <span className="text-xs font-semibold">{locUsers.length} Staff Members</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Departments Section */}
      <div className="section-title mt-8 mb-4">
        <h3>Functional Corporate Departments</h3>
      </div>
      <div className="departments-grid">
        {departments.map(dept => {
          const deptUsers = allUsers.filter(u => u.DepartmentID === dept.DepartmentID);

          return (
            <div key={dept.DepartmentID} className="dept-card">
              <div className="dept-card-header">
                <Building size={18} className="text-primary" />
                <h4 className="font-semibold">{dept.DepartmentName}</h4>
              </div>
              <span className="text-xs text-muted font-mono mb-2 block">{dept.DepartmentID}</span>
              <p className="text-xs text-muted mb-3">{dept.Description}</p>
              <div className="dept-footer">
                <span className="badge badge-neutral">{deptUsers.length} Staff Enrolled</span>
                <span className="badge badge-success">{dept.Status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
