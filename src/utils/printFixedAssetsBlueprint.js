/**
 * ============================================================================
 * FIXED ASSETS ARCHITECTURAL CAD BLUEPRINT PRINT UTILITY
 * ============================================================================
 * Generates an isolated, architectural CAD print document for Ground Floor and
 * 1st Floor blueprints. Formatted for A4 Landscape printing.
 *
 * Supports:
 *  - mode: 'blank-map'   -> Clean architectural map ONLY (No furniture/pins) for hand-drawing!
 *  - mode: 'full-map'    -> Full map with all current furniture & chairs in position
 *  - mode: 'detailed'    -> Full map + itemized asset table schedule
 */

export function printFixedAssetsBlueprint({
  floorTitle = 'Ground Floor',
  svgElement = null,
  assets = [],
  mode = 'blank-map', // 'blank-map' | 'full-map' | 'detailed'
  activeFilter = 'All'
}) {
  if (!svgElement) {
    svgElement = document.querySelector('.fa-blueprint-canvas svg');
  }

  if (!svgElement) {
    alert('Could not find blueprint map to print.');
    return;
  }

  // Clone SVG element to modify for clean ink-saving print
  const clonedSvg = svgElement.cloneNode(true);
  clonedSvg.removeAttribute('style');
  clonedSvg.setAttribute('width', '100%');
  clonedSvg.setAttribute('height', '100%');

  // Replace dark background rect with clean white
  const bgRect = clonedSvg.querySelector('rect[fill="url(#archCadGrid)"]') || clonedSvg.querySelector('rect');
  if (bgRect) {
    bgRect.setAttribute('fill', '#ffffff');
  }

  // If blank-map is requested (for hand-drawing where assets need to go):
  if (mode === 'blank-map') {
    // Hide all furniture layers completely
    const chairLayer = clonedSvg.querySelector('#architectural-chairs-layer');
    if (chairLayer) chairLayer.style.display = 'none';

    const tableLayer = clonedSvg.querySelector('#architectural-tables-layer');
    if (tableLayer) tableLayer.style.display = 'none';

    const pcLayer = clonedSvg.querySelector('#architectural-computers-layer');
    if (pcLayer) pcLayer.style.display = 'none';

    const pinsLayer = clonedSvg.querySelector('#fa-asset-pins');
    if (pinsLayer) pinsLayer.style.display = 'none';

    // Hide room badges so the floor is completely clean for sketching
    const badges = clonedSvg.querySelectorAll('.fa-room-badge');
    badges.forEach(b => b.style.display = 'none');
  }

  // Ensure all text elements are crisp dark charcoal for paper printing
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

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Filter assets for table schedule if in detailed mode
  const isGround = floorTitle.toLowerCase().includes('ground') || floorTitle.toLowerCase().includes('gf');
  const floorAssets = assets.filter(a => isGround ? a.floor === 'Ground Floor' : (a.floor === '1st Floor' || a.zoneId === 'chilaw_lab'));

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
  <title>KMN IT SYSTEM - ${floorTitle} ${mode === 'blank-map' ? 'Blank Architectural Plan' : 'Asset Map'}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: ${mode === 'detailed' ? '8mm 10mm' : '5mm 8mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .print-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .print-subtitle {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
    }
    .print-meta {
      text-align: right;
      font-size: 8pt;
      color: #334155;
      line-height: 1.35;
    }
    .map-container {
      width: 100%;
      height: ${mode === 'detailed' ? '128mm' : '172mm'};
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 3mm;
    }
    .map-container svg {
      width: 100%;
      height: 100%;
      max-height: 100%;
    }
    /* Architectural Title Block for Blank Hand-Drawing Map */
    .cad-title-block {
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #94a3b8;
      padding: 6px 12px;
      font-size: 7.5pt;
      color: #334155;
      background: #f8fafc;
    }
    .cad-title-block div {
      display: flex;
      gap: 15px;
    }
    .cad-box-label {
      font-weight: 700;
      color: #0f172a;
    }
    /* Detailed Table */
    .assets-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 7pt;
      page-break-before: auto;
    }
    .assets-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
      font-weight: 800;
    }
    .assets-table td {
      border: 1px solid #e2e8f0;
      padding: 3px 6px;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <div class="print-title">KMN CHILAW FACILITY • ${floorTitle.toUpperCase()}</div>
      <div class="print-subtitle">
        ${mode === 'blank-map' 
          ? 'ARCHITECTURAL BLUEPRINT • BLANK MAP FOR HAND-DRAWN ASSET PLACEMENT'
          : `FIXED ASSET & INFRASTRUCTURE MAP • ${activeFilter.toUpperCase()} LAYER`}
      </div>
    </div>
    <div class="print-meta">
      <div><strong>Date:</strong> ${today}</div>
      <div><strong>Facility:</strong> Chilaw Head Office</div>
      <div><strong>Status:</strong> ${mode === 'blank-map' ? 'Blank CAD Layout' : `${floorAssets.length} Assets Registered`}</div>
    </div>
  </div>

  <div class="map-container">
    ${svgHtml}
  </div>

  ${mode === 'blank-map' ? `
    <div class="cad-title-block">
      <div>
        <span><span class="cad-box-label">PURPOSE:</span> Physical Asset Location Sketching & Allocation</span>
        <span><span class="cad-box-label">SCALE:</span> 1:100 Architectural</span>
      </div>
      <div>
        <span><span class="cad-box-label">DRAWN BY:</span> ___________________________</span>
        <span><span class="cad-box-label">APPROVED BY:</span> ___________________________</span>
      </div>
    </div>
  ` : ''}

  ${mode === 'detailed' && floorAssets.length > 0 ? `
    <table class="assets-table">
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th style="width: 130px;">Verification Tag</th>
          <th>Item Name</th>
          <th>Keyword</th>
          <th>Room / Location</th>
          <th>Assigned Custodian</th>
          <th>Condition</th>
          <th>Serial No</th>
        </tr>
      </thead>
      <tbody>
        ${floorAssets.slice(0, 35).map((a, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${a.tagNumber.slice(-14)}</strong></td>
            <td>${a.itemName}</td>
            <td>${a.keyword}</td>
            <td>${a.zoneName || a.locationName}</td>
            <td>${a.user || 'Common'}</td>
            <td>${a.condition}</td>
            <td>${a.serialNo || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${floorAssets.length > 35 ? `<div style="font-size: 7pt; color: #64748b; margin-top: 4px;">* Showing first 35 of ${floorAssets.length} assets. Full register available in system.</div>` : ''}
  ` : ''}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() {
          if (window.frameElement) {
            window.frameElement.parentNode.removeChild(window.frameElement);
          }
        }, 1000);
      }, 300);
    };
  </script>
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();
}
