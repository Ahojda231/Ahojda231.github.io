"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();
  const authed = status === 'authenticated';
  const roles = ((session as any)?.roles ?? {}) as { [k: string]: number };
  const roleLabels = [
    { key: 'admin', label: 'Admin' },
    { key: 'scripter', label: 'Scripter' },
    { key: 'mapper', label: 'Mapper' },
    { key: 'supporter', label: 'Support' },
    { key: 'vct', label: 'VCT' },
    { key: 'fmt', label: 'FMT' },
  ];
  const activeRoles = roleLabels.filter(r => (roles[r.key] ?? 0) > 0);

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>Legacy RP</Link>
        <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link href="/stats" style={{ color: 'white', textDecoration: 'none' }}>Statistiky</Link>
        {authed && (
          <Link href="/shop" style={{ color: 'white', textDecoration: 'none' }}>Shop</Link>
        )}
        {authed && (
          <Link href="/settings" style={{ color: 'white', textDecoration: 'none' }}>Nastavení</Link>
        )}
        {authed && (roles['admin'] ?? 0) > 0 && (
          <Link href="/admin" style={{ color: '#C6A046', textDecoration: 'none', fontWeight: 600 }}>Admin</Link>
        )}
      </nav>
      <div>
        {authed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid #C6A046' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2236', display: 'grid', placeItems: 'center', fontSize: 12, color: '#C6A046', border: '1px solid #2a334d' }}>
                {(session?.user?.name || '?').slice(0,1)}
              </div>
            )}
            <span>{session?.user?.name}</span>
            {activeRoles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {activeRoles.slice(0,3).map(r => (
                  <span key={r.key} className="badge-gold" style={{ padding: '2px 6px', fontSize: 11 }}>
                    {r.label}{(roles[r.key] ?? 0) > 1 ? ` ${(roles[r.key])}` : ''}
                  </span>
                ))}
                {activeRoles.length > 3 && (
                  <span className="badge-muted" style={{ padding: '2px 6px', fontSize: 11 }}>+{activeRoles.length - 3}</span>
                )}
              </div>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} style={btnStyle}>Odhlásit</button>
          </div>
        ) : (
          <button onClick={() => signIn()} style={btnStyle}>Přihlásit</button>
        )}
      </div>
    </header>
  );
}

const btnStyle = {
  padding: '8px 12px',
  background: 'linear-gradient(180deg, #E6C379, #C6A046)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
};
