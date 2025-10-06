import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccounts, countAccounts } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  const isAdmin = (session as any)?.roles?.admin > 0;
  if (!session || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
  const search = url.searchParams.get('search') || undefined;

  const [items, total] = await Promise.all([
    getAccounts(page, pageSize, search || undefined),
    countAccounts(search || undefined),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
