import React, { useState } from 'react';
import { DollarSign, Plus, Search, Filter, FileText } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { invoiceService } from '../../services/invoiceService';
import { formatDisplayDate } from '../../utils/dateUtils';
import ExpenseModal from './ExpenseModal';
import InvoiceViewerModal from '../Invoices/InvoiceViewerModal';

export default function ExpensesView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const expenses = expenseService.getExpenses(filter);
  const summary = expenseService.getFinancialSummary();

  const handleOpenInvoice = (invRef) => {
    if (!invRef) return;
    const allInvoices = invoiceService.getInvoices();
    const inv = allInvoices.find(i => i.InvoiceID === invRef || i.InvoiceNumber === invRef);
    if (inv) {
      setSelectedInvoice(inv);
    } else {
      setSelectedInvoice({
        InvoiceID: invRef,
        InvoiceNumber: invRef,
        Supplier: 'Vendor',
        Amount: 0,
        InvoiceDate: '2026-09-01',
        FileName: `${invRef}.pdf`,
        FilePath: `/invoices/${invRef}.pdf`,
        Description: `Invoice Reference ${invRef}`
      });
    }
    setIsInvoiceModalOpen(true);
  };

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
                    <td><span className="font-mono text-sm">{formatDisplayDate(e.ExpenseDate)}</span></td>
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
                      {e.InvoiceNumber || e.InvoiceID ? (
                        <button 
                          type="button" 
                          className="invoice-clickable-btn"
                          title="View Verified PDF Bill / Invoice"
                          onClick={() => handleOpenInvoice(e.InvoiceNumber || e.InvoiceID)}
                        >
                          <FileText size={12} /> {e.InvoiceNumber || e.InvoiceID}
                        </button>
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

      {/* Invoice Viewer Modal */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
