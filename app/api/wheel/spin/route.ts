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

function chooseOutcome(): { outcome: 'none' | 'lc5' | 'lc10' | 'lc100' | 'code50'; value?: number } {
  // Probabilities (must sum to 1): none 0.5, 5LC 0.3, 10LC 0.14, 50% code 0.05, 100LC 0.01
  const r = Math.random();
  if (r < 0.5) return { outcome: 'none' };
  if (r < 0.8) return { outcome: 'lc5', value: 5 };
  if (r < 0.94) return { outcome: 'lc10', value: 10 };
  if (r < 0.99) return { outcome: 'code50' };
  return { outcome: 'lc100', value: 100 };
}

function genCode(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'LEG-';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const s: any = session;
    const accountId = Number(s.id);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTables();

    // cooldown check
    const [rows] = await pool.query(
      'SELECT created_at FROM web_wheel_spins WHERE account_id = ? ORDER BY id DESC LIMIT 1',
      [accountId]
    );
    const arr = rows as any[];
    const last = arr?.[0]?.created_at ? new Date(arr[0].created_at) : null;
    const nowMs = Date.now();
    const nextAtMs = last ? last.getTime() + 24 * 60 * 60 * 1000 : 0;
    if (last && nowMs < nextAtMs) {
      return NextResponse.json({ error: 'Můžeš točit jednou za 24 hodin.', nextAvailableAt: new Date(nextAtMs).toISOString() }, { status: 429 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const choice = chooseOutcome();
      let rewardMessage = '';
      let outcomeKey = choice.outcome;
      let rewardValue: number | null = null;
      let generatedCode: string | null = null;

      if (choice.outcome === 'lc5' || choice.outcome === 'lc10' || choice.outcome === 'lc100') {
        rewardValue = choice.value || 0;
        await conn.query('UPDATE accounts SET legacycoin = legacycoin + ? WHERE id = ?', [rewardValue, accountId]);
        rewardMessage = `Získal jsi ${rewardValue} LegacyCoin!`;
      } else if (choice.outcome === 'code50') {
        // generate a single-use 50% code valid for 7 days
        let code = genCode(10);
        // ensure uniqueness
        for (let i = 0; i < 5; i++) {
          try {
            const [res] = await conn.query(
              'INSERT INTO web_discount_codes (account_id, code, percent, used, expires_at) VALUES (?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 7 DAY))',
              [accountId, code, 50]
            );
            generatedCode = code;
            break;
          } catch (e: any) {
            code = genCode(10);
          }
        }
        rewardMessage = 'Získal jsi slevový kód 50% (platnost 7 dní)! Najdeš ho v Dashboardu → Moje kódy.';
      } else {
        rewardMessage = 'Tentokrát nic nepadlo. Zkus štěstí znovu za 24h!';
      }

      await conn.query(
        'INSERT INTO web_wheel_spins (account_id, outcome, reward_value) VALUES (?, ?, ?)',
        [accountId, outcomeKey, rewardValue]
      );

      await conn.commit();

      const nextAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return NextResponse.json({ ok: true, outcome: outcomeKey, rewardMessage, discountCode: generatedCode, nextAvailableAt: nextAt });
    } catch (e) {
      try { await (conn as any).rollback(); } catch {}
      console.error('wheel/spin error', e);
      return NextResponse.json({ error: 'Chyba při točení.' }, { status: 500 });
    } finally {
      try { conn.release(); } catch {}
    }
  } catch (e) {
    console.error('wheel/spin handler', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
