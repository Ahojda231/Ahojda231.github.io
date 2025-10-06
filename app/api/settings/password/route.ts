import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccountById, updateAccountPassword } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body?.currentPassword || '');
  const newPassword = String(body?.newPassword || '');

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 });
  }

  const idStr = (session as any).id;
  const accountId = Number(idStr);
  if (!accountId) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

  const account = await getAccountById(accountId);
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const storedHash = (account.password || '').replace(/^\$2y\$/i, '$2b$');
  const ok = await bcrypt.compare(currentPassword, storedHash);
  if (!ok) return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });

  const nodeHash = await bcrypt.hash(newPassword, 10);
  const phpCompatHash = nodeHash.replace(/^\$2[ab]\$/i, '$2y$');
  await updateAccountPassword(accountId, phpCompatHash);

  return NextResponse.json({ ok: true });
}
