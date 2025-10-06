import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS web_discount_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    percent INT NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    expires_at DATETIME NULL,
    INDEX (account_id),
    INDEX (code),
    INDEX (used)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const s: any = session;
    const accountId = Number(s.id);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTables();

    const [rows] = await pool.query(
      `SELECT code, percent, used, created_at, used_at, expires_at
       FROM web_discount_codes
       WHERE account_id = ?
       ORDER BY id DESC`,
      [accountId]
    );

    const codes = (rows as any[]).map((r) => ({
      code: r.code as string,
      percent: Number(r.percent),
      used: !!r.used,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      usedAt: r.used_at ? new Date(r.used_at).toISOString() : null,
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    }));

    return NextResponse.json(codes);
  } catch (e) {
    console.error('codes/list', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
