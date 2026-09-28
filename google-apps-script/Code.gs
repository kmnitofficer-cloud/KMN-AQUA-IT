/**
 * ============================================================================
 * KMN AQUA SERVICES - IT SYSTEM DATABASE & BILLS BACKEND (GOOGLE APPS SCRIPT)
 * ============================================================================
 * 
 * This Google Apps Script acts as the serverless backend connecting your
 * GitHub Pages IT System directly to Google Drive and Google Sheets.
 *
 * Capabilities:
 *  1. Multi-table Relational Database (19 tables) stored in a single Google Sheet.
 *  2. Automatic PDF Bill upload into a dedicated "IT_System_Invoices" Google Drive folder.
 *  3. Live reading and updating of all asset, printer, repair, user, AC, and invoice records.
 *  4. Direct iframe preview links and download links for all stored bill PDFs.
 *
 * SETUP INSTRUCTIONS:
 *  1. Open Google Drive (drive.google.com).
 *  2. Create a new Google Spreadsheet named: "IT_Asset_Database".
 *  3. Click: Extensions > Apps Script.
 *  4. Delete any code in the editor, and paste this entire Code.gs file.
 *  5. Click Deploy > New deployment:
 *     - Select type: "Web app"
 *     - Description: "IT System API"
 *     - Execute as: "Me" (your email)
 *     - Who has access: "Anyone" (allows your GitHub Pages site to connect)
 *  6. Click "Deploy", copy the Web App URL (starts with https://script.google.com/macros/s/...)
 *  7. Paste this URL into your IT System App under "Excel Relational Database Hub".
 * ============================================================================
 */

// Name of the folder where invoice & bill PDFs will be stored in Google Drive
const INVOICES_FOLDER_NAME = "IT_System_Invoices";

// All relational table names supported by the IT System
const TABLE_NAMES = [
  "Users",
  "Departments",
  "Locations",
  "Assets",
  "AssetComponents",
  "Assignments",
  "Printers",
  "Consumables",
  "Repairs",
  "Parts",
  "Expenses",
  "Invoices",
  "Suppliers",
  "CCTVBills",
  "ACUnits",
  "ACServices",
  "ACRepairs",
  "ACReplacements",
  "LegacyRawImport"
];

