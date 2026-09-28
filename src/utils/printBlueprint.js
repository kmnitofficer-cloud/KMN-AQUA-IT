/**
 * ============================================================================
 * BLUEPRINT MAP PRINT UTILITY
 * ============================================================================
 * Generates an isolated, architectural CAD print document for Ground Floor and
 * 1st Floor facility blueprints. Formatted for A4 / Letter Landscape printing.
 *
 * Supports:
 *  - mode: 'full-map' (default) -> Prints ONLY the full-size architectural map on A4 (No tables)
 *  - mode: 'detailed'           -> Prints map + AC unit summary table and status legend
 *  - hideACPins: boolean        -> Allows printing pure architectural layout without AC pins
 */

export function printBlueprintMap({
  floorTitle = 'Ground Floor',
  svgElement = null,
  units = [],
  mode = 'full-map', // 'full-map' | 'detailed'
  hideACPins = false
}) {
  if (!svgElement) {
    // Fallback: try querying from DOM
    svgElement = document.querySelector('.komvent-blueprint-canvas svg');
  }

  if (!svgElement) {
    alert('Could not find blueprint map to print.');
    return;
  }

  // Clone SVG element to modify for high-contrast ink-saving print
  const clonedSvg = svgElement.cloneNode(true);
  clonedSvg.removeAttribute('style');
  clonedSvg.setAttribute('width', '100%');
  clonedSvg.setAttribute('height', '100%');

  // Replace dark background rect with clean white
  const bgRect = clonedSvg.querySelector('rect[fill="url(#komventCadGrid)"]');
  if (bgRect) {
    bgRect.setAttribute('fill', '#ffffff');
  }

  // If hideACPins is requested, hide the wall pin markers
  if (hideACPins) {
    const pinsLayer = clonedSvg.querySelector('#komvent-wall-fan-pins');
    if (pinsLayer) pinsLayer.style.display = 'none';
  }

  // Ensure all text is dark and legible in print
  const textElements = clonedSvg.querySelectorAll('text');
  textElements.forEach(t => {
    const fill = t.getAttribute('fill');
    if (!fill || fill.includes('var(--text-primary)') || fill.toLowerCase() === '#ffffff' || fill.toLowerCase() === '#fff') {
      t.setAttribute('fill', '#0f172a');
    } else if (fill.includes('var(--text-muted)') || fill.toLowerCase() === '#94a3b8' || fill.toLowerCase() === '#64748b') {
      t.setAttribute('fill', '#475569');
    }
  });

  const svgHtml = clonedSvg.outerHTML;

  // Filter units for this floor
  const isGround = floorTitle.toLowerCase().includes('ground') || floorTitle.toLowerCase().includes('gf');
  const floorUnits = units.filter(u => {
    if (isGround) return u.Floor === 'Ground Floor' || !u.Floor;
    return u.Floor === 'First Floor' || u.Floor === 'New Lab' || u.RoomName === 'LAB';
  });

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const isFullMap = mode === 'full-map';

  // Create isolated hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>KMN AQUA SERVICES - ${floorTitle} Blueprint Map</title>
  <style>
    @page {
      size: A4 landscape;
      margin: ${isFullMap ? '5mm 8mm' : '8mm 10mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: ${isFullMap ? '1.5px solid #0f172a' : '2.5px solid #0f172a'};
      padding-bottom: ${isFullMap ? '3px' : '6px'};
      margin-bottom: ${isFullMap ? '4px' : '8px'};
    }
    .print-title-group h1 {
      font-size: ${isFullMap ? '13pt' : '15pt'};
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 1px 0;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }
    .print-title-group p {
      font-size: ${isFullMap ? '8pt' : '9pt'};
      color: #475569;
      font-weight: 600;
      margin: 0;
    }
    .print-meta {
      text-align: right;
      font-size: ${isFullMap ? '7.5pt' : '8pt'};
      color: #475569;
      line-height: 1.3;
    }
    .print-canvas {
      width: 100%;
      height: ${isFullMap ? 'calc(100vh - 44px)' : '480px'};
      max-height: ${isFullMap ? '190mm' : '470px'};
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      border: ${isFullMap ? 'none' : '1px solid #cbd5e1'};
      border-radius: 4px;
      padding: ${isFullMap ? '0' : '4px'};
      margin-bottom: ${isFullMap ? '2px' : '8px'};
    }
    .print-canvas svg {
      width: 100%;
      height: 100%;
      max-height: ${isFullMap ? '190mm' : '470px'};
      object-fit: contain;
    }
    .print-full-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #64748b;
      font-family: monospace;
      padding-top: 2px;
      border-top: 1px solid #e2e8f0;
    }
    .print-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 8pt;
      margin-bottom: 6px;
    }
    .legend-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 600;
      color: #334155;
    }
    .legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .legend-dot.active { background: #10b981; border: 1px solid #059669; }
    .legend-dot.service { background: #f59e0b; border: 1px solid #d97706; }
    .legend-dot.repair { background: #ef4444; border: 1px solid #dc2626; }
    .units-summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-top: 4px;
    }
    .units-summary-table th {
      background: #f1f5f9;
      color: #1e293b;
      text-align: left;
      padding: 3px 6px;
      border-bottom: 1.5px solid #cbd5e1;
      font-weight: 700;
    }
    .units-summary-table td {
      padding: 2.5px 6px;
      border-bottom: 1px solid #f1f5f9;
    }
    .unit-code-badge {
      font-family: monospace;
      font-weight: 700;
      color: #0284c7;
    }
    .status-badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 700;
    }
    .status-active { background: #dcfce7; color: #15803d; }
    .status-service { background: #fef3c7; color: #b45309; }
    .status-repair { background: #fee2e2; color: #b91c1c; }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="print-title-group">
      <h1>KMN AQUA SERVICES</h1>
      <p>ARCHITECTURAL FACILITY BLUEPRINT MAP — ${floorTitle.toUpperCase()}</p>
    </div>
    <div class="print-meta">
      <div><strong>Date:</strong> ${today}</div>
      <div><strong>Floor:</strong> ${floorTitle}</div>
    </div>
  </div>

  <div class="print-canvas">
    ${svgHtml}
  </div>

  ${isFullMap ? `
  <div class="print-full-footer">
    <span>KMN AQUA SERVICES • ARCHITECTURAL FACILITY BLUEPRINT (${floorTitle})</span>
    <span>Scale: Fit to A4 Landscape • Official Office Floor Plan</span>
  </div>
  ` : `
  <div class="print-footer">
    <div class="legend-group">
      <span style="font-weight: 700; color: #0f172a;">STATUS LEGEND:</span>
      <div class="legend-item">
        <span class="legend-dot active"></span>
        <span>Active Operational (${floorUnits.filter(u => u.Status === 'Active').length})</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot service"></span>
        <span>Needs Service (${floorUnits.filter(u => u.Status === 'Needs Service').length})</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot repair"></span>
        <span>Under Repair (${floorUnits.filter(u => u.Status === 'Under Repair').length})</span>
      </div>
    </div>
    <div>
      <span style="color: #64748b; font-family: monospace;">KOMVENT CAD Blueprint Revision • KMN Aqua IT System</span>
    </div>
  </div>

  ${floorUnits.length > 0 ? `
  <table class="units-summary-table">
    <thead>
      <tr>
        <th style="width: 50px;">Spot #</th>
        <th style="width: 80px;">Unit Code</th>
        <th>Room / Location</th>
        <th>Brand & Model</th>
        <th>Capacity</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${floorUnits.map(u => `
        <tr>
          <td><strong>${u.UnitNumber || u.UnitID?.slice(-2) || '-'}</strong></td>
          <td><span class="unit-code-badge">${u.UnitCode || u.UnitID}</span></td>
          <td>${u.RoomName || '-'}</td>
          <td>${u.Brand || ''} ${u.Model || ''}</td>
          <td>${u.CapacityBTU ? Number(u.CapacityBTU).toLocaleString() + ' BTU' : (u.PowerRating || 'Standard')}</td>
          <td>
            <span class="status-badge ${u.Status === 'Active' ? 'status-active' : u.Status === 'Needs Service' ? 'status-service' : 'status-repair'}">
              ${u.Status}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  `}
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
}
