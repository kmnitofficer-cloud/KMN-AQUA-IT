import { dbRepository } from './dbRepository';

export const expenseService = {
  getExpenses(filter = 'All', targetId = null) {
    const expenses = dbRepository.getTable('Expenses');
    const assets = dbRepository.getTable('Assets');
    const users = dbRepository.getTable('Users');
    const departments = dbRepository.getTable('Departments');
    const invoices = dbRepository.getTable('Invoices');

    const enriched = expenses.map(e => {
      const asset = assets.find(a => a.AssetID === e.AssetID) || {};
      const user = users.find(u => u.UserID === e.UserID) || {};
      const dept = departments.find(d => d.DepartmentID === e.DepartmentID) || {};
      const inv = invoices.find(i => i.InvoiceID === e.InvoiceID) || {};

      return {
        ...e,
        Amount: Number(e.Amount) || 0,
        AssetName: asset.Model || (asset.AssetID ? `${asset.Brand} ${asset.AssetType}` : ''),
        AssetVerifiedNo: asset.VerifiedNo || '',
        UserName: user.Name || 'General Office',
        DepartmentName: dept.DepartmentName || 'General',
        InvoiceNumber: inv.InvoiceNumber || '',
        InvoiceFile: inv.FilePath || ''
      };
    }).sort((a, b) => new Date(b.ExpenseDate || 0) - new Date(a.ExpenseDate || 0));

    if (filter === 'All') return enriched;
    if (filter === 'User') return enriched.filter(e => targetId ? e.UserID === targetId : !!e.UserID);
    if (filter === 'Asset') return enriched.filter(e => targetId ? e.AssetID === targetId : !!e.AssetID);
    if (filter === 'Printer') return enriched.filter(e => targetId ? e.PrinterAssetID === targetId : !!e.PrinterAssetID);
    if (filter === 'Department') return enriched.filter(e => targetId ? e.DepartmentID === targetId : !!e.DepartmentID);
    if (filter === 'General') return enriched.filter(e => !e.AssetID && !e.UserID);
    return enriched;
  },

  getFinancialSummary() {
    const expenses = this.getExpenses('All');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonthPrefix = `${currentYear}-${currentMonth}`;

    const totalExpenses = expenses.reduce((s, e) => s + e.Amount, 0);
    const repairExpenses = expenses.filter(e => e.ExpenseType === 'Repair').reduce((s, e) => s + e.Amount, 0);
    const consumableExpenses = expenses.filter(e => e.ExpenseType.includes('Consumable') || e.ExpenseType.includes('Toner')).reduce((s, e) => s + e.Amount, 0);
    const purchaseExpenses = expenses.filter(e => e.ExpenseType === 'Purchase' || e.ExpenseType.includes('Asset')).reduce((s, e) => s + e.Amount, 0);

    const currentMonthExpenses = expenses
      .filter(e => (e.ExpenseDate || '').startsWith(yearMonthPrefix))
      .reduce((s, e) => s + e.Amount, 0);

    const currentYearExpenses = expenses
      .filter(e => (e.ExpenseDate || '').startsWith(String(currentYear)))
      .reduce((s, e) => s + e.Amount, 0);

    return {
      totalExpenses,
      repairExpenses,
      consumableExpenses,
      purchaseExpenses,
      currentMonthExpenses,
      currentYearExpenses,
      count: expenses.length
    };
  },

  async logExpense(expenseData) {
    const expenses = dbRepository.getTable('Expenses');
    const nextNum = expenses.length + 1;
    const newId = `EXP-${String(nextNum).padStart(4, '0')}`;

    const newExpense = {
      ...expenseData,
      ExpenseID: newId,
      Amount: Number(expenseData.Amount) || 0,
      ExpenseDate: expenseData.ExpenseDate || new Date().toISOString().split('T')[0]
    };

    await dbRepository.updateTable('Expenses', [newExpense, ...expenses]);
    return newExpense;
  }
};
