import React, { useState } from 'react';
import { FileSpreadsheet, Download, Filter, Eye } from 'lucide-react';
import { reportService } from '../../services/reportService';

export default function ReportsView() {
  const reports = reportService.getAvailableReports();
  const [selectedReportId, setSelectedReportId] = useState('asset_register');

  const activeReportMeta = reports.find(r => r.id === selectedReportId) || reports[0];
  const reportData = reportService.generateReport(selectedReportId);

  const handleExport = () => {
    reportService.exportReportToExcel(selectedReportId);
  };

  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>IT Auditing & Management Reports</h2>
          <p className="text-muted">
            Formal registers, cost statements, and audit reports dynamically compiled from relational tables and ready for instant Excel export.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={handleExport} disabled={reportData.length === 0}>
            <Download size={16} /> Export to Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Reports Grid Selector */}
      <div className="reports-selector-grid">
        {reports.map(rep => (
          <div
            key={rep.id}
            className={`report-select-card ${selectedReportId === rep.id ? 'active' : ''}`}
            onClick={() => setSelectedReportId(rep.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet size={16} className={selectedReportId === rep.id ? 'text-primary' : 'text-muted'} />
              <span className="font-semibold text-sm">{rep.name}</span>
            </div>
            <p className="text-xs text-muted">{rep.description}</p>
          </div>
        ))}
      </div>

      {/* Report Data Preview Card */}
      <div className="table-card mt-6">
        <div className="table-card-header flex justify-between items-center p-4 border-b border-subtle">
          <div>
            <h3 className="text-base font-semibold">{activeReportMeta.name}</h3>
            <span className="text-xs text-muted">Generated {reportData.length} records</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExport} disabled={reportData.length === 0}>
            <Download size={14} /> Download (.xlsx)
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={headers.length || 1} className="text-center py-8 text-muted">
                    No data found for this report.
                  </td>
                </tr>
              ) : (
                reportData.slice(0, 100).map((row, idx) => (
                  <tr key={idx}>
                    {headers.map(h => {
                      const val = row[h];
                      const isNumber = typeof val === 'number';
                      return (
                        <td key={h} className={isNumber ? 'font-mono' : ''}>
                          {isNumber ? val.toLocaleString() : (val !== null && val !== undefined ? String(val) : '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
