import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

// Constants for the Lockpick item
const LOCKPICK_ITEM_ID = 400;
const LOCKPICK_PRICE = 20; // LegacyCoins

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const s: any = session;
    const accountId = Number(s.id);
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const characterId = Number(body?.characterId);
    const discountCode: string | undefined = body?.discountCode ? String(body.discountCode).trim().toUpperCase() : undefined;
    if (!characterId || isNaN(characterId)) {
      return NextResponse.json({ error: 'Neplatná postava.' }, { status: 400 });
    }

    // Validate character belongs to account
    {
      const [rows] = await pool.query('SELECT id FROM characters WHERE id = ? AND account = ? LIMIT 1', [characterId, accountId]);
      const arr = rows as any[];
      if (!arr || arr.length === 0) {
        return NextResponse.json({ error: 'Tato postava ti nepatří.' }, { status: 403 });
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Optionally validate discount code
      let discountPercent = 0;
      if (discountCode) {
        const [dcRows] = await conn.query(
          'SELECT id, percent FROM web_discount_codes WHERE code = ? AND account_id = ? AND used = 0 AND (expires_at IS NULL OR expires_at >= NOW()) LIMIT 1',
          [discountCode, accountId]
        );
        const dcArr = dcRows as any[];
        if (!dcArr || dcArr.length === 0) {
          await conn.rollback();
          return NextResponse.json({ error: 'Neplatný nebo použitý slevový kód.' }, { status: 400 });
        }
        discountPercent = Math.min(100, Math.max(0, Number(dcArr[0].percent || 0)));
      }

      const finalPrice = Math.max(0, Math.ceil(LOCKPICK_PRICE * (1 - discountPercent / 100)));

      // Lock balance row
      const [balRows] = await conn.query('SELECT legacycoin FROM accounts WHERE id = ? FOR UPDATE', [accountId]);
      const balArr = balRows as any[];
      const current = Number(balArr?.[0]?.legacycoin ?? 0);
      if (current < finalPrice) {
        await conn.rollback();
        return NextResponse.json({ error: 'Nedostatek LegacyCoin.' }, { status: 400 });
      }

      // Deduct
      await conn.query('UPDATE accounts SET legacycoin = legacycoin - ? WHERE id = ?', [finalPrice, accountId]);

      // If a discount code was used, mark it used
      if (discountCode) {
        await conn.query('UPDATE web_discount_codes SET used = 1, used_at = NOW() WHERE code = ? AND account_id = ? AND used = 0', [discountCode, accountId]);
      }

      // Enqueue purchase for MTA resource to deliver via exports.global:giveItem
      await conn.query(
        "INSERT INTO web_purchase_queue (account_id, character_id, item_id, item_value, status) VALUES (?, ?, ?, ?, 'pending')",
        [accountId, characterId, LOCKPICK_ITEM_ID, '1']
      );

      // Get new balance
      const [newRows] = await conn.query('SELECT legacycoin FROM accounts WHERE id = ? LIMIT 1', [accountId]);
      const newArr = newRows as any[];
      const newBalance = Number(newArr?.[0]?.legacycoin ?? current - finalPrice);

      await conn.commit();
      return NextResponse.json({ ok: true, balance: newBalance, appliedDiscount: discountPercent || undefined });
    } catch (e: any) {
      try { await (pool as any).releaseConnection?.(conn); } catch {}
      try { await (conn as any).rollback(); } catch {}
      console.error('Purchase error', e);
      return NextResponse.json({ error: 'Chyba při nákupu.' }, { status: 500 });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
