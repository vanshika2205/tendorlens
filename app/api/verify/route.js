import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tenderId, vendorData, overrides } = await req.json();

    // Verification engine
    const isOemOverridden = overrides && overrides['REQ-05'];
    const isNameOverridden = overrides && overrides['REQ-04'];

    const oemValid = !vendorData.oemExpired || Boolean(isOemOverridden);
    const panParityValid = vendorData.gstin && vendorData.pan && vendorData.gstin.includes(vendorData.pan);

    const hardGateFailed = !oemValid || !panParityValid;
    let hardGateReason = null;
    if (!oemValid) {
      hardGateReason = `OEM Authorization Letter expired (${vendorData.oemDate}). Mandatory hard gate failed.`;
    } else if (!panParityValid) {
      hardGateReason = `Critical Mismatch: GSTIN characters do not match submitted PAN card (${vendorData.pan}).`;
    }

    const score = hardGateFailed ? 50 : 100;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      evaluation: {
        score,
        hardGateFailed,
        hardGateReason,
        panParityValid,
        oemValid,
        oemOverridden: Boolean(isOemOverridden),
        nameOverridden: Boolean(isNameOverridden)
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
