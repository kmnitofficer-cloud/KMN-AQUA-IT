import React, { useState } from 'react';
import { DollarSign, Plus, Search, Filter, FileText } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import ExpenseModal from './ExpenseModal';

export default function ExpensesView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const expenses = expenseService.getExpenses(filter);
  const summary = expenseService.getFinancialSummary();

  const filteredExpenses = expenses.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.Description && e.Description.toLowerCase().includes(q)) ||
      (e.Supplier && e.Supplier.toLowerCase().includes(q)) ||
      (e.ExpenseType && e.ExpenseType.toLowerCase().includes(q)) ||
      (e.UserName && e.UserName.toLowerCase().includes(q)) ||
      (e.AssetName && e.AssetName.toLowerCase().includes(q)) ||
      (e.InvoiceNumber && e.InvoiceNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>IT Expense & Cost Accounting</h2>
          <p className="text-muted">
            Tracking every hardware purchase, repair charge, consumable transaction, and vendor payment with strict relational attribution.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="stats-kpi-grid mb-6">
        <div className="kpi-card">
          <span className="kpi-title">Total IT Expenses</span>
          <div className="kpi-value text-emerald">Rs. {summary.totalExpenses.toLocaleString()}</div>
          <span className="text-muted text-xs">{summary.count} recorded entries</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Repair Expenditures</span>
          <div className="kpi-value text-amber">Rs. {summary.repairExpenses.toLocaleString()}</div>
          <span className="text-muted text-xs">Services & maintenance</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Toner & Consumables</span>
          <div className="kpi-value text-cyan">Rs. {summary.consumableExpenses.toLocaleString()}</div>
          <span className="text-muted text-xs">Printer cartridges</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Current Year Total</span>
          <div className="kpi-value text-violet">Rs. {summary.currentYearExpenses.toLocaleString()}</div>
          <span className="text-muted text-xs">Fiscal period</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {['All', 'Asset', 'User', 'Printer', 'General'].map(tab => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'All' ? 'All Expenses' : `By ${tab}`}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search description, payee, invoice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Attributed Entity</th>
                <th>Payee / Supplier</th>
                <th>Payment Method</th>
                <th>Amount (LKR)</th>
                <th>Invoice Ref</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.ExpenseID}>
                    <td><span className="id-pill">{e.ExpenseID}</span></td>
                    <td>{e.ExpenseDate}</td>
                    <td><span className="type-badge">{e.ExpenseType}</span></td>
                    <td><strong className="text-primary">{e.Description}</strong></td>
                    <td>
                      <div>
                        {e.AssetName && <div className="text-xs font-medium text-cyan">{e.AssetName} ({e.AssetVerifiedNo})</div>}
                        {e.UserName && e.UserName !== 'General Office' && (
                          <div className="text-xs text-muted">Staff: {e.UserName}</div>
                        )}
                        {!e.AssetName && (!e.UserName || e.UserName === 'General Office') && (
                          <span className="text-xs text-muted">General Office</span>
                        )}
                      </div>
                    </td>
                    <td>{e.Supplier}</td>
                    <td><span className="text-xs">{e.PaymentMethod}</span></td>
                    <td><strong className="text-emerald">Rs. {Number(e.Amount).toLocaleString()}</strong></td>
                    <td>
                      {e.InvoiceNumber ? (
                        <span className="tag-pill font-mono text-xs">{e.InvoiceNumber}</span>
                      ) : (
                        <span className="text-muted text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
