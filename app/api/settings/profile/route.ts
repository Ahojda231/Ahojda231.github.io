import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAccountProfile } from '@/lib/db';

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = body?.email ?? null;
  const avatar = body?.avatar ?? null;

  const idStr = (session as any).id;
  const accountId = Number(idStr);
  if (!accountId) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

  await updateAccountProfile(accountId, {
    email: email === '' ? null : (email ? String(email) : null),
    avatar: avatar === '' ? null : (avatar ? String(avatar) : null),
  });

  return NextResponse.json({ ok: true });
}
