import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBans, countBans, createBan, unbanAccount } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  const isAdmin = (session as any)?.roles?.admin > 0;
  if (!session || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));

  const [items, total] = await Promise.all([
    getBans(page, pageSize),
    countBans(),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const isAdmin = (session as any)?.roles?.admin > 0;
  if (!session || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { accountId, reason, days, permanent, ip, mta_serial } = body || {};
  if (!reason || (!accountId && !ip && !mta_serial)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = await createBan({
    accountId: accountId ? Number(accountId) : undefined,
    adminId: Number((session as any).id),
    reason: String(reason),
    days: days ? Number(days) : undefined,
    permanent: Boolean(permanent),
    ip: ip ? String(ip) : null,
    mta_serial: mta_serial ? String(mta_serial) : null,
  });

  return NextResponse.json({ id });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions as any);
  const isAdmin = (session as any)?.roles?.admin > 0;
  if (!session || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const accountId = url.searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }
  const removed = await unbanAccount(Number(accountId));
  return NextResponse.json({ removed });
}
