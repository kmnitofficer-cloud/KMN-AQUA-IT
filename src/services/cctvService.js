import { dbRepository } from './dbRepository';

export const CCTV_OFFICES = [
  {
    OfficeID: 'chilaw',
    OfficeName: 'Chilaw Office',
    LocationID: 'LOC-0001',
    Building: 'Main Building',
    Floor: 'Ground Floor & Perimeter',
    NVRModel: '',
    ChannelsCount: 16,
    ActiveCameras: 16,
    Storage: '2TB Surveillance HDD (Seagate SkyHawk)',
    IPAddress: '',
    ConnectionType: '',
    Status: '',
    TechnicianContact: '',
    LastServiceDate: '2026-09-15',
    CoverageAreas: ''
  },
  {
    OfficeID: 'palawiya',
    OfficeName: 'Palawiya Office',
    LocationID: 'LOC-0002',
    Building: 'Palaviya Branch',
    Floor: '1st Floor & Compound',
    NVRModel: '',
    ChannelsCount: 8,
    ActiveCameras: 8,
    Storage: '',
    IPAddress: '',
    ConnectionType: '',
    Status: '',
    TechnicianContact: '',
    LastServiceDate: '',
    CoverageAreas: ''
  }
];

export const CCTV_BILL_CATEGORIES = [
  'Internet & Remote Access',
  'Hardware & Cameras',
  'Storage & HDD',
  'Maintenance & Servicing',
  'Installation & Wiring',
  'Power & UPS',
  'Annual Maintenance Contract (AMC)',
  'General / Other'
];

