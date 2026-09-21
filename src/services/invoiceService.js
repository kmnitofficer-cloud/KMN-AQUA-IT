import { dbRepository } from './dbRepository';

export const invoiceService = {
  getInvoices() {
    const invoices = dbRepository.getTable('Invoices');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');

    return invoices.map(i => {
      const asset = assets.find(a => a.AssetID === i.AssetID) || {};
      const user = users.find(u => u.UserID === i.UserID) || {};

      return {
        ...i,
        Amount: Number(i.Amount) || 0,
        AssetName: asset.Model || (asset.AssetID ? `${asset.Brand} ${asset.AssetType}` : 'General / None'),
        AssetVerifiedNo: asset.VerifiedNo || '',
        UserName: user.Name || 'General Office'
      };
    }).sort((a, b) => new Date(b.InvoiceDate || 0) - new Date(a.InvoiceDate || 0));
  },

  async uploadInvoiceFile(file, metadata = {}) {
    const base64 = await this.readFileAsBase64(file);
    const invoices = dbRepository.getTable('Invoices');
    const today = metadata.InvoiceDate || new Date().toISOString().split('T')[0];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nextNum = invoices.length + 1;
    const invoiceId = `INV-${String(nextNum).padStart(4, '0')}`;

    const newInvoice = {
      InvoiceID: invoiceId,
      InvoiceNumber: metadata.InvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      InvoiceDate: today,
      Supplier: metadata.Supplier || 'General Vendor',
      Amount: Number(metadata.Amount) || 0,
      AssetID: metadata.AssetID || '',
      UserID: metadata.UserID || '',
      PrinterAssetID: metadata.PrinterAssetID || '',
      ExpenseID: metadata.ExpenseID || '',
      FileName: safeName,
      FilePath: `/invoices/${safeName}`,
      FileSize: `${Math.round(file.size / 1024)} KB`,
      UploadDate: new Date().toISOString().split('T')[0],
      Description: metadata.Description || `Uploaded Invoice: ${file.name}`
    };

    // Try posting to backend server if available
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

    await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);
    return newInvoice;
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
  }
};
