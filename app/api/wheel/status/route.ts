import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS web_wheel_spins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    reward_value INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (account_id),
    INDEX (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

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
      'SELECT created_at FROM web_wheel_spins WHERE account_id = ? ORDER BY id DESC LIMIT 1',
      [accountId]
    );
    const arr = rows as any[];
    const last = arr?.[0]?.created_at ? new Date(arr[0].created_at) : null;

    const now = Date.now();
    const nextAt = last ? last.getTime() + 24 * 60 * 60 * 1000 : 0;

    return NextResponse.json({
      lastSpinAt: last ? last.toISOString() : null,
      nextAvailableAt: nextAt > now ? new Date(nextAt).toISOString() : null,
    });
  } catch (e) {
    console.error('wheel/status', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
