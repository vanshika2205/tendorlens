/**
 * SageStack - Report Generator & Audit Trail Exporter
 * Implements Evidence Findings (Slide 6), Human-in-the-Loop Override, and JSON export
 */

const SageReport = {
  auditLogs: [
    {
      timestamp: '2026-10-21 17:15:02',
      reviewer: 'System Pipeline (Auto-OCR)',
      item: 'OEM Authorization Letter',
      original: 'PENDING',
      action: 'NON_COMPLIANT Flagged',
      notes: 'Lapsed validity date detected: 31 Mar 2024 < Tender Deadline 31 Dec 2026'
    },
    {
      timestamp: '2026-10-21 17:15:03',
      reviewer: 'System Pipeline (Cross-Doc)',
      item: 'Legal Name Consistency',
      original: 'PENDING',
      action: 'REQUIRES_REVIEW Flagged',
      notes: 'Variance across GST ("Sample Traders Pvt Ltd") and Udyam ("Sample Trader Enterprises")'
    }
  ],

  addAuditLog(itemTitle, originalState, actionTaken, notes, officerName) {
    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').substring(0, 19);
    this.auditLogs.unshift({
      timestamp: ts,
      reviewer: officerName || 'Procurement Reviewer',
      item: itemTitle,
      original: originalState,
      action: actionTaken,
      notes: notes || 'Manual verification confirmed.'
    });
  },

  renderAuditLogs() {
    const tbody = document.getElementById('auditLogTableBody');
    if (!tbody) return;

    if (this.auditLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No audit events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.auditLogs.map(log => `
      <tr>
        <td style="font-family: monospace; font-size: 0.72rem; color: #94A3B8;">${log.timestamp}</td>
        <td><strong>${log.reviewer}</strong></td>
        <td>${log.item}</td>
        <td><span class="badge ${this.getBadgeClass(log.original)}">${log.original}</span></td>
        <td><strong style="color: #38BDF8;">${log.action}</strong></td>
        <td style="font-size: 0.78rem; color: #CBD5E1;">${log.notes}</td>
      </tr>
    `).join('');
  },

  getBadgeClass(status) {
    switch (status) {
      case 'COMPLIANT': return 'badge-success';
      case 'REQUIRES_REVIEW': return 'badge-warning';
      case 'NON_COMPLIANT': return 'badge-danger';
      default: return 'badge-primary';
    }
  },

  /**
   * Render Evidence-Based Findings (Slide 6 Showcase)
   */
  renderFindings(findings) {
    const container = document.getElementById('findingsContainer');
    if (!container) return;

    // Filter to critical or interesting findings
    const nonCompliantAndReview = findings.filter(f => f.status !== 'COMPLIANT');
    const displayList = nonCompliantAndReview.length > 0 ? nonCompliantAndReview : findings.slice(0, 3);

    container.innerHTML = displayList.map((f, idx) => {
      const isDanger = f.status === 'NON_COMPLIANT';
      const isWarning = f.status === 'REQUIRES_REVIEW';
      const cardType = isDanger ? 'danger' : (isWarning ? 'warning' : 'success');

      return `
        <div class="finding-card ${cardType}">
          <div class="finding-header">
            <div class="finding-title-row">
              <span class="finding-id">Finding ${idx + 1} | ${f.title}</span>
              <span class="badge ${this.getBadgeClass(f.status)}">${f.status.replace('_', ' ')}</span>
              ${f.isMandatory ? '<span class="tag-req">Hard Gate</span>' : '<span class="tag-opt">Optional</span>'}
              ${f.isOverridden ? '<span class="badge badge-accent">Human Overridden</span>' : ''}
            </div>
            <div class="finding-source-tag">${f.source || 'Document Source'}</div>
          </div>

          <div class="finding-body-grid">
            <div class="finding-block">
              <span class="f-label">REQUIREMENT</span>
              <span class="f-val">${f.title}</span>
            </div>
            <div class="finding-block ${isDanger ? 'highlight-danger' : ''}">
              <span class="f-label">EXTRACTED VALUE</span>
              <span class="f-val font-mono">${f.extractedValue}</span>
            </div>
            <div class="finding-block">
              <span class="f-label">SOURCE ANCHOR</span>
              <span class="f-val code-font">${f.source}</span>
            </div>
            <div class="finding-block">
              <span class="f-label">RULE APPLIED</span>
              <span class="f-val">${f.ruleApplied || f.ruleDescription}</span>
            </div>
          </div>

          <div class="finding-footer">
            <div class="finding-review-action">
              <span class="action-prompt">REVIEWER ACTION:</span>
              <span>${f.reviewAction || 'Review document coordinates and confirm status.'}</span>
            </div>
            <div class="finding-buttons">
              <button class="btn btn-sm btn-outline-primary" onclick="app.inspectDocument('${f.docType === 'cross_doc' ? 'gst' : f.docType}', '${f.checkField}')">
                View Visual Proof
              </button>
              <button class="btn btn-sm btn-outline-warning" onclick="app.openOverrideModal('${f.id}')">
                Reviewer Override
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Export JSON Audit Report
   */
  exportJsonAuditTrail(activeTender, activeScenario, findings, readinessScore) {
    const reportData = {
      system: 'SageStack AI-Powered Vendor Compliance Checker',
      version: '1.0.0-PROTOTYPE',
      hackathon: 'BVEST XIII | Prompt-e-thon (PS-AI4IMPACT)',
      team: 'Team SageStack (Lead: Vanshika)',
      timestamp: new Date().toISOString(),
      tender: {
        id: activeTender.id,
        title: activeTender.title,
        tenderNumber: activeTender.tenderNumber,
        authority: activeTender.authority,
        deadline: activeTender.deadline
      },
      vendor: {
        id: activeScenario.id,
        name: activeScenario.company,
        summary: activeScenario.summary
      },
      readinessSummary: {
        scorePercentage: readinessScore.scorePercentage,
        isHardGateBlocked: readinessScore.isHardGateBlocked,
        hardGateViolations: readinessScore.hardGateViolations,
        countMet: readinessScore.countMet,
        countReview: readinessScore.countReview,
        countFailed: readinessScore.countFailed
      },
      evaluationFindings: findings.map(f => ({
        id: f.id,
        requirement: f.title,
        isMandatory: f.isMandatory,
        status: f.status,
        originalStatus: f.originalStatus,
        isOverridden: f.isOverridden,
        extractedValue: f.extractedValue,
        source: f.source,
        ruleApplied: f.ruleApplied,
        notes: f.reason
      })),
      auditTrailLog: this.auditLogs,
      sdgAlignment: {
        sdg16: 'Transparent, traceable procurement screening',
        sdg9: 'AI applied to public procurement productivity & industrial resilience',
        sdg8: 'MSME tender onboarding & equal access'
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SageStack_AuditReport_${activeScenario.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
