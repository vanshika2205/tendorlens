import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const docType = formData.get('docType') || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name;
    const size = file.size;
    const text = await file.text();

    // Regex extraction patterns
    const gstinPattern = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/i;
    const panPattern = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/i;
    const datePattern = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/i;

    const gstinMatch = text.match(gstinPattern);
    const panMatch = text.match(panPattern);
    const dateMatch = text.match(datePattern);

    // Extract potential legal name
    let extractedName = null;
    const nameMatch = text.match(/(?:Legal Name|Name of Taxpayer|Enterprise Name|Vendor Name|Authorized Signatory):\s*([^\n\r]+)/i);
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
    }

    const extracted = {
      filename,
      sizeKb: Math.round(size / 1024),
      docType,
      gstin: gstinMatch ? gstinMatch[0].toUpperCase() : null,
      pan: panMatch ? panMatch[0].toUpperCase() : null,
      date: dateMatch ? dateMatch[0] : null,
      legalName: extractedName,
      parsedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${filename}`,
      extracted
    });
  } catch (err) {
    console.error('Upload API Error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file' }, { status: 500 });
  }
}