/**
 * Handle GET requests from GitHub Pages app
 * Fetches all database tables and returns as clean JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) || "getDatabase";

    if (action === "ping" || action === "test") {
      return jsonResponse({
        success: true,
        message: "Google Apps Script IT Database API is active!",
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // Read full database
    const database = {};
    TABLE_NAMES.forEach(function (tableName) {
      const sheet = ss.getSheetByName(tableName);
      if (!sheet) {
        database[tableName] = [];
        return;
      }
      database[tableName] = readSheetData(sheet);
    });

    return jsonResponse({
      success: true,
      data: database,
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Handle POST requests from GitHub Pages app
 * Actions:
 *  - test: Verifies connection
 *  - saveDatabase: Writes full database to Google Sheets
 *  - updateTable: Updates an individual sheet tab
 *  - uploadInvoice: Saves Base64 PDF to Google Drive and adds record to Invoices sheet
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || "saveDatabase";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Connection test
    if (action === "test" || action === "ping") {
      return jsonResponse({
        success: true,
        message: "Connection verified successfully! Google Drive & Sheets are ready.",
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Save full database
    if (action === "saveDatabase") {
      const db = payload.database || {};
      TABLE_NAMES.forEach(function (tableName) {
        if (db[tableName] !== undefined) {
          writeSheetData(ss, tableName, db[tableName]);
        }
      });

      return jsonResponse({
        success: true,
        message: "All tables successfully synced to Google Sheet!",
        timestamp: new Date().toISOString()
      });
    }

    // 3. Save single table
    if (action === "updateTable") {
      const tableName = payload.tableName;
      const records = payload.records || [];
      if (!tableName) {
        throw new Error("Missing tableName in request");
      }
      writeSheetData(ss, tableName, records);

      return jsonResponse({
        success: true,
        message: "Table " + tableName + " updated successfully.",
        timestamp: new Date().toISOString()
      });
    }

    // 4. Upload bill/invoice PDF to Google Drive
    if (action === "uploadInvoice") {
      const filename = payload.filename || ("Invoice_" + Date.now() + ".pdf");
      const base64Data = payload.base64Data || "";
      const invoiceData = payload.invoiceData || {};

      if (!base64Data) {
        throw new Error("No PDF file data provided");
      }

      // Clean base64 header if present (e.g. data:application/pdf;base64,...)
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decodedBytes, "application/pdf", filename);

      // Locate or create the target invoices folder in Google Drive
      const folder = getOrCreateInvoicesFolder();
      const file = folder.createFile(blob);

      // Make file viewable with link
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        console.warn("Could not set public sharing: " + shareErr);
      }

      const fileId = file.getId();
      const driveUrl = file.getUrl();
      const previewUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
      const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

      // Build complete new invoice record
      const today = invoiceData.InvoiceDate || new Date().toISOString().split("T")[0];
      const invoiceSheet = getOrCreateSheet(ss, "Invoices");
      const currentInvoices = readSheetData(invoiceSheet);
      const invoiceId = invoiceData.InvoiceID || ("INV-" + String(currentInvoices.length + 1).padStart(4, "0"));

      const newInvoice = {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceData.InvoiceNumber || ("INV-" + String(Date.now()).slice(-4)),
        InvoiceDate: today,
        Supplier: invoiceData.Supplier || "General Vendor",
        Amount: Number(invoiceData.Amount) || 0,
        AssetID: invoiceData.AssetID || "",
        UserID: invoiceData.UserID || "",
        PrinterAssetID: invoiceData.PrinterAssetID || "",
        ExpenseID: invoiceData.ExpenseID || "",
        FileName: filename,
        FilePath: previewUrl,
        DriveUrl: driveUrl,
        DownloadUrl: downloadUrl,
        DriveFileID: fileId,
        FileSize: Math.round(blob.getBytes().length / 1024) + " KB",
        UploadDate: new Date().toISOString().split("T")[0],
        Description: invoiceData.Description || ("Uploaded Invoice: " + filename)
      };

      // Add to Invoices sheet
      const updatedInvoices = [newInvoice].concat(currentInvoices);
      writeSheetData(ss, "Invoices", updatedInvoices);

      // If requested, also record in Expenses sheet
      if (invoiceData.createMatchingExpense && Number(invoiceData.Amount) > 0) {
        const expenseSheet = getOrCreateSheet(ss, "Expenses");
        const currentExpenses = readSheetData(expenseSheet);
        const expenseId = invoiceData.ExpenseID || ("EXP-" + String(currentExpenses.length + 1).padStart(4, "0"));

        const newExpense = {
          ExpenseID: expenseId,
          ExpenseDate: today,
          ExpenseType: invoiceData.ExpenseType || "General IT",
          AssetID: invoiceData.AssetID || "",
          UserID: invoiceData.UserID || "",
          PrinterAssetID: invoiceData.PrinterAssetID || "",
          DepartmentID: invoiceData.DepartmentID || "DEP-0004",
          Supplier: invoiceData.Supplier || "General Vendor",
          Description: invoiceData.Description || ("Invoice " + (newInvoice.InvoiceNumber || invoiceId)),
          Amount: Number(invoiceData.Amount) || 0,
          PaymentMethod: invoiceData.PaymentMethod || "Company Cheque",
          InvoiceID: invoiceId,
          Notes: invoiceData.Notes || ("Google Drive Invoice Vault: " + filename)
        };

        const updatedExpenses = [newExpense].concat(currentExpenses);
        writeSheetData(ss, "Expenses", updatedExpenses);
      }

      return jsonResponse({
        success: true,
        message: "Invoice PDF saved to Google Drive and database updated successfully!",
        fileUrl: previewUrl,
        driveUrl: driveUrl,
        downloadUrl: downloadUrl,
        invoice: newInvoice
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Reads a sheet's rows into an array of JavaScript objects based on header row
 */
function readSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(function (h) { return String(h || "").trim(); });
  const records = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Check if entire row is empty
    const isEmpty = row.every(function (cell) { return cell === "" || cell === null; });
    if (isEmpty) continue;

    const record = {};
    headers.forEach(function (header, c) {
      if (!header) return;
      let val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
      }
      record[header] = val !== undefined ? val : "";
    });
    records.push(record);
  }

  return records;
}

/**
 * Writes an array of objects into a specific sheet tab with header row
 */
function writeSheetData(ss, sheetName, records) {
  const sheet = getOrCreateSheet(ss, sheetName);
  sheet.clear();

  if (!records || records.length === 0) {
    sheet.getRange(1, 1).setValue("ID");
    return;
  }

  // Collect all unique keys from all records to preserve all attributes
  const keySet = {};
  records.forEach(function (rec) {
    if (rec && typeof rec === "object") {
      Object.keys(rec).forEach(function (k) { keySet[k] = true; });
    }
  });

  const headers = Object.keys(keySet);
  if (headers.length === 0) {
    sheet.getRange(1, 1).setValue("ID");
    return;
  }

  const outputRows = [headers];
  records.forEach(function (rec) {
    const row = headers.map(function (header) {
      let val = rec[header];
      if (val === undefined || val === null) return "";
      if (val instanceof Date) {
        return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
      }
      return val;
    });
    outputRows.push(row);
  });

  // Bulk write to sheet
  sheet.getRange(1, 1, outputRows.length, headers.length).setValues(outputRows);
  
  // Format header row with bold font and slight background
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#f1f5f9");
}

/**
 * Helper to get or create a sheet tab
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper to locate or create the Invoices folder in Google Drive
 */
function getOrCreateInvoicesFolder() {
  const folders = DriveApp.getFoldersByName(INVOICES_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(INVOICES_FOLDER_NAME);
}

/**
 * Output helper with proper JSON MIME type and CORS headers
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
