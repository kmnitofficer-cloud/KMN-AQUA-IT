import React, { useState, useEffect } from 'react';
import { Search, X, User, Laptop, Printer, FileText, Wrench, ArrowRight } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { invoiceService } from '../../services/invoiceService';
import { printerService } from '../../services/printerService';
import { repairService } from '../../services/repairService';

export default function GlobalSearchModal({ isOpen, onClose, onSelectEntity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    users: [],
    assets: [],
    printers: [],
    invoices: [],
    repairs: []
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ users: [], assets: [], printers: [], invoices: [], repairs: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults({ users: [], assets: [], printers: [], invoices: [], repairs: [] });
      return;
    }

    // 1. Users
    const allUsers = userService.getUsers('All');
    const matchedUsers = allUsers.filter(u =>
      (u.Name && u.Name.toLowerCase().includes(q)) ||
      (u.EmployeeID && u.EmployeeID.toLowerCase().includes(q)) ||
      (u.Email && u.Email.toLowerCase().includes(q)) ||
      (u.JobTitle && u.JobTitle.toLowerCase().includes(q))
    ).slice(0, 5);

    // 2. Assets
    const allAssets = assetService.getAssets('All');
    const matchedAssets = allAssets.filter(a =>
      (a.AssetID && a.AssetID.toLowerCase().includes(q)) ||
      (a.VerifiedNo && a.VerifiedNo.toLowerCase().includes(q)) ||
      (a.Model && a.Model.toLowerCase().includes(q)) ||
      (a.Brand && a.Brand.toLowerCase().includes(q)) ||
      (a.SerialNumber && a.SerialNumber.toLowerCase().includes(q)) ||
      (a.Specifications && a.Specifications.toLowerCase().includes(q))
    ).slice(0, 5);

    // 3. Printers
    const allPrinters = printerService.getPrinters();
    const matchedPrinters = allPrinters.filter(p =>
      (p.PrinterName && p.PrinterName.toLowerCase().includes(q)) ||
      (p.IPAddress && p.IPAddress.toLowerCase().includes(q)) ||
      (p.TonerCartridgeModel && p.TonerCartridgeModel.toLowerCase().includes(q)) ||
      (p.VerifiedNo && p.VerifiedNo.toLowerCase().includes(q))
    ).slice(0, 5);

    // 4. Invoices
    const allInvoices = invoiceService.getInvoices();
    const matchedInvoices = allInvoices.filter(i =>
      (i.InvoiceNumber && i.InvoiceNumber.toLowerCase().includes(q)) ||
      (i.Supplier && i.Supplier.toLowerCase().includes(q)) ||
      (i.Description && i.Description.toLowerCase().includes(q)) ||
      (i.FileName && i.FileName.toLowerCase().includes(q))
    ).slice(0, 5);

    // 5. Repairs
    const allRepairs = repairService.getRepairs();
    const matchedRepairs = allRepairs.filter(r =>
      (r.ProblemDescription && r.ProblemDescription.toLowerCase().includes(q)) ||
      (r.ActionTaken && r.ActionTaken.toLowerCase().includes(q)) ||
      (r.RepairSupplier && r.RepairSupplier.toLowerCase().includes(q)) ||
      (r.PartsReplaced && r.PartsReplaced.toLowerCase().includes(q))
    ).slice(0, 5);

    setResults({
      users: matchedUsers,
      assets: matchedAssets,
      printers: matchedPrinters,
      invoices: matchedInvoices,
      repairs: matchedRepairs
    });
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.users.length +
    results.assets.length +
    results.printers.length +
    results.invoices.length +
    results.repairs.length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} className="text-muted" />
          <input
            type="text"
            className="search-modal-input"
            placeholder="Search users, asset tags (KMN/CH/...), serials, brands (Dell, Canon), IPs, invoices..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-btn" onClick={onClose} title="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="search-modal-body">
          {query.trim() === '' ? (
            <div className="search-hint">
              <p>Type to search across the entire relational IT database.</p>
              <div className="search-tags">
                <span onClick={() => setQuery('Dell')}>Dell</span>
                <span onClick={() => setQuery('Laptop')}>Laptop</span>
                <span onClick={() => setQuery('Canon')}>Canon</span>
                <span onClick={() => setQuery('KMN/CH/CP')}>KMN/CH/CP</span>
                <span onClick={() => setQuery('UPS')}>UPS</span>
                <span onClick={() => setQuery('Toner')}>Toner</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="search-empty">
              <p>No matching records found for "{query}".</p>
            </div>
          ) : (
            <div className="search-results-list">
              {/* Users */}
              {results.users.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <User size={14} /> Employees & Users ({results.users.length})
                  </div>
                  {results.users.map(u => (
                    <div
                      key={u.UserID}
                      className="search-item"
                      onClick={() => { onSelectEntity('user', u.UserID); onClose(); }}
                    >
                      <div className="search-item-info">
                        <span className="search-item-primary">{u.Name}</span>
                        <span className="search-item-secondary">{u.UserID} • {u.JobTitle} • {u.Status}</span>
                      </div>
                      <ArrowRight size={14} className="search-item-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Assets */}
              {results.assets.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <Laptop size={14} /> Hardware Assets ({results.assets.length})
                  </div>
                  {results.assets.map(a => (
                    <div
                      key={a.AssetID}
                      className="search-item"
                      onClick={() => { onSelectEntity('asset', a.AssetID); onClose(); }}
                    >
                      <div className="search-item-info">
                        <span className="search-item-primary">
                          <span className="text-cyan font-bold mr-1.5">[{a.AssetType}]</span>
                          {assetService.getCleanHardwareName(a)}
                        </span>
                        <span className="search-item-secondary">
                          Tag: <strong className="text-cyan">{a.VerifiedNo}</strong> • {a.AssetID} • Assigned: {a.AssignedUserName} • {a.Status}
                        </span>
                      </div>
                      <ArrowRight size={14} className="search-item-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Printers */}
              {results.printers.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <Printer size={14} /> Printers & Devices ({results.printers.length})
                  </div>
                  {results.printers.map(p => (
                    <div
                      key={p.PrinterID}
                      className="search-item"
                      onClick={() => { onSelectEntity('printer', p.PrinterID); onClose(); }}
                    >
                      <div className="search-item-info">
                        <span className="search-item-primary">{p.PrinterName}</span>
                        <span className="search-item-secondary">
                          IP: {p.IPAddress} • {p.LocationName} • Cartridge: {p.TonerCartridgeModel}
                        </span>
                      </div>
                      <ArrowRight size={14} className="search-item-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <FileText size={14} /> Bills & Invoices ({results.invoices.length})
                  </div>
                  {results.invoices.map(i => (
                    <div
                      key={i.InvoiceID}
                      className="search-item"
                      onClick={() => { onSelectEntity('invoice', i.InvoiceID); onClose(); }}
                    >
                      <div className="search-item-info">
                        <span className="search-item-primary">{i.InvoiceNumber} - {i.Supplier}</span>
                        <span className="search-item-secondary">
                          Rs. {Number(i.Amount).toLocaleString()} • {i.InvoiceDate} • {i.Description}
                        </span>
                      </div>
                      <ArrowRight size={14} className="search-item-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Repairs */}
              {results.repairs.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <Wrench size={14} /> Maintenance & Repairs ({results.repairs.length})
                  </div>
                  {results.repairs.map(r => (
                    <div
                      key={r.RepairID}
                      className="search-item"
                      onClick={() => { onSelectEntity('repair', r.RepairID); onClose(); }}
                    >
                      <div className="search-item-info">
                        <span className="search-item-primary">{r.ProblemDescription}</span>
                        <span className="search-item-secondary">
                          {r.RepairSupplier} • Rs. {Number(r.RepairCost).toLocaleString()} • {r.RepairDate} • {r.Status}
                        </span>
                      </div>
                      <ArrowRight size={14} className="search-item-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="search-modal-footer">
          <span>Press <strong>ESC</strong> to close</span>
          <span>Click any item to view complete relational profile</span>
        </div>
      </div>
    </div>
  );
}
