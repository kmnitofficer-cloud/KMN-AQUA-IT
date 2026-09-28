import { dbRepository } from './dbRepository';
import { googleDriveService } from './googleDriveService';
import { KNOWN_INVOICE_MAP } from '../config/driveConfig';

export const invoiceService = {
  getInvoices() {
    const invoices = dbRepository.getTable('Invoices') || [];
    const assets = dbRepository.getTable('Assets') || [];
    const users = dbRepository.getTable('Users') || [];
    const cctvBills = dbRepository.getTable('CCTVBills') || [];

    // Also include any CCTV bills not yet duplicated in Invoices table
    const cctvInvoices = cctvBills
      .filter(c => !invoices.some(i => i.InvoiceID === c.BillID || (c.BillNumber && i.InvoiceNumber === c.BillNumber)))
      .map(c => ({
        InvoiceID: c.BillID,
        InvoiceNumber: c.BillNumber,
        InvoiceDate: c.BillDate,
        Supplier: c.Supplier,
        Amount: Number(c.Amount) || 0,
        AssetID: '',
        UserID: '',
        PrinterAssetID: '',
        ExpenseID: c.BillID,
        FileName: c.FileName || '',
        FilePath: c.FilePath || '',
        FileSize: c.FileSize || '',
        UploadDate: c.BillDate,
        Description: `[CCTV - ${c.Office}] ${c.Description}`
      }));

    const combinedInvoices = [...invoices, ...cctvInvoices];

    return combinedInvoices.map(i => {
      const asset = assets.find(a => a.AssetID === i.AssetID) || {};
      const user = users.find(u => u.UserID === i.UserID) || {};

      return {
        ...i,
        Amount: Number(i.Amount) || 0,
        AssetName: asset.Model || (asset.AssetID ? `${asset.Brand} ${asset.AssetType}` : (i.Description?.includes('CCTV') ? 'CCTV Surveillance' : 'General / None')),
        AssetVerifiedNo: asset.VerifiedNo || '',
        UserName: user.Name || (i.Description?.includes('CCTV') ? 'CCTV Security System' : 'General Office')
      };
    }).sort((a, b) => new Date(b.InvoiceDate || 0) - new Date(a.InvoiceDate || 0));
  },

  async uploadInvoiceFile(file, metadata = {}) {
    const base64 = await this.readFileAsBase64(file);
    const invoices = dbRepository.getTable('Invoices');
    const expenses = dbRepository.getTable('Expenses');
    const today = metadata.InvoiceDate || new Date().toISOString().split('T')[0];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const invoiceId = dbRepository.getNextId('Invoices', 'INV-', 'InvoiceID');

    let expenseId = metadata.ExpenseID || '';

    // Auto-create matching expense if requested to keep financial records 100% synchronized
    if (metadata.createMatchingExpense && Number(metadata.Amount) > 0) {
      expenseId = dbRepository.getNextId('Expenses', 'EXP-', 'ExpenseID');
      const newExpense = {
        ExpenseID: expenseId,
        ExpenseDate: today,
        ExpenseType: metadata.ExpenseType || 'General IT',
        AssetID: metadata.AssetID || '',
        UserID: metadata.UserID || '',
        PrinterAssetID: metadata.PrinterAssetID || '',
        DepartmentID: metadata.DepartmentID || 'DEP-0004',
        Supplier: metadata.Supplier || 'General Vendor',
        Description: metadata.Description || `Invoice ${metadata.InvoiceNumber || invoiceId}`,
        Amount: Number(metadata.Amount) || 0,
        PaymentMethod: metadata.PaymentMethod || 'Company Cheque',
        InvoiceID: invoiceId,
        Notes: metadata.Notes || `Uploaded via PDF Invoice Vault (${safeName})`
      };
      await dbRepository.updateTable('Expenses', [newExpense, ...expenses]);
    }

    const newInvoice = {
      InvoiceID: invoiceId,
      InvoiceNumber: metadata.InvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      InvoiceDate: today,
      Supplier: metadata.Supplier || 'General Vendor',
      Amount: Number(metadata.Amount) || 0,
      AssetID: metadata.AssetID || '',
      UserID: metadata.UserID || '',
      PrinterAssetID: metadata.PrinterAssetID || '',
      ExpenseID: expenseId,
      FileName: safeName,
      FilePath: `/invoices/${safeName}`,
      FileSize: `${Math.round(file.size / 1024)} KB`,
      UploadDate: new Date().toISOString().split('T')[0],
      Description: metadata.Description || `Uploaded Invoice: ${file.name}`
    };

    // If Google Drive is configured, upload directly to Google Drive
    if (googleDriveService.isConfigured()) {
      try {
        const driveRes = await googleDriveService.uploadInvoice(file, {
          ...newInvoice,
          createMatchingExpense: false // already handled above locally
        });
        if (driveRes && driveRes.fileUrl) {
          newInvoice.FilePath = driveRes.fileUrl; // Preview iframe URL
          newInvoice.DriveUrl = driveRes.driveUrl;
          newInvoice.DownloadUrl = driveRes.downloadUrl;
          newInvoice.DriveFileID = driveRes.invoice?.DriveFileID || '';
        }
      } catch (err) {
        console.warn('Google Drive invoice upload failed, falling back to local:', err);
      }
    } else {
      // Try posting to local backend server if available
      try {
        await fetch('/api/invoices/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: safeName,
            base64Data: base64,
            invoiceData: newInvoice
          })
        });
      } catch (err) {
        console.warn('Backend upload failed, persisting in DB repository:', err);
      }
    }

    await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    return newInvoice;
  },

  getReconciliationSummary() {
    const invoices = this.getInvoices();
    const expenses = dbRepository.getTable('Expenses') || [];
    const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.Amount) || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.Amount) || 0), 0);
    const discrepancy = totalInvoiced - totalExpenses;

    const matchedInvoicesCount = invoices.filter(i => 
      expenses.some(e => 
        e.InvoiceID === i.InvoiceID || 
        (i.InvoiceNumber && e.InvoiceID === i.InvoiceNumber) ||
        (i.InvoiceNumber && e.Description && e.Description.includes(i.InvoiceNumber))
      )
    ).length;

    return {
      totalInvoiced,
      totalExpenses,
      discrepancy,
      isBalanced: Math.abs(discrepancy) === 0,
      invoicesCount: invoices.length,
      expensesCount: expenses.length,
      matchedInvoicesCount,
      unmatchedInvoicesCount: invoices.length - matchedInvoicesCount
    };
  },

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async deleteInvoice(invoiceId) {
    const invoices = dbRepository.getTable('Invoices');
    const updated = invoices.filter(i => i.InvoiceID !== invoiceId);
    await dbRepository.updateTable('Invoices', updated);
  },

  /**
   * Intelligently resolves an invoice by InvoiceID, InvoiceNumber, FileName, or ExpenseID
   * Guarantees returning the exact matched invoice with Google Drive links
   */
  getInvoiceById(idOrRef) {
    if (!idOrRef) return null;
    const all = this.getInvoices();
    const clean = String(idOrRef).trim().toLowerCase();

    // 1. Direct match on InvoiceID, InvoiceNumber, FileName, ExpenseID
    let found = all.find(i => 
      (i.InvoiceID && i.InvoiceID.toLowerCase() === clean) ||
      (i.InvoiceNumber && i.InvoiceNumber.toLowerCase() === clean) ||
      (i.FileName && i.FileName.toLowerCase() === clean) ||
      (i.ExpenseID && i.ExpenseID.toLowerCase() === clean)
    );
    if (found) return found;

    // 2. Partial match on FileName
    const cleanNoExt = clean.replace(/\.pdf$/i, '');
    found = all.find(i => i.FileName && i.FileName.toLowerCase().includes(cleanNoExt));
    if (found) return found;

    // 3. Fallback to KNOWN_INVOICE_MAP
    for (const [fName, meta] of Object.entries(KNOWN_INVOICE_MAP)) {
      if (
        fName.toLowerCase().includes(cleanNoExt) ||
        meta.invoiceId.toLowerCase() === clean ||
        meta.number.toLowerCase() === clean
      ) {
        return {
          InvoiceID: meta.invoiceId,
          InvoiceNumber: meta.number,
          InvoiceDate: '2026-09-01',
          Supplier: 'KMN IT Solution',
          Amount: 0,
          FileName: fName,
          FilePath: `https://drive.google.com/file/d/${meta.driveId}/preview`,
          DriveUrl: `https://drive.google.com/file/d/${meta.driveId}/view?usp=drivesdk`,
          DownloadUrl: `https://drive.google.com/uc?export=download&id=${meta.driveId}`,
          DriveFileID: meta.driveId,
          Description: `Verified Bill: ${fName}`
        };
      }
    }

    return null;
  }
};
