/**
 * SageStack - Preloaded Data, Tenders, and Vendor Scenarios
 * Replicating presentation deck slides 4, 5, 6, 8, 9, 10
 */

const SAGE_TENDERS = {
  'gem-it': {
    id: 'gem-it',
    title: 'GeM Portal: IT Hardware & Peripherals Supply',
    tenderNumber: 'GEM/2026/B/891240',
    authority: 'Ministry of Electronics & Information Technology (MeitY)',
    deadline: '2026-12-31',
    description: 'Procurement of mission-critical server hardware, telemetry controllers, and networking peripherals.',
    requirements: [
      {
        id: 'REQ-01',
        title: 'Valid GST Registration Certificate',
        docType: 'gst',
        isMandatory: true,
        weight: 20,
        ruleDescription: 'Must be active, non-suspended, and verified against GSTIN structure.',
        checkField: 'gstin_status'
      },
      {
        id: 'REQ-02',
        title: 'PAN Card & Corporate Identity',
        docType: 'pan',
        isMandatory: true,
        weight: 15,
        ruleDescription: 'PAN format must be 10 characters and match entity type (4th char: C/P/F).',
        checkField: 'pan_valid'
      },
      {
        id: 'REQ-03',
        title: 'GSTIN Embedded PAN Consistency',
        docType: 'cross_doc',
        isMandatory: true,
        weight: 15,
        ruleDescription: 'Characters 3 to 12 in the GSTIN must strictly match the submitted PAN.',
        checkField: 'pan_cross_match'
      },
      {
        id: 'REQ-04',
        title: 'Cross-Document Legal Name Parity',
        docType: 'cross_doc',
        isMandatory: true,
        weight: 15,
        ruleDescription: 'Entity name must match within normalized fuzzy threshold (>85%) across all submitted certificates.',
        checkField: 'name_cross_match'
      },
      {
        id: 'REQ-05',
        title: 'Valid OEM Authorization Form (MAF)',
        docType: 'oem',
        isMandatory: true,
        weight: 20,
        ruleDescription: 'OEM letter must state validity date on or after tender submission deadline (31 Dec 2026).',
        checkField: 'oem_validity'
      },
      {
        id: 'REQ-06',
        title: 'Registered Business Address Proof',
        docType: 'gst',
        isMandatory: false,
        weight: 5,
        ruleDescription: 'Operating address must be verifiable across GST and Udyam filings.',
        checkField: 'address_match'
      },
      {
        id: 'REQ-07',
        title: 'MSME / Udyam Certificate (Preference Benefit)',
        docType: 'udyam',
        isMandatory: false,
        weight: 5,
        ruleDescription: 'Valid Udyam registration unlocks Purchase Preference and EMD fee exemption.',
        checkField: 'udyam_status'
      },
      {
        id: 'REQ-08',
        title: 'Startup India DPIIT Recognition (Turnover Exemption)',
        docType: 'startup',
        isMandatory: false,
        weight: 5,
        ruleDescription: 'Recognized startups are exempt from prior experience and past turnover criteria.',
        checkField: 'startup_status'
      }
    ]
  },

  'railway-telecom': {
    id: 'railway-telecom',
    title: 'Indian Railways: Telemetry Equipment Procurement',
    tenderNumber: 'IREPS/2026/TELECOM/440',
    authority: 'Research Designs & Standards Organisation (RDSO)',
    deadline: '2026-11-15',
    description: 'High-reliability IoT tracking sensors and telemetry controllers for train collision avoidance.',
    requirements: [
      { id: 'REQ-01', title: 'Valid GST Registration Certificate', docType: 'gst', isMandatory: true, weight: 25, ruleDescription: 'Active GST registration required.', checkField: 'gstin_status' },
      { id: 'REQ-02', title: 'PAN Card & Corporate Identity', docType: 'pan', isMandatory: true, weight: 20, ruleDescription: 'PAN format check and entity validation.', checkField: 'pan_valid' },
      { id: 'REQ-03', title: 'PAN & GSTIN Parity Check', docType: 'cross_doc', isMandatory: true, weight: 20, ruleDescription: 'PAN inside GSTIN parity.', checkField: 'pan_cross_match' },
      { id: 'REQ-05', title: 'Valid OEM Authorization Form (MAF)', docType: 'oem', isMandatory: true, weight: 25, ruleDescription: 'OEM letter must be valid past 15 Nov 2026.', checkField: 'oem_validity' },
      { id: 'REQ-07', title: 'MSME Registration for EMD Exemption', docType: 'udyam', isMandatory: false, weight: 10, ruleDescription: 'Exempts ₹2,00,000 EMD deposit.', checkField: 'udyam_status' }
    ]
  },

  'smartcity-iot': {
    id: 'smartcity-iot',
    title: 'Smart City Mission: IoT Environmental Sensors Supply',
    tenderNumber: 'SCM/ENV/2026/091',
    authority: 'Delhi Urban Development & Infrastructure Board',
    deadline: '2026-10-30',
    description: 'Procurement of 1,200 air quality PM2.5 monitoring stations with telemetry.',
    requirements: [
      { id: 'REQ-01', title: 'Valid GST Registration', docType: 'gst', isMandatory: true, weight: 20, ruleDescription: 'Active GST status.', checkField: 'gstin_status' },
      { id: 'REQ-02', title: 'PAN Identity Check', docType: 'pan', isMandatory: true, weight: 15, ruleDescription: 'PAN verification.', checkField: 'pan_valid' },
      { id: 'REQ-04', title: 'Entity Name Matching', docType: 'cross_doc', isMandatory: true, weight: 20, ruleDescription: 'Consistent legal entity name.', checkField: 'name_cross_match' },
      { id: 'REQ-05', title: 'OEM Authorization Form', docType: 'oem', isMandatory: true, weight: 25, ruleDescription: 'OEM guarantee on sensor calibration.', checkField: 'oem_validity' },
      { id: 'REQ-08', title: 'Startup India DPIIT Recognition', docType: 'startup', isMandatory: false, weight: 20, ruleDescription: 'Evaluation preference given to DPIIT recognized AI & IoT startups.', checkField: 'startup_status' }
    ]
  }
};

