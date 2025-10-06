"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import lockpickImg from '@/lockpick.png';

type Props = {
  legacycoin: number;
  characters: { id: number; name: string }[];
};

export default function ShopClient({ legacycoin, characters }: Props) {
  const router = useRouter();
  const [selectedChar, setSelectedChar] = useState<number | ''>(characters[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(legacycoin);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [discountCode, setDiscountCode] = useState('');

  const product = {
    key: 'lockpick',
    name: 'Lockpick',
    itemId: 400,
    price: 20,
    description: 'Nástroj k vypáčení zámků. Používej s rozumem a v rámci pravidel serveru.',
    image: lockpickImg,
  };

  const canAfford = useMemo(() => balance >= product.price, [balance]);

  async function buyLockpick() {
    if (!selectedChar) {
      setMsg({ type: 'error', text: 'Vyber postavu, které se má item poslat.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: Number(selectedChar),
          discountCode: discountCode.trim() ? discountCode.trim().toUpperCase() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const newBalance = Number(data.balance ?? balance - product.price);
        setBalance(newBalance);
        const discountInfo = data.appliedDiscount ? ` (sleva ${data.appliedDiscount}% aplikována)` : '';
        setMsg({ type: 'success', text: `Zakoupeno: Lockpick${discountInfo}. Položka bude doručena do hry.` });
        router.refresh();
      } else {
        setMsg({ type: 'error', text: String(data?.error || 'Nákup se nezdařil.') });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shop-products">
      {msg && (
        <div className={`card ${msg.type === 'success' ? 'success' : 'danger'}`} role="alert">
          {msg.text}
        </div>
      )}

      <div className="card product-card">
        <div className="product-layout">
          <div>
            <Image
              src={product.image}
              alt={product.name}
              width={140}
              height={140}
              className="rounded product-image"
            />
          </div>
          <div>
            <div className="product-head">
              <h3>{product.name}</h3>
              <div className="product-price">
                Cena: <strong className="value">{product.price}</strong> LC
              </div>
            </div>
            <div className="product-meta">Item ID {product.itemId}</div>
            <p className="product-desc">{product.description}</p>

            <div className="product-actions">
              <select
                className="input product-select"
                value={selectedChar}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedChar(e.target.value ? Number(e.target.value) : '')}
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (ID {c.id})</option>
                ))}
              </select>
              <input
                className="input product-select"
                placeholder="Slevový kód"
                value={discountCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountCode(e.target.value)}
              />
              <button
                className="btn"
                disabled={loading || !selectedChar}
                onClick={buyLockpick}
                title={loading ? 'Probíhá nákup' : !selectedChar ? 'Vyber postavu' : !canAfford ? 'Můžeš použít slevový kód' : ''}
              >
                {loading ? 'Kupuje se…' : 'Koupit'}
              </button>
              <div className="spacer">
                Zůstatek: <strong>{balance}</strong> LC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