export const cctvService = {
  getOffices() {
    return CCTV_OFFICES;
  },

  getOfficeById(officeId) {
    return CCTV_OFFICES.find(o => o.OfficeID === officeId.toLowerCase() || o.OfficeName.toLowerCase().includes(officeId.toLowerCase())) || CCTV_OFFICES[0];
  },

  getCCTVBills(officeFilter = 'All', categoryFilter = 'All') {
    const rawBills = dbRepository.getTable('CCTVBills') || [];
    return rawBills
      .filter(b => {
        if (!b) return false;
        const isSplit = b.Office === 'Split';
        const matchesOffice =
          officeFilter === 'All' ||
          (b.Office && b.Office.toLowerCase() === officeFilter.toLowerCase()) ||
          (officeFilter === 'Chilaw' && (b.LocationID === 'LOC-0001' || (isSplit && Number(b.ChilawAmount) > 0))) ||
          (officeFilter === 'Palawiya' && (b.LocationID === 'LOC-0002' || (isSplit && Number(b.PalawiyaAmount) > 0)));

        const matchesCategory =
          categoryFilter === 'All' ||
          (b.BillCategory && b.BillCategory.toLowerCase() === categoryFilter.toLowerCase());

        return matchesOffice && matchesCategory;
      })
      .map(b => {
        const isSplit = b.Office === 'Split';
        const totalAmount = Number(b.Amount) || 0;
        const chilawAmt = isSplit ? Number(b.ChilawAmount) || 0 : (b.Office === 'Chilaw' ? totalAmount : 0);
        const palawiyaAmt = isSplit ? Number(b.PalawiyaAmount) || 0 : (b.Office === 'Palawiya' ? totalAmount : 0);

        let allocatedAmount = totalAmount;
        let allocatedDescription = b.Description;

        if (officeFilter === 'Chilaw' && isSplit) {
          allocatedAmount = chilawAmt;
          if (b.ChilawDescription) allocatedDescription = b.ChilawDescription;
        } else if (officeFilter === 'Palawiya' && isSplit) {
          allocatedAmount = palawiyaAmt;
          if (b.PalawiyaDescription) allocatedDescription = b.PalawiyaDescription;
        }

        return {
          ...b,
          Amount: totalAmount,
          ChilawAmount: chilawAmt,
          PalawiyaAmount: palawiyaAmt,
          allocatedAmount,
          allocatedDescription
        };
      })
      .sort((a, b) => new Date(b.BillDate || 0) - new Date(a.BillDate || 0));
  },

  getCCTVSummary() {
    const allBills = (dbRepository.getTable('CCTVBills') || []).map(b => ({
      ...b,
      Amount: Number(b.Amount) || 0,
      ChilawAmount: Number(b.ChilawAmount) || 0,
      PalawiyaAmount: Number(b.PalawiyaAmount) || 0
    }));

    const chilawBills = allBills.filter(b =>
      (b.Office && b.Office.toLowerCase() === 'chilaw') ||
      b.LocationID === 'LOC-0001' ||
      (b.Office === 'Split' && b.ChilawAmount > 0)
    );
    const palawiyaBills = allBills.filter(b =>
      (b.Office && b.Office.toLowerCase() === 'palawiya') ||
      b.LocationID === 'LOC-0002' ||
      (b.Office === 'Split' && b.PalawiyaAmount > 0)
    );

    const totalSpend = allBills.reduce((acc, b) => acc + b.Amount, 0);
    const chilawSpend = allBills.reduce((acc, b) => {
      if (b.Office === 'Chilaw') return acc + b.Amount;
      if (b.Office === 'Split') return acc + (b.ChilawAmount || 0);
      return acc;
    }, 0);
    const palawiyaSpend = allBills.reduce((acc, b) => {
      if (b.Office === 'Palawiya') return acc + b.Amount;
      if (b.Office === 'Split') return acc + (b.PalawiyaAmount || 0);
      return acc;
    }, 0);

    const pendingBills = allBills.filter(b => (b.PaymentStatus || '').toLowerCase() === 'pending');
    const pendingAmount = pendingBills.reduce((acc, b) => acc + b.Amount, 0);

    const paidBills = allBills.filter(b => (b.PaymentStatus || '').toLowerCase() === 'paid');
    const paidAmount = paidBills.reduce((acc, b) => acc + b.Amount, 0);

    // Category breakdown
    const categoryTotals = {};
    allBills.forEach(b => {
      const cat = b.BillCategory || 'General / Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + b.Amount;
    });

    return {
      totalSpend,
      chilawSpend,
      palawiyaSpend,
      totalBillsCount: allBills.length,
      chilawBillsCount: chilawBills.length,
      palawiyaBillsCount: palawiyaBills.length,
      pendingBillsCount: pendingBills.length,
      pendingAmount,
      paidBillsCount: paidBills.length,
      paidAmount,
      categoryTotals
    };
  },

  async addCCTVBill(billData, file = null) {
    const existingBills = dbRepository.getTable('CCTVBills') || [];
    const billId = dbRepository.getNextId('CCTVBills', 'CCTV-', 'BillID');
    const isSplit = billData.Office === 'Split';
    const locationId = billData.Office === 'Palawiya' ? 'LOC-0002' : (isSplit ? 'LOC-BOTH' : 'LOC-0001');

    let fileName = billData.FileName || '';
    let filePath = billData.FilePath || '';
    let fileSize = billData.FileSize || '';

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      fileName = safeName;
      filePath = `/invoices/${safeName}`;
      fileSize = `${Math.round(file.size / 1024)} KB`;

      try {
        const base64 = await this.readFileAsBase64(file);
        // Upload to backend if server is active
        await fetch('/api/invoices/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: safeName,
            base64Data: base64
          })
        });
      } catch (err) {
        console.warn('CCTV bill file upload to server failed, storing metadata in record:', err);
      }
    }

    const chilawAmt = isSplit ? Number(billData.ChilawAmount) || 0 : (billData.Office === 'Chilaw' ? Number(billData.Amount) || 0 : 0);
    const palawiyaAmt = isSplit ? Number(billData.PalawiyaAmount) || 0 : (billData.Office === 'Palawiya' ? Number(billData.Amount) || 0 : 0);
    const totalAmt = isSplit ? (chilawAmt + palawiyaAmt) : (Number(billData.Amount) || 0);

    const newBill = {
      BillID: billId,
      Office: billData.Office || 'Chilaw',
      LocationID: locationId,
      BillNumber: billData.BillNumber || `BILL-${Date.now().toString().slice(-4)}`,
      BillDate: billData.BillDate || new Date().toISOString().split('T')[0],
      BillPeriod: billData.BillPeriod || '',
      BillCategory: billData.BillCategory || 'General / Other',
      Supplier: billData.Supplier || 'General Vendor',
      Amount: totalAmt,
      ChilawAmount: chilawAmt,
      PalawiyaAmount: palawiyaAmt,
      ChilawDescription: billData.ChilawDescription || '',
      PalawiyaDescription: billData.PalawiyaDescription || '',
      PaymentStatus: billData.PaymentStatus || 'Paid',
      PaymentMethod: billData.PaymentMethod || 'Company Cheque',
      Description: billData.Description || (isSplit ? `Split Bill: Chilaw (Rs. ${chilawAmt.toLocaleString()}) & Palawiya (Rs. ${palawiyaAmt.toLocaleString()})` : ''),
      Notes: billData.Notes || '',
      FileName: fileName,
      FilePath: filePath,
      FileSize: fileSize
    };

    // Auto-create matching master expense if requested
    if (billData.createMatchingExpense && totalAmt > 0) {
      const expenses = dbRepository.getTable('Expenses') || [];
      const newExpensesList = [];

      let maxExpNum = 0;
      expenses.forEach(e => {
        const m = String(e.ExpenseID || '').match(/(\d+)/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxExpNum) maxExpNum = num;
        }
      });

      if (isSplit) {
        if (chilawAmt > 0) {
          const expId1 = `EXP-${String(maxExpNum + 1).padStart(4, '0')}`;
          newExpensesList.push({
            ExpenseID: expId1,
            ExpenseDate: newBill.BillDate,
            ExpenseType: 'CCTV Bill (Chilaw Portion)',
            AssetID: '',
            UserID: '',
            PrinterAssetID: '',
            DepartmentID: 'DEP-0004',
            Supplier: newBill.Supplier,
            Description: `[CCTV - Chilaw Share] ${newBill.ChilawDescription || newBill.Description} (Bill: ${newBill.BillNumber})`,
            Amount: chilawAmt,
            PaymentMethod: newBill.PaymentMethod,
            InvoiceID: newBill.BillID,
            Notes: `Split portion for Chilaw Office CCTV`
          });
        }
        if (palawiyaAmt > 0) {
          const expId2 = `EXP-${String(maxExpNum + (chilawAmt > 0 ? 2 : 1)).padStart(4, '0')}`;
          newExpensesList.push({
            ExpenseID: expId2,
            ExpenseDate: newBill.BillDate,
            ExpenseType: 'CCTV Bill (Palawiya Portion)',
            AssetID: '',
            UserID: '',
            PrinterAssetID: '',
            DepartmentID: 'DEP-0004',
            Supplier: newBill.Supplier,
            Description: `[CCTV - Palawiya Share] ${newBill.PalawiyaDescription || newBill.Description} (Bill: ${newBill.BillNumber})`,
            Amount: palawiyaAmt,
            PaymentMethod: newBill.PaymentMethod,
            InvoiceID: newBill.BillID,
            Notes: `Split portion for Palawiya Office CCTV`
          });
        }
      } else {
        const expenseId = `EXP-${String(maxExpNum + 1).padStart(4, '0')}`;
        newExpensesList.push({
          ExpenseID: expenseId,
          ExpenseDate: newBill.BillDate,
          ExpenseType: `CCTV Bill (${newBill.Office})`,
          AssetID: '',
          UserID: '',
          PrinterAssetID: '',
          DepartmentID: 'DEP-0004',
          Supplier: newBill.Supplier,
          Description: `[CCTV - ${newBill.Office}] ${newBill.Description} (Bill: ${newBill.BillNumber})`,
          Amount: totalAmt,
          PaymentMethod: newBill.PaymentMethod,
          InvoiceID: newBill.BillID,
          Notes: `Categorized under ${newBill.BillCategory} for ${newBill.Office} CCTV surveillance`
        });
      }

      if (newExpensesList.length > 0) {
        await dbRepository.updateTable('Expenses', [...newExpensesList, ...expenses]);
      }
    }

    // Always synchronize into Invoices (Verified Bills Vault)
    const invoices = dbRepository.getTable('Invoices') || [];
    const newInvoice = {
      InvoiceID: newBill.BillID,
      InvoiceNumber: newBill.BillNumber,
      InvoiceDate: newBill.BillDate,
      Supplier: newBill.Supplier,
      Amount: totalAmt,
      AssetID: '',
      UserID: '',
      PrinterAssetID: '',
      ExpenseID: newBill.BillID,
      FileName: fileName,
      FilePath: filePath,
      FileSize: fileSize,
      UploadDate: newBill.BillDate,
      Description: `[CCTV - ${newBill.Office}] ${newBill.Description}`
    };
    await dbRepository.updateTable('Invoices', [newInvoice, ...invoices]);

    await dbRepository.updateTable('CCTVBills', [newBill, ...existingBills]);
    return newBill;
  },

  async updateCCTVBill(billId, updatedFields) {
    const existingBills = dbRepository.getTable('CCTVBills') || [];
    const updated = existingBills.map(b => {
      if (b.BillID === billId) {
        const office = updatedFields.Office || b.Office;
        const locationId = office === 'Palawiya' ? 'LOC-0002' : (office === 'Split' ? 'LOC-BOTH' : 'LOC-0001');
        const isSplit = office === 'Split';
        const chilawAmt = isSplit ? Number(updatedFields.ChilawAmount !== undefined ? updatedFields.ChilawAmount : b.ChilawAmount) || 0 : (office === 'Chilaw' ? Number(updatedFields.Amount || b.Amount) || 0 : 0);
        const palawiyaAmt = isSplit ? Number(updatedFields.PalawiyaAmount !== undefined ? updatedFields.PalawiyaAmount : b.PalawiyaAmount) || 0 : (office === 'Palawiya' ? Number(updatedFields.Amount || b.Amount) || 0 : 0);
        const totalAmt = isSplit ? (chilawAmt + palawiyaAmt) : Number(updatedFields.Amount !== undefined ? updatedFields.Amount : b.Amount);

        return {
          ...b,
          ...updatedFields,
          Office: office,
          LocationID: locationId,
          Amount: totalAmt,
          ChilawAmount: chilawAmt,
          PalawiyaAmount: palawiyaAmt
        };
      }
      return b;
    });

    await dbRepository.updateTable('CCTVBills', updated);

    // Update in Invoices as well
    const invoices = dbRepository.getTable('Invoices') || [];
    const updatedInvoices = invoices.map(i => {
      if (i.InvoiceID === billId) {
        return {
          ...i,
          InvoiceNumber: updatedFields.BillNumber || i.InvoiceNumber,
          Supplier: updatedFields.Supplier || i.Supplier,
          Amount: Number(updatedFields.Amount || i.Amount)
        };
      }
      return i;
    });
    await dbRepository.updateTable('Invoices', updatedInvoices);
  },

  async deleteCCTVBill(billId) {
    const existingBills = dbRepository.getTable('CCTVBills') || [];
    const filtered = existingBills.filter(b => b.BillID !== billId);
    await dbRepository.updateTable('CCTVBills', filtered);

    // Also remove from Invoices and Expenses
    const invoices = dbRepository.getTable('Invoices') || [];
    const filteredInvoices = invoices.filter(i => i.InvoiceID !== billId);
    await dbRepository.updateTable('Invoices', filteredInvoices);

    const expenses = dbRepository.getTable('Expenses') || [];
    const filteredExpenses = expenses.filter(e => e.InvoiceID !== billId);
    await dbRepository.updateTable('Expenses', filteredExpenses);
  },

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
