/**
 * SageStack - High-Fidelity Document Visualizer & Proof Inspector
 * Renders realistic visual certificates with exact bounding box overlays
 * Addresses Hackathon Review Problem 5 & 7 (Source-page evidence & confidence)
 */

const SageDocViewer = {
  activeDoc: 'oem',
  activeField: 'validUntil',

  renderDocument(docType, fieldKey, scenarioData) {
    this.activeDoc = docType;
    this.activeField = fieldKey;
    const container = document.getElementById('mockDocumentContainer');
    if (!container) return;

    const doc = scenarioData.docs[docType];
    if (!doc) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No visual preview available for this document slot.</div>`;
      return;
    }

    let html = '';
    switch (docType) {
      case 'oem':
        html = this.renderOemLetter(doc, fieldKey);
        break;
      case 'gst':
        html = this.renderGstCertificate(doc, fieldKey);
        break;
      case 'pan':
        html = this.renderPanCard(doc, fieldKey);
        break;
      case 'udyam':
        html = this.renderUdyamCertificate(doc, fieldKey);
        break;
      case 'startup':
        html = this.renderStartupCertificate(doc, fieldKey);
        break;
      default:
        html = `<div class="p-4 text-center text-muted">Document preview rendered.</div>`;
    }

    container.innerHTML = html;

    // Update inspector header & confidence bar
    const titleElem = document.getElementById('inspectorDocTitle');
    const tagElem = document.getElementById('inspectorBboxTag');
    const confBar = document.getElementById('inspectorConfBar');
    const confVal = document.getElementById('inspectorConfValue');

    if (titleElem) titleElem.textContent = `${doc.filename} • Page 1`;

    const fieldObj = doc.fields ? doc.fields[fieldKey] : null;
    const conf = fieldObj ? (fieldObj.conf || 95.0) : 95.0;

    if (tagElem) {
      tagElem.textContent = `Highlighting: ${fieldKey || 'Inspected Field'}`;
    }
    if (confBar) {
      confBar.style.width = `${conf}%`;
      confBar.style.background = conf > 90 ? '#10B981' : (conf > 75 ? '#F59E0B' : '#EF4444');
    }
    if (confVal) {
      confVal.textContent = `${conf.toFixed(1)}%`;
      confVal.style.color = conf > 90 ? '#10B981' : (conf > 75 ? '#F59E0B' : '#EF4444');
    }
  },

  renderOemLetter(doc, highlightedField) {
    const fields = doc.fields || {};
    const isValHighlighted = highlightedField === 'validUntil';
    const isPartnerHighlighted = highlightedField === 'authorizedPartner';
    const isScopeHighlighted = highlightedField === 'productScope';

    return `
      <div class="rendered-doc-sheet oem-sheet">
        <div class="doc-sheet-header">
          <div>
            <div class="doc-sheet-title" style="color: #0284C7;">APEX SILICON GLOBAL CORP</div>
            <div style="font-size: 8px; color: #64748B;">Global Hardware Systems & Telemetry Division</div>
          </div>
          <div class="doc-sheet-seal">OEM AUTH #2024-MAF-091</div>
        </div>

        <div class="doc-sheet-body">
          <div style="font-size: 9px; color: #475569; margin-bottom: 8px;">
            <strong>Date:</strong> 12 March 2024<br>
            <strong>To:</strong> The Procurement Committee / Evaluation Authority<br>
            <strong>Subject:</strong> Manufacturer's Authorization Form (MAF)
          </div>

          <p style="font-size: 10px; color: #1E293B; line-height: 1.5;">
            Dear Sir/Madam,<br>
            We, <strong>Apex Silicon Global Corp</strong>, having our corporate offices at Tech Innovation Park, 
            do hereby authorize and appoint:
          </p>

          <div class="${isPartnerHighlighted ? 'bbox-highlight green' : ''}" style="margin: 4px 0; padding: 4px; border-radius: 3px;">
            ${isPartnerHighlighted ? '<span class="bbox-tag">Partner Name</span>' : ''}
            <div style="font-size: 11px; font-weight: 700; color: #0F172A;">
              M/s ${fields.authorizedPartner?.value || 'Sample Traders Pvt Ltd'}
            </div>
          </div>

          <p style="font-size: 10px; color: #1E293B; line-height: 1.5;">
            to participate and bid as our Authorized Solution Partner for the supply and warranty integration of:
          </p>

          <div class="${isScopeHighlighted ? 'bbox-highlight' : ''}" style="margin: 4px 0; padding: 4px; border-radius: 3px;">
            ${isScopeHighlighted ? '<span class="bbox-tag">Product Scope</span>' : ''}
            <div style="font-size: 10px; font-weight: 600; color: #334155;">
              "${fields.productScope?.value || 'High-Density Server Hardware & Network Cards'}"
            </div>
          </div>

          <!-- Highlighted Validity Box (Slide 6 finding!) -->
          <div class="${isValHighlighted ? 'bbox-highlight red' : 'bbox-highlight red'}" style="margin: 8px 0; padding: 6px; border-radius: 3px;">
            <span class="bbox-tag" style="background: #EF4444; color: white;">Validity Anchor (Line 14)</span>
            <div style="font-size: 11px; font-weight: 800; color: #B91C1C;">
              This authorization letter is: ${fields.validUntil?.value || 'Valid until 31 Mar 2024'}
            </div>
            <div style="font-size: 8.5px; color: #64748B;">
              *Subject to standard manufacturer channel partner agreement terms.
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="font-size: 8.5px; color: #64748B;">
              Doc Hash: 8fa94b2e...<br>
              Verified OCR Extracted
            </div>
            <div style="text-align: right;">
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #1E3A8A;">Rajesh Mehra</div>
              <div style="font-size: 9px; font-weight: 700; color: #0F172A;">${fields.signatory?.value || 'VP Enterprise Channels'}</div>
              <div style="font-size: 8px; color: #475569;">Apex Silicon Global Corp</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderGstCertificate(doc, highlightedField) {
    const fields = doc.fields || {};
    const isGstinHigh = highlightedField === 'gstin';
    const isNameHigh = highlightedField === 'legalName';
    const isAddrHigh = highlightedField === 'address';

    return `
      <div class="rendered-doc-sheet gst-sheet">
        <div class="doc-sheet-header">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 10px; font-weight: 700; color: #475569;">GOVERNMENT OF INDIA / STATE GOODS AND SERVICES TAX</div>
            <div class="doc-sheet-title" style="font-size: 12px; margin-top: 2px;">Registration Certificate (Form GST REG-06)</div>
          </div>
        </div>

        <div class="doc-sheet-body" style="font-size: 10px;">
          <!-- GSTIN Box -->
          <div class="${isGstinHigh ? 'bbox-highlight green' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isGstinHigh ? '<span class="bbox-tag">GSTIN Registration</span>' : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B; font-weight: 600;">Registration Number (GSTIN):</span>
              <strong style="font-family: monospace; font-size: 12px; letter-spacing: 1px; color: #0284C7;">
                ${fields.gstin?.value || '07ABCDE1234F1Z5'}
              </strong>
            </div>
          </div>

          <!-- Legal Name -->
          <div class="${isNameHigh ? 'bbox-highlight' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isNameHigh ? '<span class="bbox-tag">Legal Name</span>' : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Legal Name:</span>
              <strong style="color: #0F172A;">${fields.legalName?.value || 'Sample Traders Pvt Ltd'}</strong>
            </div>
          </div>

          <!-- Trade Name -->
          <div style="display: flex; justify-content: space-between; padding: 2px 4px; margin-bottom: 6px;">
            <span style="color: #64748B;">Trade Name:</span>
            <span>${fields.tradeName?.value || 'Sample Traders'}</span>
          </div>

          <!-- Address -->
          <div class="${isAddrHigh ? 'bbox-highlight green' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isAddrHigh ? '<span class="bbox-tag">Principal Address</span>' : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Principal Place:</span>
              <span style="text-align: right; max-width: 65%; color: #334155;">
                ${fields.address?.value || 'Plot 12, Sector 5, Okhla Phase 3, New Delhi - 110020'}
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; padding: 2px 4px; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span style="color: #64748B;">Status:</span>
            <strong style="color: #10B981;">● ${fields.status?.value || 'Active'}</strong>
          </div>
        </div>
      </div>
    `;
  },

  renderPanCard(doc, highlightedField) {
    const fields = doc.fields || {};
    const isPanHigh = highlightedField === 'panNumber';
    const isNameHigh = highlightedField === 'name';

    return `
      <div class="rendered-doc-sheet pan-sheet" style="background: linear-gradient(135deg, #F0FDF4, #ECFDF5); border: 2px solid #CBD5E1;">
        <div class="doc-sheet-header" style="border-bottom-color: #059669;">
          <div>
            <div style="font-size: 9px; font-weight: 700; color: #047857;">INCOME TAX DEPARTMENT</div>
            <div style="font-size: 8px; color: #6B7280;">GOVT. OF INDIA</div>
          </div>
          <div class="doc-sheet-seal" style="border-color: #059669; color: #047857;">PERMANENT ACCOUNT CARD</div>
        </div>

        <div class="doc-sheet-body" style="font-size: 10px;">
          <div class="${isNameHigh ? 'bbox-highlight' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isNameHigh ? '<span class="bbox-tag">Cardholder Name</span>' : ''}
            <div style="font-size: 8px; color: #6B7280;">Name / नाम:</div>
            <div style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">
              ${fields.name?.value || 'SAMPLE TRADERS PRIVATE LIMITED'}
            </div>
          </div>

          <div class="${isPanHigh ? 'bbox-highlight green' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isPanHigh ? '<span class="bbox-tag">PAN Number</span>' : ''}
            <div style="font-size: 8px; color: #6B7280;">Permanent Account Number / पैन:</div>
            <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #047857; letter-spacing: 1.5px;">
              ${fields.panNumber?.value || 'ABCDE1234F'}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #4B5563; border-top: 1px dashed #A7F3D0; padding-top: 6px;">
            <span>Incorporation: ${fields.dob_incorp?.value || '10/07/2018'}</span>
            <span>Type: ${fields.entityType?.value || 'Company'}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderUdyamCertificate(doc, highlightedField) {
    const fields = doc.fields || {};
    const isUdyamHigh = highlightedField === 'udyamNumber';
    const isNameHigh = highlightedField === 'enterpriseName';

    return `
      <div class="rendered-doc-sheet udyam-sheet">
        <div class="doc-sheet-header" style="border-bottom-color: #D97706;">
          <div>
            <div style="font-size: 9px; font-weight: 700; color: #D97706;">MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES</div>
            <div class="doc-sheet-title" style="font-size: 11px;">UDYAM REGISTRATION CERTIFICATE</div>
          </div>
          <div class="doc-sheet-seal" style="border-color: #D97706; color: #B45309;">MSME CLASSIFICATION</div>
        </div>

        <div class="doc-sheet-body" style="font-size: 10px;">
          <div class="${isUdyamHigh ? 'bbox-highlight green' : ''}" style="padding: 4px; margin-bottom: 6px;">
            ${isUdyamHigh ? '<span class="bbox-tag">Udyam Registration No.</span>' : ''}
            <div style="font-size: 8px; color: #6B7280;">UDYAM REGISTRATION NUMBER:</div>
            <div style="font-family: monospace; font-size: 12px; font-weight: 800; color: #B45309;">
              ${fields.udyamNumber?.value || 'UDYAM-DL-08-0019284'}
            </div>
          </div>

          <!-- Enterprise Name Variance (Slide 5 example!) -->
          <div class="${isNameHigh ? 'bbox-highlight' : 'bbox-highlight'}" style="padding: 4px; margin-bottom: 6px;">
            <span class="bbox-tag">Enterprise Name</span>
            <div style="font-size: 8px; color: #6B7280;">NAME OF ENTERPRISE:</div>
            <div style="font-size: 11px; font-weight: 700; color: #1E293B;">
              ${fields.enterpriseName?.value || 'Sample Trader Enterprises'}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #4B5563;">
            <span>Category: <strong>${fields.category?.value || 'Small Enterprise'}</strong></span>
            <span>Linked PAN: <strong style="font-family: monospace;">${fields.panNumber?.value || 'ABCDE1234F'}</strong></span>
          </div>
        </div>
      </div>
    `;
  },

  renderStartupCertificate(doc, highlightedField) {
    const fields = doc.fields || {};
    return `
      <div class="rendered-doc-sheet startup-sheet">
        <div class="doc-sheet-header">
          <div>
            <div style="font-size: 9px; font-weight: 700; color: #4F46E5;">STARTUP INDIA | DPIIT</div>
            <div class="doc-sheet-title" style="font-size: 11px;">Certificate of Recognition</div>
          </div>
          <div class="doc-sheet-seal">DPIIT / GOI</div>
        </div>
        <div class="doc-sheet-body" style="font-size: 10px;">
          <div>This is to certify that:</div>
          <div style="font-size: 12px; font-weight: 700; color: #1E1B4B; margin: 4px 0;">
            ${fields.companyName?.value || 'Eligible Startup Entity'}
          </div>
          <div>Has been recognized under DPIIT Startup Recognition Scheme.</div>
          <div style="font-family: monospace; color: #4F46E5; font-weight: 700; margin-top: 6px;">
            DPIIT ID: ${fields.startupNumber?.value || 'DIPP-VERIFIED'}
          </div>
        </div>
      </div>
    `;
  }
};
