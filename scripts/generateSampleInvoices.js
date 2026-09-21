import fs from 'fs';
import path from 'path';

function createSimplePDF(filePath, title, invoiceNo, supplier, amount, date) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Length 300 >>
stream
BT
/F1 18 Tf
50 720 Td
(${title}) Tj
/F1 12 Tf
0 -40 Td
(Invoice Number: ${invoiceNo}) Tj
0 -25 Td
(Supplier: ${supplier}) Tj
0 -25 Td
(Date: ${date}) Tj
0 -25 Td
(Amount: LKR ${amount}) Tj
0 -40 Td
(Status: Verified & Processed in KMN IT Management System) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
670
%%EOF`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

const dir = 'public/invoices';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

createSimplePDF(path.join(dir, 'Invoice_1001_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - TONER REPLACEMENT', 'KMN-INV-1001', 'KMN IT Solution', '2,200', '2026-06-10');
createSimplePDF(path.join(dir, 'Invoice_1002_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - INK CARTRIDGE', 'KMN-INV-1002', 'KMN IT Solution', '3,500', '2026-07-02');
createSimplePDF(path.join(dir, 'Invoice_1003_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - UNA 650VA UPS', 'KMN-INV-1003', 'KMN IT Solution', '9,500', '2026-09-08');
createSimplePDF(path.join(dir, 'Invoice_1004_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - LAPTOP SERVICE', 'KMN-INV-1004', 'KMN IT Solution', '4,500', '2026-05-27');
createSimplePDF(path.join(dir, 'Invoice_1005_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - UNA 650VA UPS', 'KMN-INV-1005', 'KMN IT Solution', '9,500', '2026-06-16');
createSimplePDF(path.join(dir, 'Invoice_1006_KMN_IT_Solution.pdf'), 'OFFICIAL INVOICE - RAM UPGRADE 4GB', 'KMN-INV-1006', 'KMN IT Solution', '6,500', '2026-06-20');

console.log('Sample PDF invoices generated successfully in public/invoices/');
