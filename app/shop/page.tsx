import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { pool, getCharactersForAccount } from '@/lib/db';
import ShopClient from '@/components/ShopClient';
import WheelOfFortune from '@/components/WheelOfFortune';
import Image from 'next/image';
import lockpickImg from '@/lockpick.png';

export const metadata = { title: 'Shop - Legacy RP' };

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  const s = session as any;
  const accountId = Number(s.id);
  if (!accountId) redirect('/login');

  // Load LegacyCoin balance
  const [rows] = await pool.query('SELECT legacycoin FROM accounts WHERE id = ? LIMIT 1', [accountId]);
  const arr = rows as any[];
  const legacycoin: number = Number(arr?.[0]?.legacycoin ?? 0);

  // Load characters to select receiver
  const characters = await getCharactersForAccount(accountId);

  return (
    <section className="shop-page">
      <div className="card gold-glow shop-hero">
        <div className="shop-hero-grid">
          <div>
            <h1 className="shop-hero-title">Shop</h1>
            <p className="shop-balance">
              Zůstatek LegacyCoin: <strong className="value">{legacycoin}</strong>
            </p>
            <p className="shop-hero-desc">
              Nakupuj herní položky a nechej si je doručit rovnou na vybranou postavu.
            </p>
          </div>
          <div className="align-end">
            <Image src={lockpickImg} alt="Lockpick" width={200} height={200} className="rounded product-image" />
          </div>
        </div>
      </div>

      <div className="card shop-section">
        <h2>Položky</h2>
        <ShopClient
          legacycoin={legacycoin}
          characters={characters.map(c => ({ id: c.id, name: c.charactername || `Postava #${c.id}` }))}
        />
      </div>

      {/* Mount the Wheel of Fortune sidebar */}
      <WheelOfFortune />
    </section>
  );
}
