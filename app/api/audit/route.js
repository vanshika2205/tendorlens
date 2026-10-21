import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUDIT_FILE = path.join(process.cwd(), 'audit_logs.json');

function getLogs() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading audit file:', e);
  }
  return [
    {
      id: 'LOG-001',
      timestamp: '2026-10-21 17:15:02',
      reviewer: 'System Pipeline (Auto-OCR)',
      item: 'OEM Authorization Letter',
      original: 'PENDING',
      action: 'NON_COMPLIANT Flagged',
      notes: 'Lapsed validity date detected: 31 Mar 2024 < Tender Deadline 31 Dec 2026'
    },
    {
      id: 'LOG-002',
      timestamp: '2026-10-21 17:15:03',
      reviewer: 'System Pipeline (Cross-Doc)',
      item: 'Legal Name Consistency',
      original: 'PENDING',
      action: 'REQUIRES_REVIEW Flagged',
      notes: 'Variance across GST ("Sample Traders Pvt Ltd") and Udyam ("Sample Trader Enterprises")'
    }
  ];
}

function saveLogs(logs) {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving audit logs:', e);
  }
}

export async function GET() {
  const logs = getLogs();
  return NextResponse.json({ success: true, logs });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const logs = getLogs();

    const newLog = {
      id: `LOG-${String(logs.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reviewer: body.reviewer || 'Evaluation Officer',
      item: body.item || 'Compliance Item',
      original: body.original || 'AI_FLAGGED',
      action: body.action || 'OVERRIDE_RECORDED',
      notes: body.notes || 'No justification note provided'
    };

    logs.unshift(newLog);
    saveLogs(logs);

    return NextResponse.json({ success: true, log: newLog, logs });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
