/**
 * SageStack - Verification & Algorithmic Engine
 * Features:
 * - Structural GSTIN PAN Extraction (Chars 3-12)
 * - Text Normalization & Legal Suffix Stripping
 * - Levenshtein & Token-set Fuzzy Similarity
 * - Tender Checklist Rule Engine
 * - Readiness Scorer with Mandatory Hard Gates
 */

const SageEngine = {
  /**
   * Normalization rule for names and addresses (Slide 5)
   */
  normalizeText(str) {
    if (!str) return '';
    let s = str.toLowerCase();
    // Normalize abbreviations
    s = s.replace(/\bprivate\s+limited\b/g, 'pvt ltd');
    s = s.replace(/\benterprises\b/g, 'enterprise');
    s = s.replace(/\bcorporation\b/g, 'corp');
    s = s.replace(/\blimited\b/g, 'ltd');
    s = s.replace(/\bsector\b/g, 'sec');
    s = s.replace(/\bindustrial\s+area\b/g, 'ind area');
    // Remove punctuation
    s = s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    // Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  },

  /**
   * Extract PAN embedded inside 15-char GSTIN
   */
  extractPanFromGstin(gstin) {
    if (!gstin || typeof gstin !== 'string') return null;
    const clean = gstin.trim().toUpperCase();
    if (clean.length === 15) {
      return clean.substring(2, 12);
    }
    // Regex fallback
    const match = clean.match(/[0-9]{2}([A-Z]{5}[0-9]{4}[A-Z])[0-9A-Z]{3}/);
    return match ? match[1] : null;
  },

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  },

  /**
   * Calculate string similarity percentage (0 to 100%)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const n1 = this.normalizeText(str1);
    const n2 = this.normalizeText(str2);

    if (n1 === n2) return 100;

    // Token overlap check (Jaccard on words)
    const t1 = new Set(n1.split(' '));
    const t2 = new Set(n2.split(' '));
    const intersection = new Set([...t1].filter(x => t2.has(x)));
    const union = new Set([...t1, ...t2]);
    const jaccardScore = (intersection.size / union.size) * 100;

    // Levenshtein on whole string
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 100;
    const dist = this.levenshteinDistance(n1, n2);
    const levScore = ((maxLen - dist) / maxLen) * 100;

    // Blend token overlap and edit distance
    const blended = (jaccardScore * 0.4) + (levScore * 0.6);
    return Math.round(blended * 10) / 10;
  },

  /**
   * Run Cross-Document Reconciliation Matrix (Slide 5)
   */
  evaluateCrossDocMatrix(docs) {
    const results = [];

    // 1. Legal Name
    const gstName = docs.gst?.fields?.legalName?.value || 'N/A';
    const panName = docs.pan?.fields?.name?.value || 'N/A';
    const udyamName = docs.udyam?.fields?.enterpriseName?.value || 'N/A';

    const simGstPan = this.calculateSimilarity(gstName, panName);
    const simGstUdyam = this.calculateSimilarity(gstName, udyamName);
    const minNameSim = Math.min(simGstPan, simGstUdyam);

    let nameOutcome = 'MATCH';
    let nameExplanation = 'Legal names match across all registered certificates.';

    if (minNameSim < 40) {
      nameOutcome = 'MISMATCH';
      nameExplanation = 'Severe mismatch in corporate name across certificates.';
    } else if (minNameSim < 88) {
      nameOutcome = 'REVIEW';
      nameExplanation = `Variance detected ("${gstName}" vs "${udyamName}"). Flagged for human officer review; never auto-failed.`;
    }

    results.push({
      field: 'Legal name',
      gstVal: gstName,
      panVal: panName,
      udyamVal: udyamName,
      similarity: minNameSim,
      outcome: nameOutcome,
      explanation: nameExplanation,
      source: 'GST REG-06, PAN Card, Udyam MSME Certificate'
    });

    // 2. PAN Parity
    const gstin = docs.gst?.fields?.gstin?.value || '';
    const embeddedPan = this.extractPanFromGstin(gstin);
    const actualPan = docs.pan?.fields?.panNumber?.value || '';
    const udyamPan = docs.udyam?.fields?.panNumber?.value || '';

    let panOutcome = 'MATCH';
    let panExplanation = 'PAN string inside GSTIN strictly equals PAN card number.';

    if (!embeddedPan || !actualPan) {
      panOutcome = 'REVIEW';
      panExplanation = 'Could not parse PAN from one or more documents.';
    } else if (embeddedPan !== actualPan) {
      panOutcome = 'MISMATCH';
      panExplanation = `CRITICAL MISMATCH: GSTIN embeds PAN "${embeddedPan}" while submitted card is "${actualPan}". Potential fraud/mismatch!`;
    } else if (udyamPan && udyamPan !== actualPan) {
      panOutcome = 'REVIEW';
      panExplanation = 'Udyam PAN differs from primary PAN card.';
    }

    results.push({
      field: 'PAN details',
      gstVal: `${embeddedPan || 'N/A'} (inside GSTIN)`,
      panVal: actualPan || 'N/A',
      udyamVal: udyamPan || 'N/A',
      similarity: embeddedPan === actualPan ? 100 : 0,
      outcome: panOutcome,
      explanation: panExplanation,
      source: 'Characters 3–12 of GSTIN vs ITD PAN Card'
    });

    // 3. Address
    const gstAddr = docs.gst?.fields?.address?.value || 'N/A';
    const panAddr = 'Not on card';
    const udyamAddr = docs.udyam?.fields?.address?.value || 'N/A';

    const addrSim = udyamAddr !== 'N/A' ? this.calculateSimilarity(gstAddr, udyamAddr) : 100;
    let addrOutcome = 'MATCH';
    let addrExplanation = 'Operating addresses match after abbreviation normalization.';

    if (addrSim < 65 && udyamAddr !== 'N/A') {
      addrOutcome = 'REVIEW';
      addrExplanation = 'Significant address variance between GST and Udyam filings.';
    }

    results.push({
      field: 'Operating address',
      gstVal: gstAddr,
      panVal: panAddr,
      udyamVal: udyamAddr,
      similarity: addrSim,
      outcome: addrOutcome,
      explanation: addrExplanation,
      source: 'GST REG-06 Principal Place of Business vs Udyam Official Unit'
    });

    return results;
  },

  /**
   * Evaluate full tender checklist rules
   */
  evaluateTenderChecklist(tender, docs, crossDocResults, reviewerOverrides = {}) {
    const findings = [];
    const tenderDeadline = new Date(tender.deadline);

    tender.requirements.forEach(req => {
      let status = 'COMPLIANT';
      let extractedValue = 'Verified';
      let source = 'Document System';
      let ruleApplied = req.ruleDescription;
      let reviewAction = 'No action required.';
      let reason = 'Requirement met successfully.';

      // Check field specific logic
      switch (req.checkField) {
        case 'gstin_status': {
          const gstField = docs.gst?.fields?.status;
          if (!docs.gst || !docs.gst.fields?.gstin?.value) {
            status = 'NON_COMPLIANT';
            extractedValue = 'Missing GST Certificate';
            source = 'Document Upload Slot 1';
            reason = 'Mandatory GST registration document was not submitted.';
            reviewAction = 'Reject submission or demand active GST REG-06.';
          } else {
            extractedValue = `GSTIN: ${docs.gst.fields.gstin.value} (${gstField?.value || 'Active'})`;
            source = docs.gst.fields.gstin.source;
          }
          break;
        }

        case 'pan_valid': {
          const panNum = docs.pan?.fields?.panNumber?.value;
          if (!panNum) {
            status = 'NON_COMPLIANT';
            extractedValue = 'Missing PAN Card';
            source = 'Document Upload Slot 2';
            reason = 'Valid 10-digit PAN card proof is missing.';
            reviewAction = 'Demand NSDL/UTI verified PAN card.';
          } else {
            extractedValue = `PAN: ${panNum} (${docs.pan?.fields?.entityType?.value || 'Valid'})`;
            source = docs.pan?.fields?.panNumber?.source || 'pan_card.pdf';
          }
          break;
        }

        case 'pan_cross_match': {
          const panRow = crossDocResults.find(r => r.field === 'PAN details');
          if (panRow?.outcome === 'MISMATCH') {
            status = 'NON_COMPLIANT';
            extractedValue = `GSTIN PAN (${panRow.gstVal}) ≠ Card PAN (${panRow.panVal})`;
            source = panRow.source;
            reason = panRow.explanation;
            reviewAction = 'Escalate for identity fraud inquiry.';
          } else if (panRow?.outcome === 'REVIEW') {
            status = 'REQUIRES_REVIEW';
            extractedValue = `${panRow.gstVal} vs ${panRow.panVal}`;
            source = panRow.source;
            reason = panRow.explanation;
            reviewAction = 'Confirm PAN ownership on Income Tax Portal.';
          } else {
            extractedValue = `${panRow?.panVal || 'ABCDE1234F'} (Identical in GST & PAN Card)`;
            source = 'GSTIN Chars 3-12 vs PAN Card';
          }
          break;
        }

        case 'name_cross_match': {
          const nameRow = crossDocResults.find(r => r.field === 'Legal name');
          if (nameRow?.outcome === 'MISMATCH') {
            status = 'NON_COMPLIANT';
            extractedValue = `GST: "${nameRow.gstVal}" vs Udyam: "${nameRow.udyamVal}"`;
            source = nameRow.source;
            reason = nameRow.explanation;
            reviewAction = 'Reject bid due to legal entity mismatch.';
          } else if (nameRow?.outcome === 'REVIEW') {
            status = 'REQUIRES_REVIEW';
            extractedValue = `GST: "${nameRow.gstVal}" vs Udyam: "${nameRow.udyamVal}" (Sim: ${nameRow.similarity}%)`;
            source = nameRow.source;
            reason = nameRow.explanation;
            reviewAction = 'Confirm if trade name is registered as known alias.';
          } else {
            extractedValue = `${nameRow?.gstVal || 'Matching Legal Name'}`;
            source = 'GST, PAN & Udyam Certificates';
          }
          break;
        }

        case 'oem_validity': {
          const oemField = docs.oem?.fields?.validUntil;
          if (!docs.oem || !oemField?.value) {
            status = 'NON_COMPLIANT';
            extractedValue = 'Missing OEM Authorization';
            source = 'Document Upload Slot 5';
            reason = 'Mandatory OEM Authorization (MAF) letter not submitted.';
            reviewAction = 'Reject technical proposal.';
          } else {
            extractedValue = oemField.value;
            source = oemField.source || 'oem_letter.pdf, page 1 (Line 14)';
            
            // Check expiry date against tender deadline
            const rawDateStr = oemField.rawDate;
            if (rawDateStr) {
              const oemDate = new Date(rawDateStr);
              if (oemDate < tenderDeadline) {
                status = 'NON_COMPLIANT';
                ruleApplied = `Validity date must be on or after tender deadline (${tender.deadline})`;
                reason = `Lapsed validity date: OEM letter expired on ${rawDateStr}, before tender deadline (${tender.deadline}).`;
                reviewAction = 'Confirm date against original document or request renewed OEM authorization.';
              }
            }
          }
          break;
        }

        case 'address_match': {
          const addrRow = crossDocResults.find(r => r.field === 'Operating address');
          if (addrRow?.outcome === 'REVIEW') {
            status = 'REQUIRES_REVIEW';
            extractedValue = addrRow.gstVal;
            source = addrRow.source;
            reason = addrRow.explanation;
            reviewAction = 'Verify principal place of business.';
          } else {
            extractedValue = addrRow?.gstVal || 'Plot 12, Sector 5';
            source = 'GST Principal Place of Business';
          }
          break;
        }

        case 'udyam_status': {
          if (!docs.udyam || !docs.udyam.fields?.isProvided && docs.udyam.fields?.isProvided !== false && !docs.udyam.fields?.udyamNumber?.value) {
            status = req.isMandatory ? 'NON_COMPLIANT' : 'COMPLIANT';
            extractedValue = 'Not Claimed / Exemption Waived';
            source = 'MSME Slot';
            reason = 'Vendor did not claim MSME purchase preference.';
          } else {
            extractedValue = `${docs.udyam.fields?.udyamNumber?.value || 'UDYAM Registered'} (${docs.udyam.fields?.category?.value || 'MSME'})`;
            source = 'udyam_registration.pdf, page 1';
          }
          break;
        }

        case 'startup_status': {
          if (docs.startup?.fields?.isProvided && docs.startup.fields?.startupNumber?.value) {
            extractedValue = `DPIIT Recognized: ${docs.startup.fields.startupNumber.value}`;
            source = 'startup_india.pdf, page 1';
            reason = 'Eligible for startup turnover & prior experience exemption.';
          } else {
            extractedValue = 'No Startup Exemption Claimed';
            source = 'General Bidder Track';
            reason = 'Evaluated under standard commercial turnover conditions.';
          }
          break;
        }

        default:
          extractedValue = 'Verified';
      }

      // Check if Human Reviewer has an override on this item
      if (reviewerOverrides[req.id]) {
        const ovr = reviewerOverrides[req.id];
        findings.push({
          ...req,
          originalStatus: status,
          status: ovr.status,
          extractedValue,
          source,
          ruleApplied,
          reviewAction,
          reason: `${reason} [OVERRIDDEN BY REVIEWER: ${ovr.notes} - by ${ovr.officer}]`,
          isOverridden: true,
          overrideDetails: ovr
        });
      } else {
        findings.push({
          ...req,
          originalStatus: status,
          status,
          extractedValue,
          source,
          ruleApplied,
          reviewAction,
          reason,
          isOverridden: false
        });
      }
    });

    return findings;
  },

  /**
   * Compute Tender Readiness Score & Gap Analysis (Slide 4)
   * Proposed logic: score = weight of met items / total weight.
   * Items needing review are NEVER counted as met.
   * Mandatory requirements act as HARD GATES.
   */
  computeReadinessScore(findings) {
    let totalWeight = 0;
    let metWeight = 0;
    let countMet = 0;
    let countReview = 0;
    let countFailed = 0;
    const gaps = [];
    const hardGateViolations = [];

    findings.forEach(f => {
      totalWeight += f.weight;

      if (f.status === 'COMPLIANT') {
        metWeight += f.weight;
        countMet++;
      } else if (f.status === 'REQUIRES_REVIEW') {
        countReview++;
        gaps.push({
          id: f.id,
          title: f.title,
          severity: 'warning',
          actionText: f.reviewAction || 'Requires human verification before final sign-off.',
          isMandatory: f.isMandatory
        });
      } else if (f.status === 'NON_COMPLIANT') {
        countFailed++;
        gaps.push({
          id: f.id,
          title: f.title,
          severity: 'danger',
          actionText: f.reason || 'Document does not satisfy tender eligibility rule.',
          isMandatory: f.isMandatory
        });

        // Check if mandatory hard gate was tripped!
        if (f.isMandatory) {
          hardGateViolations.push({
            id: f.id,
            title: f.title,
            reason: f.reason
          });
        }
      }
    });

    const scorePercentage = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0;
    const isHardGateBlocked = hardGateViolations.length > 0;

    return {
      scorePercentage,
      totalRequirements: findings.length,
      countMet,
      countReview,
      countFailed,
      totalWeight,
      metWeight,
      isHardGateBlocked,
      hardGateViolations,
      gaps
    };
  }
};
