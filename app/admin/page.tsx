
"use client";
import { useEffect, useMemo, useState } from 'react';

type UserItem = {
  id: number;
  username: string;
  email: string | null;
  activated: number;
  avatar: string | null;
  admin: number;
  supporter: number;
  vct: number;
  mapper: number;
  scripter: number;
  fmt: number;
};

type BanItem = {
  id: number;
  mta_serial: string | null;
  ip: string | null;
  account: number | null;
  admin: number | null;
  reason: string;
  date: string;
  until: string | null;
  threadid: number | null;
};

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'bans' | 'settings' | 'logs' | 'vehicles'>('users');

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [uPage, setUPage] = useState(1);
  const [uPageSize] = useState(20);
  const [uTotal, setUTotal] = useState(0);
  const [uSearch, setUSearch] = useState('');
  const [uLoading, setULoading] = useState(false);

  // Bans state
  const [bans, setBans] = useState<BanItem[]>([]);
  const [bPage, setBPage] = useState(1);
  const [bPageSize] = useState(20);
  const [bTotal, setBTotal] = useState(0);
  const [bLoading, setBLoading] = useState(false);

  const uPages = useMemo(() => Math.max(1, Math.ceil(uTotal / uPageSize)), [uTotal, uPageSize]);
  const bPages = useMemo(() => Math.max(1, Math.ceil(bTotal / bPageSize)), [bTotal, bPageSize]);

  useEffect(() => {
    if (tab !== 'users') return;
    (async () => {
      setULoading(true);
      try {
        const url = new URL('/api/admin/users', window.location.origin);
        url.searchParams.set('page', String(uPage));
        url.searchParams.set('pageSize', String(uPageSize));
        if (uSearch.trim()) url.searchParams.set('search', uSearch.trim());
        const res = await fetch(url.toString());
        const data = await res.json();
        if (res.ok) {
          setUsers(data.items || []);
          setUTotal(Number(data.total || 0));
        }
      } finally {
        setULoading(false);
      }
    })();
  }, [tab, uPage, uPageSize, uSearch]);

  useEffect(() => {
    if (tab !== 'bans') return;
    (async () => {
      setBLoading(true);
      try {
        const url = new URL('/api/admin/bans', window.location.origin);
        url.searchParams.set('page', String(bPage));
        url.searchParams.set('pageSize', String(bPageSize));
        const res = await fetch(url.toString());
        const data = await res.json();
        if (res.ok) {
          setBans(data.items || []);
          setBTotal(Number(data.total || 0));
        }
      } finally {
        setBLoading(false);
      }
    })();
  }, [tab, bPage, bPageSize]);

  async function banUser(userId: number) {
    const reason = prompt('Důvod banu?');
    if (!reason) return;
    const daysStr = prompt('Počet dní (prázdné = permanentní)?');
    const days = daysStr ? Number(daysStr) : undefined;
    const permanent = !days;
    const res = await fetch('/api/admin/bans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: userId, reason, days, permanent }),
    });
    if (res.ok) {
      alert('Uživatel zabanován');
      if (tab === 'bans') setBPage(1);
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || 'Chyba při banování');
    }
  }

  async function unbanAccount(accountId: number) {
    const ok = confirm('Odbanovat tento účet?');
    if (!ok) return;
    const res = await fetch(`/api/admin/bans?accountId=${accountId}`, { method: 'DELETE' });
    if (res.ok) {
      if (tab === 'bans') {
        setBPage(1);
      }
      alert('Odbanováno');
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || 'Chyba při odbanování');
    }
  }

  const tabs = [
    { id: 'users', label: 'Uživatelé', icon: '👥' },
    { id: 'bans', label: 'Bany', icon: '🚫' },
    { id: 'vehicles', label: 'Vozidla', icon: '🚗' },
    { id: 'logs', label: 'Logy', icon: '📊' },
    { id: 'settings', label: 'Nastavení', icon: '⚙️' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>🛡️ Admin Panel</h1>
          <p>Správa serveru Legacy RP</p>
        </div>
        <div className="admin-stats">
          <div className="stat-item">
            <span className="stat-number">{uTotal}</span>
            <span className="stat-label">Uživatelů</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{bTotal}</span>
            <span className="stat-label">Banů</span>
          </div>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                className={`nav-item ${tab === tabItem.id ? 'active' : ''}`}
                onClick={() => setTab(tabItem.id as any)}
              >
                <span className="nav-icon">{tabItem.icon}</span>
                <span className="nav-label">{tabItem.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-content">
          {tab === 'users' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Správa uživatelů</h2>
                <div className="search-bar">
                  <input
                    className="search-input"
                    placeholder="Hledat podle jména nebo emailu..."
                    value={uSearch}
                    onChange={(e) => setUSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setUPage(1); }}
                  />
                  <button className="search-btn" onClick={() => setUPage(1)}>
                    🔍
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Uživatel</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!uLoading && users.map(u => (
                      <tr key={u.id} className="table-row">
                        <td className="id-cell">{u.id}</td>
                        <td className="user-cell">
                          <div className="user-info">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="user-avatar" />
                            ) : (
                              <div className="user-avatar-fallback">{u.username[0]}</div>
                            )}
                            <span className="username">{u.username}</span>
                          </div>
                        </td>
                        <td className="email-cell">{u.email || '-'}</td>
                        <td className="roles-cell">
                          <div className="role-badges">
                            {u.admin ? <span className="role-badge admin">Admin</span> : null}
                            {u.supporter ? <span className="role-badge supporter">Support</span> : null}
                            {u.vct ? <span className="role-badge vct">VCT</span> : null}
                            {u.mapper ? <span className="role-badge mapper">Mapper</span> : null}
                            {u.scripter ? <span className="role-badge scripter">Scripter</span> : null}
                            {u.fmt ? <span className="role-badge fmt">FMT</span> : null}
                          </div>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${u.activated ? 'active' : 'inactive'}`}>
                            {u.activated ? 'Aktivní' : 'Neaktivní'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="action-btn ban" onClick={() => banUser(u.id)}>
                              Ban
                            </button>
                            <button className="action-btn unban" onClick={() => unbanAccount(u.id)}>
                              Unban
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {uLoading && (
                      <tr><td colSpan={6} className="loading-row">
                        <div className="loading-spinner"></div>
                        Načítám...
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  disabled={uPage <= 1} 
                  onClick={() => setUPage(p => Math.max(1, p - 1))}
                >
                  ← Předchozí
                </button>
                <span className="pagination-info">Stránka {uPage} z {uPages}</span>
                <button 
                  className="pagination-btn" 
                  disabled={uPage >= uPages} 
                  onClick={() => setUPage(p => Math.min(uPages, p + 1))}
                >
                  Další →
                </button>
              </div>
            </div>
          )}

          {tab === 'bans' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Správa banů</h2>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Účet</th>
                      <th>IP</th>
                      <th>Serial</th>
                      <th>Důvod</th>
                      <th>Datum</th>
                      <th>Do</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!bLoading && bans.map(b => (
                      <tr key={b.id} className="table-row">
                        <td className="id-cell">{b.id}</td>
                        <td>{b.account ?? '-'}</td>
                        <td className="ip-cell">{b.ip ?? '-'}</td>
                        <td className="serial-cell">{b.mta_serial ?? '-'}</td>
                        <td className="reason-cell">{b.reason}</td>
                        <td className="date-cell">{new Date(b.date).toLocaleString('cs-CZ')}</td>
                        <td className="until-cell">
                          {b.until ? (
                            <span className="temporary-ban">{new Date(b.until).toLocaleString('cs-CZ')}</span>
                          ) : (
                            <span className="permanent-ban">Permanentní</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          {b.account ? (
                            <button className="action-btn unban" onClick={() => unbanAccount(b.account!)}>
                              Odbanovat
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {bLoading && (
                      <tr><td colSpan={8} className="loading-row">
                        <div className="loading-spinner"></div>
                        Načítám...
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  disabled={bPage <= 1} 
                  onClick={() => setBPage(p => Math.max(1, p - 1))}
                >
                  ← Předchozí
                </button>
                <span className="pagination-info">Stránka {bPage} z {bPages}</span>
                <button 
                  className="pagination-btn" 
                  disabled={bPage >= bPages} 
                  onClick={() => setBPage(p => Math.min(bPages, p + 1))}
                >
                  Další →
                </button>
              </div>
            </div>
          )}

          {tab === 'vehicles' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Správa vozidel</h2>
              </div>
              <div className="coming-soon">
                <div className="coming-soon-icon">🚗</div>
                <h3>Správa vozidel</h3>
                <p>Tato funkce bude brzy dostupná. Zde budete moci spravovat všechna vozidla na serveru.</p>
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Systémové logy</h2>
              </div>
              <div className="coming-soon">
                <div className="coming-soon-icon">📊</div>
                <h3>Systémové logy</h3>
                <p>Zde budete moci zobrazit všechny důležité události na serveru.</p>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Nastavení serveru</h2>
              </div>
              <div className="settings-grid">
                <div className="setting-card">
                  <h3>🌐 Globální nastavení</h3>
                  <p>Základní konfigurace serveru</p>
                  <button className="btn-secondary">Upravit</button>
                </div>
                <div className="setting-card">
                  <h3>💰 Ekonomika</h3>
                  <p>Nastavení ekonomického systému</p>
                  <button className="btn-secondary">Upravit</button>
                </div>
                <div className="setting-card">
                  <h3>🏠 Nemovitosti</h3>
                  <p>Konfigurace systému nemovitostí</p>
                  <button className="btn-secondary">Upravit</button>
                </div>
                <div className="setting-card">
                  <h3>🚗 Vozidla</h3>
                  <p>Nastavení vozového parku</p>
                  <button className="btn-secondary">Upravit</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
