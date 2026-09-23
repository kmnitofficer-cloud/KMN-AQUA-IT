/**
 * Universal Date Utility for KMN IT Asset Management System
 * Handles conversion of Excel serial numbers (e.g. 46204, 46270),
 * standard ISO strings (YYYY-MM-DD), and common formatted dates (DD/MM/YYYY).
 */

export function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return '';

  // 1. Numeric Excel serial number (days since Dec 30, 1899)
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '';
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400 * 1000;
    const dateObj = new Date(epoch.getTime() + val * msPerDay);
    return dateObj.toISOString().split('T')[0];
  }

  // 2. Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }

  const str = String(val).trim();

  // 3. String numeric Excel serial number (e.g. "46204")
  if (/^\d{5}$/.test(str)) {
    const num = parseInt(str, 10);
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400 * 1000;
    const dateObj = new Date(epoch.getTime() + num * msPerDay);
    return dateObj.toISOString().split('T')[0];
  }

  // 4. Standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // 5. Common formats: DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY
  const parts = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }

  // 6. Fallback Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return str;
}

export function formatDisplayDate(val, fallback = 'N/A') {
  const iso = parseExcelDate(val);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return val || fallback;

  try {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  } catch (e) {
    return iso;
  }
}
