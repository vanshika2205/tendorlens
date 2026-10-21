/**
 * Sample test document generator
 */
const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, 'uploads', 'samples');
if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });

// 1. GST Sample File
const gstContent = `
GOVERNMENT OF INDIA
CENTRAL GOODS AND SERVICES TAX ACT, 2017
Registration Certificate (Form GST REG-06)

Registration Number (GSTIN): 07ABCDE1234F1Z5
Legal Name: Sample Traders Pvt Ltd
Trade Name: Sample Traders
Constitution of Business: Private Limited Company
Address of Principal Place of Business: Plot 12, Sector 5, Okhla Phase 3, New Delhi - 110020
Date of Liability: 01/07/2017
Date of Validity: From 14/08/2018 To Permanent
Status: Active
Type of Registration: Regular
`;

// 2. PAN Sample File
const panContent = `
INCOME TAX DEPARTMENT - GOVT OF INDIA
PERMANENT ACCOUNT NUMBER CARD

Permanent Account Number (PAN): ABCDE1234F
Name: SAMPLE TRADERS PRIVATE LIMITED
Date of Incorporation: 10/07/2018
Entity Classification: Company (Corporate)
Issuing Authority: National Securities Depository Limited (NSDL)
`;

// 3. Udyam MSME Sample File
const udyamContent = `
MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES
UDYAM REGISTRATION CERTIFICATE

UDYAM REGISTRATION NUMBER: UDYAM-DL-08-0019284
NAME OF ENTERPRISE: Sample Trader Enterprises
TYPE OF ENTERPRISE: Small Enterprise
MAJOR ACTIVITY: Manufacturing and Supply of IT Equipment
DATE OF COMMENCEMENT OF PRODUCTION: 15/09/2018
NATIONAL INDUSTRY CLASSIFICATION (NIC): 2620 - Manufacture of computers and peripheral equipment
OFFICIAL ADDRESS: Plot 12, Sec-5, Okhla Ind Area, New Delhi - 110020
LINKED PAN: ABCDE1234F
`;

// 4. OEM Letter Sample File (With lapsed date to test rule engine!)
const oemContent = `
APEX SILICON GLOBAL CORP
Global Hardware Systems & Telemetry Division
Ref: 2024-MAF-091

Date: 12 March 2024
To: The Central Procurement Committee & Evaluation Officers
Subject: Manufacturer's Authorization Form (MAF)

Dear Sir/Madam,
We, Apex Silicon Global Corp, an established and reputable manufacturer of high-density server hardware and telemetry controllers, having factories at High-Tech Park, do hereby authorize:

M/s Sample Traders Pvt Ltd
having registered office at Plot 12, Sector 5, Okhla Phase 3, New Delhi

to submit a bid and subsequently negotiate and sign the contract with your agency against Tender RFP-2026-889.

Scope of Equipment: High-Density Server Hardware & Network Cards
Warranty Guarantee: 36 Months Comprehensive On-site OEM Warranty

Validity of Authorization:
This authorization letter is Valid until 31 Mar 2024.

Yours faithfully,
Rajesh Mehra
VP Enterprise Channels
Apex Silicon Global Corp
`;

fs.writeFileSync(path.join(samplesDir, 'sample_gst_certificate.txt'), gstContent.trim());
fs.writeFileSync(path.join(samplesDir, 'sample_pan_card.txt'), panContent.trim());
fs.writeFileSync(path.join(samplesDir, 'sample_udyam_registration.txt'), udyamContent.trim());
fs.writeFileSync(path.join(samplesDir, 'sample_oem_letter.txt'), oemContent.trim());

console.log('Sample test documents generated in uploads/samples/');
