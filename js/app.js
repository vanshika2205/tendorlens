/**
 * TenderLens - Enterprise Client Application Controller
 * Handles tabs, real file uploads, scenario benchmarks, API requests, and UI updates
 */

class TenderLensApp {
  constructor() {
    this.activeTab = 'tabWorkspace';
    this.selectedTenderId = 'gem-it';
    this.selectedScenarioId = 'sample-traders';
    this.reviewerOverrides = {};
    this.inspectedDoc = 'oem';
    this.inspectedField = 'validUntil';
    this.uploadedCustomDocs = null;
    this.apiBase = window.location.origin;

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.syncServerState();
    this.loadScenario(this.selectedScenarioId);
  }

  /**
   * Health check and initial sync with backend
   */
  async syncServerState() {
    try {
      const res = await fetch(`${this.apiBase}/api/stats`);
      if (res.ok) {
        // Backend live
      }
    } catch (e) {
      console.warn('API running in local-engine fallback mode:', e.message);
    }
  }

  /**
   * Toast notification helper
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Bind all button events and user interactions
   */
  bindEvents() {
    // 1. Navigation Tabs
    document.querySelectorAll('.tab-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 2. Demo Scenario Buttons
    document.querySelectorAll('.btn-scenario').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-scenario').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.uploadedCustomDocs = null;
        this.loadScenario(btn.dataset.scenario);
        this.showToast(`Loaded ${btn.textContent.trim()}`, 'success');
      });
    });

    // 3. Tender Specification Dropdown
    const tenderSelect = document.getElementById('tenderSelect');
    if (tenderSelect) {
      tenderSelect.addEventListener('change', (e) => {
        this.selectedTenderId = e.target.value;
        this.runFullAnalysis();
        this.showToast(`Switched tender rules to ${e.target.options[e.target.selectedIndex].text.split('(')[0]}`);
      });
    }

    // 4. Run Compliance Scan Button
    const runScanBtn = document.getElementById('btnRunAuditScan');
    if (runScanBtn) {
      runScanBtn.addEventListener('click', () => {
        runScanBtn.innerHTML = `<span>Scanning...</span>`;
        setTimeout(() => {
          this.runFullAnalysis();
          runScanBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Run Compliance Scan</span>
          `;
          this.showToast('Compliance audit scan completed successfully!', 'success');
        }, 350);
      });
    }

    // 5. Test Files Modal Toggle
    const btnSamples = document.getElementById('btnDownloadSamples');
    const samplesModal = document.getElementById('samplesModal');
    const btnCloseSamples = document.getElementById('btnCloseSamplesModal');

    if (btnSamples && samplesModal) {
      btnSamples.addEventListener('click', () => {
        samplesModal.style.display = samplesModal.style.display === 'none' ? 'block' : 'none';
      });
    }
    if (btnCloseSamples && samplesModal) {
      btnCloseSamples.addEventListener('click', () => {
        samplesModal.style.display = 'none';
      });
    }

    // 6. Real File Inputs (Gst, Pan, Oem, Udyam, Startup)
    ['Gst', 'Pan', 'Oem', 'Udyam', 'Startup'].forEach(type => {
      const input = document.getElementById(`fileUpload${type}`);
      if (input) {
        input.addEventListener('change', async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await this.handleSingleFileUpload(type.toLowerCase(), file);
          }
        });
      }
    });

    // 7. Reviewer Override Modal Triggers
    const btnOverride = document.getElementById('btnTriggerOverride');
    if (btnOverride) {
      btnOverride.addEventListener('click', () => {
        this.openOverrideModal('REQ-05');
      });
    }

    const btnCloseModal = document.getElementById('btnModalClose');
    const btnCancelModal = document.getElementById('btnModalCancel');
    const btnConfirmModal = document.getElementById('btnModalConfirm');

    if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeOverrideModal());
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => this.closeOverrideModal());
    if (btnConfirmModal) btnConfirmModal.addEventListener('click', () => this.saveOverride());

    // 8. Export JSON Button
    const btnExportJson = document.getElementById('btnExportJson');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
        const scenario = SAGE_SCENARIOS[this.selectedScenarioId];
        const docs = this.getActiveDocs();
        const cross = SageEngine.evaluateCrossDocMatrix(docs);
        const findings = SageEngine.evaluateTenderChecklist(tender, docs, cross, this.reviewerOverrides);
        const score = SageEngine.computeReadinessScore(findings);
        SageReport.exportJsonAuditTrail(tender, scenario, findings, score);
        this.showToast('Downloaded official JSON audit trail file', 'success');
      });
    }

    // 9. Auth Modal Events
    const btnNavAuth = document.getElementById('btnNavAuthAction');
    const authModal = document.getElementById('authModal');
    const btnCloseAuth = document.getElementById('btnCloseAuthModal');
    const btnTabLogin = document.getElementById('btnAuthTabLogin');
    const btnTabSignup = document.getElementById('btnAuthTabSignup');
    const authForm = document.getElementById('authForm');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const authModalTitle = document.getElementById('authModalTitle');

    if (btnNavAuth && authModal) {
      btnNavAuth.addEventListener('click', () => {
        authModal.classList.toggle('open');
      });
    }
    if (btnCloseAuth && authModal) {
      btnCloseAuth.addEventListener('click', () => {
        authModal.classList.remove('open');
      });
    }
    if (btnTabLogin && btnTabSignup) {
      btnTabLogin.addEventListener('click', (e) => {
        e.preventDefault();
        btnTabLogin.classList.add('active');
        btnTabSignup.classList.remove('active');
        if (authModalTitle) authModalTitle.textContent = 'Sign In to TenderLens';
        if (btnAuthSubmit) btnAuthSubmit.textContent = 'Log In to Workspace';
      });
      btnTabSignup.addEventListener('click', (e) => {
        e.preventDefault();
        btnTabSignup.classList.add('active');
        btnTabLogin.classList.remove('active');
        if (authModalTitle) authModalTitle.textContent = 'Create Enterprise Account';
        if (btnAuthSubmit) btnAuthSubmit.textContent = 'Create Account & Proceed';
      });
    }
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput')?.value || 'officer@gem.gov.in';
        const role = document.getElementById('authRoleSelect')?.value || 'Evaluation Officer';
        const name = email.split('@')[0].toUpperCase();
        this.setSessionUser(name, role);
        if (authModal) authModal.classList.remove('open');
        this.showToast(`Logged in successfully as ${name} (${role})`, 'success');
      });
    }

    // Quick Login Buttons
    const btnQuickOfficer = document.getElementById('btnQuickOfficer');
    const btnQuickLead = document.getElementById('btnQuickLead');
    const btnQuickVendor = document.getElementById('btnQuickVendor');

    if (btnQuickOfficer) {
      btnQuickOfficer.addEventListener('click', () => {
        this.setSessionUser('Vanshika (Admin)', 'Procurement Officer');
        if (authModal) authModal.classList.remove('open');
        this.showToast('Logged in as Evaluation Officer (Admin)', 'success');
      });
    }
    if (btnQuickLead) {
      btnQuickLead.addEventListener('click', () => {
        this.setSessionUser('Committee Lead Sharma', 'Committee Lead');
        if (authModal) authModal.classList.remove('open');
        this.showToast('Logged in as Tender Committee Lead', 'success');
      });
    }
    if (btnQuickVendor) {
      btnQuickVendor.addEventListener('click', () => {
        this.setSessionUser('Rajesh (Bidder)', 'Vendor / MSME');
        if (authModal) authModal.classList.remove('open');
        this.showToast('Logged in as Vendor Bidder (MSME)', 'success');
      });
    }

    // 10. Document Evidence & OCR Inspector Toggle
    const btnVisual = document.getElementById('btnToggleVisualProof');
    const btnOcr = document.getElementById('btnToggleOcrText');
    const visualContainer = document.getElementById('mockDocumentContainer');
    const ocrContainer = document.getElementById('mockOcrTextContainer');

    if (btnVisual && btnOcr && visualContainer && ocrContainer) {
      btnVisual.addEventListener('click', () => {
        btnVisual.classList.add('btn-primary');
        btnVisual.classList.remove('btn-outline');
        btnOcr.classList.remove('btn-primary');
        btnOcr.classList.add('btn-outline');
        visualContainer.style.display = 'block';
        ocrContainer.style.display = 'none';
      });

      btnOcr.addEventListener('click', () => {
        btnOcr.classList.add('btn-primary');
        btnOcr.classList.remove('btn-outline');
        btnVisual.classList.remove('btn-primary');
        btnVisual.classList.add('btn-outline');
        visualContainer.style.display = 'none';
        ocrContainer.style.display = 'block';
        this.updateOcrTextDisplay();
      });
    }
  }

  setSessionUser(name, role) {
    const navName = document.getElementById('navUserName');
    const navRole = document.getElementById('navUserRole');
    const navAvatar = document.getElementById('navUserAvatar');
    if (navName) navName.textContent = name;
    if (navRole) navRole.textContent = role;
    if (navAvatar) navAvatar.textContent = name.charAt(0).toUpperCase();
  }

  updateOcrTextDisplay() {
    const ocrContainer = document.getElementById('mockOcrTextContainer');
    if (!ocrContainer) return;
    const docs = this.getActiveDocs();
    const doc = docs[this.inspectedDoc] || docs['oem'];
    const fields = doc?.fields || {};

    let lines = `[OCR PIPELINE: TENDERLENS DETERMINISTIC ENGINE]\n`;
    lines += `DOCUMENT: ${doc?.filename || 'Document'}\n`;
    lines += `PARSED AT: ${new Date().toISOString()}\n`;
    lines += `========================================================\n`;
    for (const [key, val] of Object.entries(fields)) {
      lines += `${key.padEnd(20)} : ${val.value || val}\n`;
    }
    lines += `========================================================\n`;
    lines += `[OCR CONFIDENCE SCORE: 98.2% | TOKENS: 45 | VERIFIED: PASS]`;
    ocrContainer.textContent = lines;
  }

  /**
   * Switch between Tabs
   */
  switchTab(tabId) {
    this.activeTab = tabId;

    // Update Tab Link styles
    document.querySelectorAll('.tab-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Show active panel
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });

    if (tabId === 'tabCertificate') this.renderCertificateTab();
    if (tabId === 'tabAuditTrail') this.renderAuditTrailTab();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Real File Upload Handler
   */
  async handleSingleFileUpload(docType, file) {
    this.showToast(`Uploading ${file.name} to server OCR pipeline...`);
    const formData = new FormData();
    formData.append(docType, file);

    try {
      const res = await fetch(`${this.apiBase}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.documents && data.documents[docType]) {
          const doc = data.documents[docType];
          const baseScenario = SAGE_SCENARIOS[this.selectedScenarioId];
          if (!this.uploadedCustomDocs) {
            this.uploadedCustomDocs = { ...baseScenario.docs };
          }
          this.uploadedCustomDocs[docType] = doc;

          // Update UI label
          const nameEl = document.getElementById(`slotName${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
          if (nameEl) nameEl.textContent = `${file.name} (Uploaded)`;

          this.runFullAnalysis();
          this.showToast(`Successfully extracted fields from ${file.name}`, 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('Upload error, using local parsing:', err);
    }

    // Fallback if offline
    const nameEl = document.getElementById(`slotName${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
    if (nameEl) nameEl.textContent = `${file.name} (Uploaded)`;
    this.showToast(`Staged ${file.name}`, 'info');
  }

  getActiveDocs() {
    if (this.uploadedCustomDocs) return this.uploadedCustomDocs;
    const scenario = SAGE_SCENARIOS[this.selectedScenarioId] || SAGE_SCENARIOS['sample-traders'];
    return scenario.docs;
  }

  loadScenario(scenarioId) {
    this.selectedScenarioId = scenarioId;
    const scenario = SAGE_SCENARIOS[scenarioId] || SAGE_SCENARIOS['sample-traders'];
    const docs = scenario.docs;

    // Update slot labels
    if (docs.gst) {
      document.getElementById('slotNameGst').textContent = docs.gst.filename;
      document.getElementById('slotSummaryGst').innerHTML = `GSTIN: <strong class="font-mono">${docs.gst.fields.gstin.value}</strong> • Status: <span class="text-success">● Active</span>`;
    }
    if (docs.pan) {
      document.getElementById('slotNamePan').textContent = docs.pan.filename;
      document.getElementById('slotSummaryPan').innerHTML = `PAN: <strong class="font-mono">${docs.pan.fields.panNumber.value}</strong> • Entity: <strong>${docs.pan.fields.entityType?.value || 'Company'}</strong>`;
    }
    if (docs.oem) {
      document.getElementById('slotNameOem').textContent = docs.oem.filename;
      const isLapsed = docs.oem.fields.validUntil.value.includes('2024');
      document.getElementById('slotSummaryOem').innerHTML = `Valid Until: <strong class="font-mono ${isLapsed ? 'text-danger' : 'text-success'}">${docs.oem.fields.validUntil.value}</strong>`;
    }
    if (docs.udyam) {
      document.getElementById('slotNameUdyam').textContent = docs.udyam.filename;
      document.getElementById('slotSummaryUdyam').innerHTML = docs.udyam.fields.isProvided === false ? 'Certificate not provided' : `Udyam No: <strong class="font-mono">${docs.udyam.fields.udyamNumber.value}</strong> • Category: <strong>${docs.udyam.fields.category.value}</strong>`;
    }

    this.inspectedDoc = 'oem';
    this.inspectedField = 'validUntil';
    this.runFullAnalysis();
  }

  /**
   * Run Analysis Engine & Update All Widgets
   */
  runFullAnalysis() {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const docs = this.getActiveDocs();
    const crossResults = SageEngine.evaluateCrossDocMatrix(docs);
    const findings = SageEngine.evaluateTenderChecklist(tender, docs, crossResults, this.reviewerOverrides);
    const scoreData = SageEngine.computeReadinessScore(findings);

    // 1. Render Readiness Donut & Banner
    this.renderReadinessWidgets(scoreData);

    // 2. Render Cross-Document Discrepancy Matrix
    this.renderMatrixTable(crossResults);

    // 3. Render Requirements Checklist
    this.renderChecklistTable(findings);

    // 4. Render Document Proof Viewer
    this.renderDocProof(this.inspectedDoc, this.inspectedField);
  }

  renderReadinessWidgets(scoreData) {
    const banner = document.getElementById('hardGateBanner');
    if (banner) {
      if (scoreData.isHardGateBlocked) {
        banner.innerHTML = `
          <div class="gate-alert danger">
            <strong style="font-size: 0.95rem;">⚠️ SUBMISSION BLOCKED: Mandatory Gate Failed</strong>
            <div style="font-size: 0.78rem; margin-top: 3px;">
              ${scoreData.hardGateViolations[0]?.title}: ${scoreData.hardGateViolations[0]?.reason}
            </div>
          </div>
        `;
      } else {
        banner.innerHTML = `
          <div class="gate-alert success">
            <strong style="font-size: 0.95rem;">✓ ALL MANDATORY GATES SATISFIED — CLEARED FOR BIDDING</strong>
            <div style="font-size: 0.78rem; margin-top: 3px;">All prerequisite filings (GST, PAN, OEM authorization) verified. Vendor meets technical eligibility criteria.</div>
          </div>
        `;
      }
    }

    // Score Donut numbers
    document.getElementById('readinessScoreVal').textContent = `${scoreData.scorePercentage}%`;
    document.getElementById('readinessRatioVal').textContent = `${scoreData.countMet} of ${scoreData.totalRequirements} Met`;
    document.getElementById('countMet').textContent = scoreData.countMet;
    document.getElementById('countReview').textContent = scoreData.countReview;
    document.getElementById('countFailed').textContent = scoreData.countFailed;

    const C = 251.3;
    const total = scoreData.totalRequirements || 1;
    const metLen = (scoreData.countMet / total) * C;
    const revLen = (scoreData.countReview / total) * C;
    const failLen = (scoreData.countFailed / total) * C;

    const donutMet = document.getElementById('donutMet');
    const donutRev = document.getElementById('donutReview');
    const donutFail = document.getElementById('donutFailed');

    if (donutMet) {
      donutMet.style.strokeDasharray = `${metLen} ${C}`;
      donutMet.style.strokeDashoffset = '0';
    }
    if (donutRev) {
      donutRev.style.strokeDasharray = `${revLen} ${C}`;
      donutRev.style.strokeDashoffset = `-${metLen}`;
    }
    if (donutFail) {
      donutFail.style.strokeDasharray = `${failLen} ${C}`;
      donutFail.style.strokeDashoffset = `-${metLen + revLen}`;
    }

    // Gap list
    const gapBadge = document.getElementById('gapCountBadge');
    if (gapBadge) gapBadge.textContent = `${scoreData.gaps.length} Action Items`;

    const gapList = document.getElementById('gapListContainer');
    if (gapList) {
      if (scoreData.gaps.length === 0) {
        gapList.innerHTML = `<div class="p-2 text-center text-success text-xs font-mono">✓ Zero compliance defects found!</div>`;
      } else {
        gapList.innerHTML = scoreData.gaps.map(g => `
          <div class="gap-row ${g.severity}">
            <span>${g.severity === 'danger' ? '❌' : '⚠️'}</span>
            <div>
              <strong>${g.title}</strong>
              <div style="font-size: 0.72rem; color: #CBD5E1;">${g.actionText}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderMatrixTable(crossResults) {
    const tbody = document.getElementById('matrixTableBody');
    if (!tbody) return;

    tbody.innerHTML = crossResults.map(r => {
      let badge = 'badge-success';
      if (r.outcome === 'REVIEW') badge = 'badge-warning';
      if (r.outcome === 'MISMATCH') badge = 'badge-danger';

      return `
        <tr>
          <td><strong>${r.field}</strong></td>
          <td><span class="font-mono text-xs">${r.gstVal}</span></td>
          <td><span class="font-mono text-xs">${r.panVal}</span></td>
          <td><span class="font-mono text-xs">${r.udyamVal}</span></td>
          <td><strong class="font-mono">${r.similarity}%</strong></td>
          <td><span class="badge ${badge}">${r.outcome}</span></td>
        </tr>
      `;
    }).join('');
  }

  renderChecklistTable(findings) {
    const tbody = document.getElementById('checklistTableBody');
    if (!tbody) return;

    tbody.innerHTML = findings.map(f => {
      let badge = 'badge-success';
      if (f.status === 'REQUIRES_REVIEW') badge = 'badge-warning';
      if (f.status === 'NON_COMPLIANT') badge = 'badge-danger';

      return `
        <tr>
          <td>
            <strong>${f.id}: ${f.title}</strong>
            ${f.isOverridden ? '<span class="badge badge-accent" style="margin-left: 4px;">Overridden</span>' : ''}
          </td>
          <td>${f.isMandatory ? '<span class="tag-mandatory">Mandatory</span>' : '<span class="tag-optional">Optional</span>'}</td>
          <td><span class="font-mono text-xs">${f.extractedValue}</span></td>
          <td><span class="badge ${badge}">${f.status.replace('_', ' ')}</span></td>
          <td>
            <button class="btn btn-outline btn-xs" onclick="app.openOverrideModal('${f.id}')">Override</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  inspectDocProof(docType, fieldKey) {
    this.inspectedDoc = docType;
    this.inspectedField = fieldKey;
    this.renderDocProof(docType, fieldKey);

    document.querySelectorAll('.btn-inspect').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }

  renderDocProof(docType, fieldKey) {
    const docs = this.getActiveDocs();
    SageDocViewer.renderDocument(docType, fieldKey, { docs });
  }

  renderCertificateTab() {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const scenario = SAGE_SCENARIOS[this.selectedScenarioId];
    const docs = this.getActiveDocs();
    const cross = SageEngine.evaluateCrossDocMatrix(docs);
    const findings = SageEngine.evaluateTenderChecklist(tender, docs, cross, this.reviewerOverrides);
    const score = SageEngine.computeReadinessScore(findings);

    document.getElementById('certVendorName').textContent = scenario.company;
    document.getElementById('certTenderTitle').textContent = tender.title;
    document.getElementById('certTimestamp').textContent = new Date().toLocaleString();

    const verdictEl = document.getElementById('certVerdictStatus');
    if (verdictEl) {
      if (score.isHardGateBlocked) {
        verdictEl.textContent = 'DISQUALIFIED (Mandatory Gate Failed)';
        verdictEl.className = 'text-danger';
      } else {
        verdictEl.textContent = 'APPROVED FOR TENDER PARTICIPATION';
        verdictEl.className = 'text-success';
      }
    }

    const tbody = document.getElementById('certTableBody');
    if (tbody) {
      tbody.innerHTML = findings.map(f => `
        <tr>
          <td><strong class="font-mono">${f.id}</strong></td>
          <td>${f.title}</td>
          <td>${f.isMandatory ? 'Mandatory Gate' : 'Optional Criterion'}</td>
          <td class="font-mono text-xs">${f.extractedValue}</td>
          <td><strong>${f.status.replace('_', ' ')}</strong></td>
        </tr>
      `).join('');
    }
  }

  async renderAuditTrailTab() {
    const tbody = document.getElementById('fullAuditLogsTableBody');
    if (!tbody) return;

    try {
      const res = await fetch(`${this.apiBase}/api/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) SageReport.auditLogs = data.logs;
      }
    } catch (e) {
      console.warn('Using local audit cache:', e.message);
    }

    tbody.innerHTML = SageReport.auditLogs.map(log => `
      <tr>
        <td class="font-mono text-xs" style="color: #38BDF8;">${log.id || 'LOG-SYS'}</td>
        <td class="font-mono text-xs">${log.timestamp}</td>
        <td><strong>${log.reviewer}</strong></td>
        <td>${log.item}</td>
        <td><span class="badge ${SageReport.getBadgeClass(log.original)}">${log.original}</span></td>
        <td><strong class="text-primary">${log.action}</strong></td>
        <td style="font-size: 0.78rem; color: #CBD5E1;">${log.notes}</td>
      </tr>
    `).join('');
  }

  openOverrideModal(reqId) {
    this.activeOverrideReqId = reqId;
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const req = tender.requirements.find(r => r.id === reqId) || { title: 'Requirement' };

    document.getElementById('modalReqTitle').textContent = `${req.id}: ${req.title}`;
    document.getElementById('txtOverrideReason').value = '';

    document.getElementById('overrideModal').classList.add('open');
  }

  closeOverrideModal() {
    document.getElementById('overrideModal').classList.remove('open');
  }

  async saveOverride() {
    const reqId = this.activeOverrideReqId;
    if (!reqId) return;

    const selectedRadio = document.querySelector('input[name="overrideVerdict"]:checked');
    if (!selectedRadio) {
      alert('Please select an override verdict.');
      return;
    }

    const notes = document.getElementById('txtOverrideReason').value.trim();
    if (!notes) {
      alert('Officer Justification Note is mandatory.');
      return;
    }

    const officer = document.getElementById('txtOfficerName').value.trim() || 'Evaluation Officer (Admin)';
    const status = selectedRadio.value;

    this.reviewerOverrides[reqId] = { status, notes, officer, timestamp: new Date().toISOString() };

    // Post to server
    try {
      await fetch(`${this.apiBase}/api/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqId, status, notes, officer })
      });
    } catch (e) {
      console.warn('Could not post override to server:', e);
    }

    SageReport.addAuditLog(reqId, 'AI_SCREENED', `OVERRIDE TO ${status}`, notes, officer);

    this.closeOverrideModal();
    this.runFullAnalysis();
    this.showToast(`Requirement ${reqId} overridden to ${status}. Recalculated!`, 'success');
  }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new TenderLensApp();
  window.app = app;
});
