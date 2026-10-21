/**
 * TenderLens - Enterprise Client Application Controller
 * Full-stack integration with TenderLens Express REST API
 */

class TenderLensApp {
  constructor() {
    this.currentStep = 1;
    this.selectedTenderId = 'gem-it';
    this.selectedScenarioId = 'sample-traders';
    this.reviewerOverrides = {};
    this.activeInspectedField = { docType: 'oem', fieldKey: 'validUntil' };
    this.uploadedCustomDocs = null;
    this.apiBase = window.location.origin;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkApiHealth();
    await this.fetchTenders();
    await this.loadScenario(this.selectedScenarioId);
    this.renderStep1();
  }

  async checkApiHealth() {
    try {
      const res = await fetch(`${this.apiBase}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        document.getElementById('apiStatusPill').innerHTML = `
          <span class="dot-live"></span>
          <span class="status-text">Backend API Live: <strong>${window.location.port || '8080'}</strong> (${data.stats.vendorsScreened} Screened)</span>
        `;
      }
    } catch (e) {
      console.warn('API health check fallback to local engine mode:', e.message);
    }
  }

  async fetchTenders() {
    try {
      const res = await fetch(`${this.apiBase}/api/tenders`);
      if (res.ok) {
        const data = await res.json();
        if (data.tenders) {
          // Update global tenders cache
          Object.assign(SAGE_TENDERS, data.tenders);
        }
      }
    } catch (e) {
      console.warn('Using local tenders cache:', e.message);
    }
  }

  setupEventListeners() {
    // Pipeline Navigation Buttons
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        this.goToStep(step);
      });
    });

    // Preset Scenario Selector Buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.uploadedCustomDocs = null;
        this.loadScenario(btn.dataset.preset);
      });
    });

    // Sample Files Drawer Toggle
    const toggleSampleBtn = document.getElementById('toggleSampleFilesBtn');
    const drawer = document.getElementById('sampleFilesDrawer');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    if (toggleSampleBtn && drawer) {
      toggleSampleBtn.addEventListener('click', () => {
        drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      });
    }
    if (closeDrawerBtn && drawer) {
      closeDrawerBtn.addEventListener('click', () => {
        drawer.style.display = 'none';
      });
    }

    // Quick Preset Button in nav bar
    const quickBtn = document.getElementById('quickPresetBtn');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => {
        const banner = document.getElementById('scenarioBanner');
        banner.style.display = banner.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Reset button
    const resetBtn = document.getElementById('resetAppBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reviewerOverrides = {};
        this.uploadedCustomDocs = null;
        this.loadScenario('sample-traders');
        this.goToStep(1);
      });
    }

    // Tender Selection Dropdown
    const tenderSelect = document.getElementById('tenderSelect');
    if (tenderSelect) {
      tenderSelect.addEventListener('change', (e) => {
        this.selectedTenderId = e.target.value;
        this.renderStep1();
      });
    }

    // Real File Upload Detection & UI update
    ['Gst', 'Pan', 'Udyam', 'Startup', 'Oem'].forEach(type => {
      const input = document.getElementById(`fileInput${type}`);
      if (input) {
        input.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            const nameEl = document.getElementById(`slotFilename${type}`);
            const metaEl = document.getElementById(`slotMeta${type}`);
            if (nameEl) nameEl.textContent = `${f.name} (Staged for Upload)`;
            if (metaEl) metaEl.textContent = `Size: ${Math.round(f.size / 1024)} KB • Real User Upload`;
          }
        });
      }
    });

    // Step 1: Start Pipeline Button (Triggers REAL server upload if files are selected!)
    const startBtn = document.getElementById('startExtractionBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        await this.handlePipelineExecution();
      });
    }

    // Step 1: Reload Active Benchmark
    const loadPresetBtn = document.getElementById('loadSelectedPresetBtn');
    if (loadPresetBtn) {
      loadPresetBtn.addEventListener('click', () => {
        this.uploadedCustomDocs = null;
        this.loadScenario(this.selectedScenarioId);
      });
    }

    // Pipeline navigation buttons
    const step2Back = document.getElementById('step2BackBtn');
    const step2Next = document.getElementById('step2NextBtn');
    if (step2Back) step2Back.addEventListener('click', () => this.goToStep(1));
    if (step2Next) step2Next.addEventListener('click', () => this.goToStep(3));

    const step3Back = document.getElementById('step3BackBtn');
    const step3Next = document.getElementById('step3NextBtn');
    if (step3Back) step3Back.addEventListener('click', () => this.goToStep(2));
    if (step3Next) step3Next.addEventListener('click', () => this.goToStep(4));

    const step4Back = document.getElementById('step4BackBtn');
    const step4Next = document.getElementById('step4NextBtn');
    if (step4Back) step4Back.addEventListener('click', () => this.goToStep(3));
    if (step4Next) step4Next.addEventListener('click', () => this.goToStep(5));

    // Evaluation Filter Pills (Step 4)
    document.querySelectorAll('.filter-pills .pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pills .pill-btn').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderStep4EvaluationTable(pill.dataset.filter);
      });
    });

    // Step 3 Quick Action Buttons
    const btnApproveName = document.getElementById('btnApproveNameVariance');
    const btnRejectName = document.getElementById('btnRejectNameVariance');
    if (btnApproveName) {
      btnApproveName.addEventListener('click', () => {
        this.applyDirectOverride(
          'REQ-04',
          'COMPLIANT',
          'Approved variance: "Sample Trader Enterprises" confirmed as registered trade name of "Sample Traders Pvt Ltd".',
          'Evaluation Officer (Admin)'
        );
      });
    }

    if (btnRejectName) {
      btnRejectName.addEventListener('click', () => {
        this.applyDirectOverride(
          'REQ-04',
          'NON_COMPLIANT',
          'Clarification required: Discrepancy between private limited entity and enterprise trade name.',
          'Evaluation Officer (Admin)'
        );
      });
    }

    // Modal Events
    const modalClose = document.getElementById('modalCloseBtn');
    const modalCancel = document.getElementById('modalCancelBtn');
    const modalSave = document.getElementById('modalSaveOverrideBtn');
    if (modalClose) modalClose.addEventListener('click', () => this.closeOverrideModal());
    if (modalCancel) modalCancel.addEventListener('click', () => this.closeOverrideModal());
    if (modalSave) modalSave.addEventListener('click', () => this.saveModalOverride());

    // Export JSON Button
    const exportJson = document.getElementById('exportJsonBtn');
    if (exportJson) {
      exportJson.addEventListener('click', () => {
        const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
        const activeDocs = this.getActiveDocs();
        const cross = SageEngine.evaluateCrossDocMatrix(activeDocs);
        const findings = SageEngine.evaluateTenderChecklist(tender, activeDocs, cross, this.reviewerOverrides);
        const score = SageEngine.computeReadinessScore(findings);
        const scenario = SAGE_SCENARIOS[this.selectedScenarioId];
        SageReport.exportJsonAuditTrail(tender, scenario, findings, score);
      });
    }
  }

  /**
   * Real File Upload & Execution Handler
   */
  async handlePipelineExecution() {
    const fileGst = document.getElementById('fileInputGst')?.files[0];
    const filePan = document.getElementById('fileInputPan')?.files[0];
    const fileUdyam = document.getElementById('fileInputUdyam')?.files[0];
    const fileStartup = document.getElementById('fileInputStartup')?.files[0];
    const fileOem = document.getElementById('fileInputOem')?.files[0];

    const hasAnyRealFile = fileGst || filePan || fileUdyam || fileStartup || fileOem;

    if (hasAnyRealFile) {
      const formData = new FormData();
      if (fileGst) formData.append('gst', fileGst);
      if (filePan) formData.append('pan', filePan);
      if (fileUdyam) formData.append('udyam', fileUdyam);
      if (fileStartup) formData.append('startup', fileStartup);
      if (fileOem) formData.append('oem', fileOem);

      const btn = document.getElementById('startExtractionBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span>Uploading & Parsing Real Files via API...</span>`;
      btn.disabled = true;

      try {
        const res = await fetch(`${this.apiBase}/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.documents && Object.keys(data.documents).length > 0) {
            // Merge uploaded docs with base scenario
            const baseScenario = SAGE_SCENARIOS[this.selectedScenarioId];
            this.uploadedCustomDocs = { ...baseScenario.docs, ...data.documents };
          }
        }
      } catch (err) {
        console.error('File upload failed, falling back to local simulated processing:', err);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }

    this.goToStep(2);
  }

  getActiveDocs() {
    if (this.uploadedCustomDocs) return this.uploadedCustomDocs;
    const scenario = SAGE_SCENARIOS[this.selectedScenarioId] || SAGE_SCENARIOS['sample-traders'];
    return scenario.docs;
  }

  goToStep(stepNumber) {
    this.currentStep = stepNumber;

    document.querySelectorAll('.step-btn').forEach(btn => {
      const step = parseInt(btn.dataset.step, 10);
      btn.classList.toggle('active', step === stepNumber);
      btn.classList.toggle('completed', step < stepNumber);
    });

    document.querySelectorAll('.step-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`viewStep${stepNumber}`);
    if (targetView) targetView.classList.add('active');

    if (stepNumber === 1) this.renderStep1();
    if (stepNumber === 2) this.renderStep2();
    if (stepNumber === 3) this.renderStep3();
    if (stepNumber === 4) this.renderStep4();
    if (stepNumber === 5) this.renderStep5();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async loadScenario(scenarioId) {
    this.selectedScenarioId = scenarioId;

    try {
      const res = await fetch(`${this.apiBase}/api/scenarios/${scenarioId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.scenario) {
          SAGE_SCENARIOS[scenarioId] = data.scenario;
        }
      }
    } catch (e) {
      console.warn('Using local scenario cache:', e.message);
    }

    const scenario = SAGE_SCENARIOS[scenarioId] || SAGE_SCENARIOS['sample-traders'];
    const docs = scenario.docs;

    if (docs.gst) {
      document.getElementById('slotFilenameGst').textContent = docs.gst.filename;
      document.getElementById('slotMetaGst').textContent = `Size: ${docs.gst.fileSize} • ${docs.gst.formType}`;
    }
    if (docs.pan) {
      document.getElementById('slotFilenamePan').textContent = docs.pan.filename;
      document.getElementById('slotMetaPan').textContent = `Size: ${docs.pan.fileSize} • ${docs.pan.formType}`;
    }
    if (docs.udyam) {
      document.getElementById('slotFilenameUdyam').textContent = docs.udyam.filename;
      document.getElementById('slotMetaUdyam').textContent = docs.udyam.fields?.isProvided === false ? 'Not submitted / unreadable' : `Size: ${docs.udyam.fileSize} • ${docs.udyam.formType}`;
    }
    if (docs.startup) {
      document.getElementById('slotFilenameStartup').textContent = docs.startup.filename;
      document.getElementById('slotMetaStartup').textContent = docs.startup.fields?.isProvided ? `Size: ${docs.startup.fileSize} • DPIIT Registered` : 'Not submitted (Optional)';
    }
    if (docs.oem) {
      document.getElementById('slotFilenameOem').textContent = docs.oem.filename;
      document.getElementById('slotMetaOem').textContent = `Size: ${docs.oem.fileSize} • ${docs.oem.formType}`;
    }

    this.activeInspectedField = { docType: 'oem', fieldKey: 'validUntil' };
    this.refreshAllCalculations();
  }

  refreshAllCalculations() {
    if (this.currentStep === 2) this.renderStep2();
    if (this.currentStep === 3) this.renderStep3();
    if (this.currentStep === 4) this.renderStep4();
    if (this.currentStep === 5) this.renderStep5();
  }

  /* =========================================================================
     STEP 1: RENDER TENDER CHECKLIST & METADATA
     ========================================================================= */
  renderStep1() {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const list = document.getElementById('tenderRequirementsList');
    const reqCount = document.getElementById('reqCount');

    // Update metadata card
    const authText = document.getElementById('tenderAuthorityText');
    const deadText = document.getElementById('tenderDeadlineText');
    const budText = document.getElementById('tenderBudgetText');
    const badgeText = document.getElementById('activeTenderBadge');

    if (authText) authText.textContent = tender.authority || 'Government Evaluation Authority';
    if (deadText) deadText.textContent = `${tender.deadline} (Strict Submission Cutoff)`;
    if (budText) budText.textContent = tender.budgetEstimate || '₹ 14.50 Crores';
    if (badgeText) badgeText.textContent = tender.title.split(':')[0];
    if (reqCount) reqCount.textContent = tender.requirements.length;

    if (list) {
      list.innerHTML = tender.requirements.map(r => `
        <div class="req-item ${r.isMandatory ? 'mandatory' : 'optional'}">
          <div>
            <strong>${r.id}: ${r.title}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              ${r.ruleDescription}
            </div>
          </div>
          <div class="req-meta">
            ${r.isMandatory ? '<span class="req-badge gate">MANDATORY GATE</span>' : '<span class="req-badge">OPTIONAL</span>'}
            <span class="req-badge weight">Weight: ${r.weight}%</span>
          </div>
        </div>
      `).join('');
    }
  }

  /* =========================================================================
     STEP 2: RENDER OCR FIELD EXTRACTION & PROOF INSPECTOR
     ========================================================================= */
  renderStep2() {
    const docs = this.getActiveDocs();
    const container = document.getElementById('extractionCardsContainer');
    if (!container) return;

    const docKeys = [
      { key: 'oem', title: 'OEM Authorization Letter (MAF)', badge: 'Mandatory' },
      { key: 'gst', title: 'GST Registration Certificate (REG-06)', badge: 'Mandatory' },
      { key: 'pan', title: 'Income Tax PAN Card', badge: 'Mandatory' },
      { key: 'udyam', title: 'Udyam MSME Certificate', badge: 'Optional' }
    ];

    container.innerHTML = docKeys.map(d => {
      const doc = docs[d.key];
      if (!doc || !doc.fields) return '';

      const fieldsHtml = Object.entries(doc.fields)
        .filter(([k, v]) => v && typeof v === 'object' && v.value)
        .map(([fieldKey, f]) => {
          const isSelected = this.activeInspectedField.docType === d.key && this.activeInspectedField.fieldKey === fieldKey;
          const confClass = f.conf > 90 ? '' : 'amber';
          return `
            <div class="field-pill-card ${isSelected ? 'selected' : ''}" 
                 onclick="app.inspectDocument('${d.key}', '${fieldKey}')">
              <div class="field-label-row">
                <span>${fieldKey.toUpperCase()}</span>
                <span class="field-conf ${confClass}">Conf: ${f.conf}%</span>
              </div>
              <div class="field-value">${f.value}</div>
              <div class="field-source-sub">${f.source || 'Doc Coordinate'}</div>
            </div>
          `;
        }).join('');

      return `
        <div class="doc-extract-card">
          <div class="doc-extract-header">
            <span class="doc-name-badge">
              📄 ${d.title}
              <span class="tag-req">${d.badge}</span>
            </span>
            <span class="code-font" style="font-size: 0.75rem; color: #38BDF8;">${doc.filename}</span>
          </div>
          <div class="extracted-fields-grid">
            ${fieldsHtml}
          </div>
        </div>
      `;
    }).join('');

    const scenario = { docs };
    SageDocViewer.renderDocument(this.activeInspectedField.docType, this.activeInspectedField.fieldKey, scenario);
  }

  inspectDocument(docType, fieldKey) {
    this.activeInspectedField = { docType, fieldKey };
    const docs = this.getActiveDocs();
    SageDocViewer.renderDocument(docType, fieldKey, { docs });
    document.querySelectorAll('.field-pill-card').forEach(el => el.classList.remove('selected'));
  }

  /* =========================================================================
     STEP 3: RENDER CROSS-DOCUMENT MISMATCH MATRIX
     ========================================================================= */
  renderStep3() {
    const docs = this.getActiveDocs();
    const results = SageEngine.evaluateCrossDocMatrix(docs);
    const tbody = document.getElementById('crossDocTableBody');
    if (!tbody) return;

    tbody.innerHTML = results.map(row => {
      let badgeClass = 'badge-success';
      if (row.outcome === 'REVIEW') badgeClass = 'badge-warning';
      if (row.outcome === 'MISMATCH') badgeClass = 'badge-danger';

      return `
        <tr>
          <td><strong>${row.field}</strong></td>
          <td><span class="code-pill">${row.gstVal}</span></td>
          <td><span class="code-pill">${row.panVal}</span></td>
          <td><span class="code-pill">${row.udyamVal}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-family: monospace; font-weight: 700;">${row.similarity}%</span>
              <div style="flex: 1; height: 5px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="width: ${row.similarity}%; height: 100%; background: ${row.similarity > 85 ? '#10B981' : (row.similarity > 65 ? '#F59E0B' : '#EF4444')};"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${badgeClass}">${row.outcome}</span>
          </td>
        </tr>
      `;
    }).join('');

    const reconCard = document.getElementById('mismatchDetailCard');
    const hasVariance = results.some(r => r.outcome === 'REVIEW' || r.outcome === 'MISMATCH');
    if (reconCard) reconCard.style.display = hasVariance ? 'block' : 'none';
  }

  /* =========================================================================
     STEP 4: RENDER READINESS SCORE & GAP ANALYSIS (HARD GATES)
     ========================================================================= */
  renderStep4() {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const docs = this.getActiveDocs();
    const crossResults = SageEngine.evaluateCrossDocMatrix(docs);
    const findings = SageEngine.evaluateTenderChecklist(tender, docs, crossResults, this.reviewerOverrides);
    const scoreData = SageEngine.computeReadinessScore(findings);

    // Hard Gate Banner
    const gateBanner = document.getElementById('hardGateBanner');
    if (gateBanner) {
      if (scoreData.isHardGateBlocked) {
        const violationsList = scoreData.hardGateViolations.map(v => `<strong>${v.title}</strong>: ${v.reason}`).join('; ');
        gateBanner.innerHTML = `
          <div class="gate-alert danger">
            <div>
              <strong style="color: #EF4444; font-size: 0.95rem;">⚠️ MANDATORY HARD GATE TRIGGERED — SUBMISSION BLOCKED</strong>
              <div style="font-size: 0.8rem; margin-top: 3px;">
                ${scoreData.hardGateViolations.length} prerequisite mandatory rule(s) failed. In accordance with public procurement guidelines, bidders with failed hard gates are strictly disqualified from commercial tender participation.
                <div style="margin-top: 4px; color: #FCA5A5;">${violationsList}</div>
              </div>
            </div>
            <span class="badge badge-danger">DISQUALIFIED FOR BIDDING</span>
          </div>
        `;
      } else {
        gateBanner.innerHTML = `
          <div class="gate-alert success">
            <div>
              <strong style="color: #10B981; font-size: 0.95rem;">✓ ALL MANDATORY HARD GATES SATISFIED</strong>
              <div style="font-size: 0.8rem; margin-top: 3px;">All statutory documents (GST, PAN, OEM Authorization) meet eligibility criteria. Vendor is technically cleared for tender award consideration.</div>
            </div>
            <span class="badge badge-success">CLEARED FOR SUBMISSION</span>
          </div>
        `;
      }
    }

    // Score Donut Values
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

    // Gap List
    const gapContainer = document.getElementById('gapListContainer');
    const gapBadge = document.getElementById('gapCountBadge');
    if (gapBadge) gapBadge.textContent = `${scoreData.gaps.length} Action Items`;

    if (gapContainer) {
      if (scoreData.gaps.length === 0) {
        gapContainer.innerHTML = `
          <div class="p-3 text-center" style="color: #10B981; font-weight: 600;">
            ✓ Zero compliance gaps detected! All documents 100% verified against tender criteria.
          </div>
        `;
      } else {
        gapContainer.innerHTML = scoreData.gaps.map(g => `
          <div class="gap-item ${g.severity}">
            <div class="gap-icon">${g.severity === 'danger' ? '❌' : '⚠️'}</div>
            <div>
              <div class="gap-title">${g.title} ${g.isMandatory ? '<span class="tag-req">Hard Gate</span>' : ''}</div>
              <div class="gap-action-text">${g.actionText}</div>
            </div>
          </div>
        `).join('');
      }
    }

    this.renderStep4EvaluationTable('all');
  }

  renderStep4EvaluationTable(filter = 'all') {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const docs = this.getActiveDocs();
    const crossResults = SageEngine.evaluateCrossDocMatrix(docs);
    const findings = SageEngine.evaluateTenderChecklist(tender, docs, crossResults, this.reviewerOverrides);
    const tbody = document.getElementById('evalTableBody');
    if (!tbody) return;

    let filtered = findings;
    if (filter === 'mandatory') filtered = findings.filter(f => f.isMandatory);
    if (filter === 'failed') filtered = findings.filter(f => f.status !== 'COMPLIANT');

    tbody.innerHTML = filtered.map(f => {
      let badgeClass = 'badge-success';
      if (f.status === 'REQUIRES_REVIEW') badgeClass = 'badge-warning';
      if (f.status === 'NON_COMPLIANT') badgeClass = 'badge-danger';

      return `
        <tr>
          <td>
            <strong>${f.id}: ${f.title}</strong>
            ${f.isOverridden ? '<span class="badge badge-accent" style="margin-left: 6px;">Overridden</span>' : ''}
          </td>
          <td>${f.isMandatory ? '<span class="tag-req">Mandatory (' + f.weight + '%)</span>' : '<span class="tag-opt">Optional (' + f.weight + '%)</span>'}</td>
          <td><span class="code-pill">${f.extractedValue}</span></td>
          <td style="font-size: 0.75rem; color: #94A3B8;">${f.ruleApplied}</td>
          <td><span class="badge ${badgeClass}">${f.status.replace('_', ' ')}</span></td>
          <td>
            <button class="btn btn-outline btn-xs" onclick="app.openOverrideModal('${f.id}')">
              Review / Override
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* =========================================================================
     STEP 5: RENDER AUDIT REPORT & PERSISTENT AUDIT TRAIL
     ========================================================================= */
  async renderStep5() {
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const docs = this.getActiveDocs();
    const crossResults = SageEngine.evaluateCrossDocMatrix(docs);
    const findings = SageEngine.evaluateTenderChecklist(tender, docs, crossResults, this.reviewerOverrides);

    SageReport.renderFindings(findings);

    // Fetch real audit trail from backend
    try {
      const res = await fetch(`${this.apiBase}/api/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          SageReport.auditLogs = data.logs;
        }
      }
    } catch (e) {
      console.warn('Using local audit logs cache:', e.message);
    }

    SageReport.renderAuditLogs();
  }

  /* =========================================================================
     HUMAN-IN-THE-LOOP OVERRIDE MODAL & API INTEGRATION
     ========================================================================= */
  openOverrideModal(reqId) {
    this.activeOverrideReqId = reqId;
    const tender = SAGE_TENDERS[this.selectedTenderId] || SAGE_TENDERS['gem-it'];
    const req = tender.requirements.find(r => r.id === reqId) || { title: 'Tender Requirement' };

    const modal = document.getElementById('overrideModal');
    const titleEl = document.getElementById('modalReqText');
    if (titleEl) titleEl.textContent = `${req.id}: ${req.title}`;

    const notesInput = document.getElementById('overrideNotes');
    if (notesInput) notesInput.value = '';

    modal.classList.add('open');
  }

  closeOverrideModal() {
    const modal = document.getElementById('overrideModal');
    modal.classList.remove('open');
  }

  async saveModalOverride() {
    const reqId = this.activeOverrideReqId;
    if (!reqId) return;

    const selectedRadio = document.querySelector('input[name="overrideStatus"]:checked');
    if (!selectedRadio) {
      alert('Please select a new status verdict.');
      return;
    }

    const notes = document.getElementById('overrideNotes').value.trim();
    if (!notes) {
      alert('Reviewer Justification Note is mandatory for procurement compliance auditing.');
      return;
    }

    const officerName = document.getElementById('reviewerOfficerName').value.trim() || 'Evaluation Officer (Admin)';
    const newStatus = selectedRadio.value;

    await this.applyDirectOverride(reqId, newStatus, notes, officerName);
    this.closeOverrideModal();
  }

  async applyDirectOverride(reqId, newStatus, notes, officerName) {
    this.reviewerOverrides[reqId] = {
      status: newStatus,
      notes: notes,
      officer: officerName,
      timestamp: new Date().toISOString()
    };

    // Save to server API
    try {
      await fetch(`${this.apiBase}/api/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reqId,
          status: newStatus,
          notes,
          officer: officerName
        })
      });
    } catch (err) {
      console.warn('Could not post override to server, stored locally:', err);
    }

    SageReport.addAuditLog(
      reqId,
      'AI SCREENED',
      `OVERRIDE TO ${newStatus}`,
      notes,
      officerName
    );

    this.refreshAllCalculations();
  }
}

// Instantiate global app
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new TenderLensApp();
});