/**
 * Preloaded Vendor Test Scenarios
 * Matches Pitch Deck Slide 4, 5, 6
 */
const SAGE_SCENARIOS = {
  'sample-traders': {
    id: 'sample-traders',
    name: 'Case 1: Slide 5 & 6 Example (Sample Traders Pvt Ltd)',
    company: 'Sample Traders Pvt Ltd',
    summary: 'Contains name variance across certificates and an expired OEM Authorization letter.',
    docs: {
      gst: {
        filename: 'gst_certificate.pdf',
        fileSize: '412 KB',
        formType: 'Form GST REG-06',
        fields: {
          legalName: { value: 'Sample Traders Pvt Ltd', conf: 98.4, page: 1, bbox: { x: 32, y: 120, w: 260, h: 22 }, source: 'gst_certificate.pdf, page 1, Table 1.a' },
          tradeName: { value: 'Sample Traders', conf: 96.1, page: 1, bbox: { x: 32, y: 150, w: 210, h: 20 }, source: 'gst_certificate.pdf, page 1, Table 1.b' },
          gstin: { value: '07ABCDE1234F1Z5', conf: 99.2, page: 1, bbox: { x: 32, y: 88, w: 220, h: 24 }, source: 'gst_certificate.pdf, page 1, Header' },
          embeddedPan: { value: 'ABCDE1234F', conf: 99.2, derived: true, note: 'Extracted from characters 3-12 of GSTIN' },
          address: { value: 'Plot 12, Sector 5, Okhla Phase 3, New Delhi - 110020', conf: 94.6, page: 1, bbox: { x: 32, y: 182, w: 320, h: 32 }, source: 'gst_certificate.pdf, page 1, Table 3' },
          status: { value: 'Active', conf: 97.0, source: 'GST Registry State Check' },
          regDate: { value: '14/08/2018', conf: 98.0, page: 1, bbox: { x: 32, y: 220, w: 140, h: 20 }, source: 'gst_certificate.pdf, page 1, Table 4' }
        }
      },
      pan: {
        filename: 'pan_card.pdf',
        fileSize: '284 KB',
        formType: 'Income Tax Department (Form 49A)',
        fields: {
          name: { value: 'SAMPLE TRADERS PRIVATE LIMITED', conf: 99.0, page: 1, bbox: { x: 28, y: 110, w: 280, h: 24 }, source: 'pan_card.pdf, page 1, Center' },
          panNumber: { value: 'ABCDE1234F', conf: 99.5, page: 1, bbox: { x: 28, y: 80, w: 180, h: 24 }, source: 'pan_card.pdf, page 1, Top Left' },
          entityType: { value: 'Company (4th Char: C)', conf: 99.5, derived: true },
          dob_incorp: { value: '10/07/2018', conf: 96.5, page: 1, bbox: { x: 28, y: 145, w: 150, h: 20 }, source: 'pan_card.pdf, page 1, Bottom Left' },
          fatherOrDirector: { value: 'Not applicable (Corporate Entity)', conf: 99.0 }
        }
      },
      udyam: {
        filename: 'udyam_registration.pdf',
        fileSize: '350 KB',
        formType: 'Ministry of MSME Official Certificate',
        fields: {
          enterpriseName: { value: 'Sample Trader Enterprises', conf: 97.8, page: 1, bbox: { x: 30, y: 115, w: 270, h: 24 }, source: 'udyam_registration.pdf, page 1, Box 2' },
          udyamNumber: { value: 'UDYAM-DL-08-0019284', conf: 99.1, page: 1, bbox: { x: 30, y: 78, w: 230, h: 24 }, source: 'udyam_registration.pdf, page 1, Header' },
          panNumber: { value: 'ABCDE1234F', conf: 98.9, page: 1, bbox: { x: 30, y: 148, w: 180, h: 22 }, source: 'udyam_registration.pdf, page 1, Box 4' },
          address: { value: 'Plot 12, Sec-5, Okhla Ind Area, New Delhi', conf: 93.2, page: 1, bbox: { x: 30, y: 180, w: 310, h: 30 }, source: 'udyam_registration.pdf, page 1, Box 5' },
          category: { value: 'Small Enterprise', conf: 98.0, page: 1, bbox: { x: 30, y: 218, w: 170, h: 20 }, source: 'udyam_registration.pdf, page 1, Box 6' }
        }
      },
      startup: {
        filename: 'startup_india.pdf',
        fileSize: '198 KB',
        formType: 'DPIIT Recognition Certificate',
        fields: {
          isProvided: false,
          note: 'Document not submitted by vendor (Optional for this tender)'
        }
      },
      oem: {
        filename: 'oem_letter.pdf',
        fileSize: '520 KB',
        formType: 'Manufacturer Authorization Form (MAF)',
        fields: {
          oemName: { value: 'Apex Silicon Global Corp', conf: 96.5, page: 1, bbox: { x: 35, y: 60, w: 240, h: 24 }, source: 'oem_letter.pdf, page 1, Header' },
          authorizedPartner: { value: 'Sample Traders Pvt Ltd', conf: 97.2, page: 1, bbox: { x: 35, y: 110, w: 250, h: 22 }, source: 'oem_letter.pdf, page 1, Para 1' },
          productScope: { value: 'High-Density Server Hardware & Network Cards', conf: 94.0, page: 1, bbox: { x: 35, y: 145, w: 320, h: 26 }, source: 'oem_letter.pdf, page 1, Para 2' },
          validUntil: { value: 'Valid until 31 Mar 2024', conf: 94.2, rawDate: '2024-03-31', page: 1, bbox: { x: 35, y: 185, w: 260, h: 24 }, source: 'oem_letter.pdf, page 1 (Line 14)' },
          signatory: { value: 'Rajesh Mehra, VP Enterprise Channels', conf: 91.8, page: 1, bbox: { x: 35, y: 230, w: 280, h: 28 }, source: 'oem_letter.pdf, page 1, Signature Block' }
        }
      }
    }
  },

  'compliant-vendor': {
    id: 'compliant-vendor',
    name: 'Case 2: 100% Compliant Benchmark (Bharat Tech Systems)',
    company: 'Bharat Tech Systems Pvt Ltd',
    summary: 'All documents match cleanly. OEM Authorization is valid through 2027.',
    docs: {
      gst: {
        filename: 'bharat_tech_gst.pdf',
        fileSize: '430 KB',
        formType: 'Form GST REG-06',
        fields: {
          legalName: { value: 'Bharat Tech Systems Pvt Ltd', conf: 99.2, page: 1, bbox: { x: 32, y: 120, w: 270, h: 22 }, source: 'bharat_tech_gst.pdf, page 1' },
          tradeName: { value: 'Bharat Tech Systems', conf: 98.1, page: 1, bbox: { x: 32, y: 150, w: 220, h: 20 }, source: 'bharat_tech_gst.pdf, page 1' },
          gstin: { value: '29AABCB8842G1ZT', conf: 99.8, page: 1, bbox: { x: 32, y: 88, w: 230, h: 24 }, source: 'bharat_tech_gst.pdf, page 1' },
          embeddedPan: { value: 'AABCB8842G', conf: 99.8, derived: true },
          address: { value: 'Electronics City Phase 1, Hosur Road, Bengaluru - 560100', conf: 96.5, page: 1, bbox: { x: 32, y: 182, w: 340, h: 32 }, source: 'bharat_tech_gst.pdf, page 1' },
          status: { value: 'Active', conf: 99.0 },
          regDate: { value: '05/03/2017', conf: 99.0, page: 1, bbox: { x: 32, y: 220, w: 140, h: 20 }, source: 'bharat_tech_gst.pdf, page 1' }
        }
      },
      pan: {
        filename: 'bharat_tech_pan.pdf',
        fileSize: '310 KB',
        formType: 'Income Tax Department (Form 49A)',
        fields: {
          name: { value: 'BHARAT TECH SYSTEMS PRIVATE LIMITED', conf: 99.5, page: 1, bbox: { x: 28, y: 110, w: 290, h: 24 }, source: 'bharat_tech_pan.pdf, page 1' },
          panNumber: { value: 'AABCB8842G', conf: 99.8, page: 1, bbox: { x: 28, y: 80, w: 180, h: 24 }, source: 'bharat_tech_pan.pdf, page 1' },
          entityType: { value: 'Company (4th Char: C)', conf: 99.8, derived: true },
          dob_incorp: { value: '18/02/2017', conf: 98.0, page: 1, bbox: { x: 28, y: 145, w: 150, h: 20 }, source: 'bharat_tech_pan.pdf, page 1' }
        }
      },
      udyam: {
        filename: 'bharat_tech_udyam.pdf',
        fileSize: '360 KB',
        formType: 'Ministry of MSME Official Certificate',
        fields: {
          enterpriseName: { value: 'Bharat Tech Systems Pvt Ltd', conf: 99.0, page: 1, bbox: { x: 30, y: 115, w: 280, h: 24 }, source: 'bharat_tech_udyam.pdf, page 1' },
          udyamNumber: { value: 'UDYAM-KR-03-0099412', conf: 99.4, page: 1, bbox: { x: 30, y: 78, w: 240, h: 24 }, source: 'bharat_tech_udyam.pdf, page 1' },
          panNumber: { value: 'AABCB8842G', conf: 99.4, page: 1, bbox: { x: 30, y: 148, w: 180, h: 22 }, source: 'bharat_tech_udyam.pdf, page 1' },
          address: { value: 'Electronics City Phase 1, Bengaluru', conf: 95.8, page: 1, bbox: { x: 30, y: 180, w: 320, h: 30 }, source: 'bharat_tech_udyam.pdf, page 1' },
          category: { value: 'Medium Enterprise', conf: 98.5, page: 1, bbox: { x: 30, y: 218, w: 180, h: 20 }, source: 'bharat_tech_udyam.pdf, page 1' }
        }
      },
      startup: {
        filename: 'bharat_tech_dpiit.pdf',
        fileSize: '210 KB',
        formType: 'DPIIT Recognition Certificate',
        fields: {
          isProvided: true,
          startupNumber: { value: 'DIPP54192', conf: 98.7, page: 1, bbox: { x: 30, y: 80, w: 190, h: 22 }, source: 'bharat_tech_dpiit.pdf, page 1' },
          companyName: { value: 'Bharat Tech Systems Pvt Ltd', conf: 98.9, page: 1, bbox: { x: 30, y: 120, w: 270, h: 22 }, source: 'bharat_tech_dpiit.pdf, page 1' },
          validUntil: { value: 'Valid up to 10 Years from Incorp', conf: 96.0, page: 1, bbox: { x: 30, y: 160, w: 250, h: 22 }, source: 'bharat_tech_dpiit.pdf, page 1' }
        }
      },
      oem: {
        filename: 'bharat_tech_oem.pdf',
        fileSize: '490 KB',
        formType: 'Manufacturer Authorization Form (MAF)',
        fields: {
          oemName: { value: 'Apex Silicon Global Corp', conf: 98.2, page: 1, bbox: { x: 35, y: 60, w: 240, h: 24 }, source: 'bharat_tech_oem.pdf, page 1' },
          authorizedPartner: { value: 'Bharat Tech Systems Pvt Ltd', conf: 98.9, page: 1, bbox: { x: 35, y: 110, w: 260, h: 22 }, source: 'bharat_tech_oem.pdf, page 1' },
          productScope: { value: 'Enterprise AI Servers & High Performance Telemetry Controllers', conf: 97.4, page: 1, bbox: { x: 35, y: 145, w: 340, h: 26 }, source: 'bharat_tech_oem.pdf, page 1' },
          validUntil: { value: 'Valid until 31 Dec 2027', conf: 98.6, rawDate: '2027-12-31', page: 1, bbox: { x: 35, y: 185, w: 260, h: 24 }, source: 'bharat_tech_oem.pdf, page 1' },
          signatory: { value: 'K. S. Narayanan, Regional Director Channels', conf: 96.0, page: 1, bbox: { x: 35, y: 230, w: 290, h: 28 }, source: 'bharat_tech_oem.pdf, page 1' }
        }
      }
    }
  },

  'fraud-risk': {
    id: 'fraud-risk',
    name: 'Case 3: Critical Non-Compliant (Apex Global Infotech)',
    company: 'Apex Global Infotech LLP',
    summary: 'PAN embedded inside GSTIN (AABCA5555M) fails to match submitted PAN card (BCDEF9999K).',
    docs: {
      gst: {
        filename: 'apex_gst_cert.pdf',
        fileSize: '390 KB',
        formType: 'Form GST REG-06',
        fields: {
          legalName: { value: 'Apex Global Infotech LLP', conf: 97.4, page: 1, bbox: { x: 32, y: 120, w: 260, h: 22 }, source: 'apex_gst_cert.pdf, page 1' },
          tradeName: { value: 'Apex Global', conf: 95.0, page: 1, bbox: { x: 32, y: 150, w: 180, h: 20 }, source: 'apex_gst_cert.pdf, page 1' },
          gstin: { value: '07AABCA5555M1Z2', conf: 99.2, page: 1, bbox: { x: 32, y: 88, w: 220, h: 24 }, source: 'apex_gst_cert.pdf, page 1' },
          embeddedPan: { value: 'AABCA5555M', conf: 99.2, derived: true },
          address: { value: 'Suite 404, Nehru Place, New Delhi - 110019', conf: 94.0, page: 1, bbox: { x: 32, y: 182, w: 320, h: 32 }, source: 'apex_gst_cert.pdf, page 1' },
          status: { value: 'Active', conf: 96.0 },
          regDate: { value: '11/11/2020', conf: 97.0, page: 1, bbox: { x: 32, y: 220, w: 140, h: 20 }, source: 'apex_gst_cert.pdf, page 1' }
        }
      },
      pan: {
        filename: 'apex_pan_card.pdf',
        fileSize: '290 KB',
        formType: 'Income Tax Department (Form 49A)',
        fields: {
          name: { value: 'APEX DIGITAL ENTERPRISES', conf: 98.0, page: 1, bbox: { x: 28, y: 110, w: 270, h: 24 }, source: 'apex_pan_card.pdf, page 1' },
          panNumber: { value: 'BCDEF9999K', conf: 99.1, page: 1, bbox: { x: 28, y: 80, w: 180, h: 24 }, source: 'apex_pan_card.pdf, page 1' },
          entityType: { value: 'Firm / LLP (4th Char: F)', conf: 99.0, derived: true },
          dob_incorp: { value: '09/04/2019', conf: 95.0, page: 1, bbox: { x: 28, y: 145, w: 150, h: 20 }, source: 'apex_pan_card.pdf, page 1' }
        }
      },
      udyam: {
        filename: 'apex_udyam.pdf',
        fileSize: '0 KB',
        formType: 'Missing Document',
        fields: {
          isProvided: false,
          note: 'Certificate not uploaded or unreadable scan'
        }
      },
      startup: {
        filename: 'apex_startup.pdf',
        fileSize: '0 KB',
        fields: { isProvided: false }
      },
      oem: {
        filename: 'apex_oem.pdf',
        fileSize: '410 KB',
        formType: 'Manufacturer Authorization Form (MAF)',
        fields: {
          oemName: { value: 'TechPro Dynamics Ltd', conf: 94.0, page: 1, bbox: { x: 35, y: 60, w: 240, h: 24 }, source: 'apex_oem.pdf, page 1' },
          authorizedPartner: { value: 'Apex Global Infotech LLP', conf: 95.0, page: 1, bbox: { x: 35, y: 110, w: 250, h: 22 }, source: 'apex_oem.pdf, page 1' },
          productScope: { value: 'Industrial Telemetry Nodes', conf: 92.0, page: 1, bbox: { x: 35, y: 145, w: 300, h: 26 }, source: 'apex_oem.pdf, page 1' },
          validUntil: { value: 'Valid until 15 Aug 2025', conf: 91.0, rawDate: '2025-08-15', page: 1, bbox: { x: 35, y: 185, w: 260, h: 24 }, source: 'apex_oem.pdf, page 1' },
          signatory: { value: 'S. Kumar, Sales Manager', conf: 88.0, page: 1, bbox: { x: 35, y: 230, w: 270, h: 28 }, source: 'apex_oem.pdf, page 1' }
        }
      }
    }
  }
};
