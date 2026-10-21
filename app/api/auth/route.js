import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, password, role, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const assignedName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const assignedRole = role || 'Evaluation Officer (Admin)';

    const user = {
      id: `usr_${Date.now()}`,
      email,
      name: assignedName,
      role: assignedRole,
      token: `tl_jwt_${Buffer.from(email + ':' + Date.now()).toString('base64')}`,
      authenticatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: action === 'signup' ? 'Enterprise account registered successfully' : 'Signed in successfully',
      user
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}
