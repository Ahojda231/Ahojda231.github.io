"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";

type CharacterRow = {
  id: number;
  charactername: string | null;
  account: number;
  money: number;
  bankmoney: number;
  level: number;
  xp: number;
  hoursplayed: number;
  health: number;
  armor: number;
  skin: number;
  lastlogin: Date | null;
};

type ServerStats = {
  totalAccounts: number;
  totalCharacters: number;
  totalFactions: number;
  activeBans: number;
  onlinePlayersCount: number;
  recentRegistrations: number;
};

type ServerStatus = {
  status: string;
  hostname: string;
  players: string;
  slots: string;
  map: string;
  memory: string;
  cpu: string;
  players_list: Array<{
    name: string;
    time: boolean | number;
    kills: number | null;
    deaths: number | null;
    score: string;
    ping: string;
  }>;
};

type DiscountCode = {
  code: string;
  percent: number;
  used: boolean;
  createdAt: string | null;
  usedAt: string | null;
  expiresAt: string | null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [serverStats, setServerStats] = useState<ServerStats>({
    totalAccounts: 0,
    totalCharacters: 0,
    totalFactions: 0,
    activeBans: 0,
    onlinePlayersCount: 0,
    recentRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [codes, setCodes] = useState<DiscountCode[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status === "loading") return;

    const fetchData = async () => {
      try {
        const [charactersRes, serverStatusRes, serverStatsRes, codesRes] =
          await Promise.all([
            fetch("/api/characters"),
            fetch("/api/server/status"),
            fetch("/api/server/stats"),
            fetch("/api/codes"),
          ]);

        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          setCharacters(charactersData);
        }

        if (serverStatusRes.ok) {
          const statusData = await serverStatusRes.json();
          setServerStatus(statusData);
        }

        if (serverStatsRes.ok) {
          const statsData = await serverStatsRes.json();
          setServerStats(statsData);
        }

        if (codesRes.ok) {
          const codesData = await codesRes.json();
          setCodes(Array.isArray(codesData) ? codesData : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Načítám dashboard...</p>
      </div>
    );
  }

  if (!session) return null;

  const s = session as any;
  const roles = (s.roles ?? {}) as {
    admin?: number;
    supporter?: number;
    vct?: number;
    mapper?: number;
    scripter?: number;
    fmt?: number;
  };
  const roleLabels: { key: keyof typeof roles; label: string; icon: string }[] =
    [
      { key: "admin", label: "Admin", icon: "👑" },
      { key: "scripter", label: "Scripter", icon: "💻" },
      { key: "mapper", label: "Mapper", icon: "🗺️" },
      { key: "supporter", label: "Support", icon: "🛠️" },
      { key: "vct", label: "VCT", icon: "🚗" },
      { key: "fmt", label: "FMT", icon: "🎯" },
    ];
  const activeRoles = roleLabels.filter((r) => (roles[r.key] ?? 0) > 0);

  const openCharacterModal = (character: CharacterRow) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  return (
    <div className="dashboard-container">
      {/* Command Center Header */}
      <div className="command-center">
        <div className="terminal-header">
          <div className="terminal-line">
            <span className="terminal-prompt">LEGACY_RP@TERMINAL:~$</span>
            <span className="terminal-cursor">_</span>
          </div>
        </div>
        <div className="operator-info">
          <div className="operator-id">
            <div className="id-badge">
              {s.user?.image ? (
                <Image
                  src={s.user.image}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="operator-avatar"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="operator-avatar-fallback">
                  {(s.user?.name || "?").slice(0, 1)}
                </div>
              )}
            </div>
            <div className="id-details">
              <div className="operator-name">OPERATOR: {s.user?.name}</div>
              <div className="operator-status">STATUS: ACTIVE</div>
            </div>
          </div>
          <div className="clearance-level">
            <div className="clearance-header">CLEARANCE</div>
            <div className="clearance-badges">
              {activeRoles.length > 0 ? (
                activeRoles.map((r) => (
                  <div key={r.key} className="clearance-badge">
                    <span className="clearance-icon">{r.icon}</span>
                    <span className="clearance-text">{r.label}</span>
                    {(roles[r.key] ?? 0) > 1 && (
                      <span className="clearance-level-num">
                        {roles[r.key]}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="clearance-badge standard">
                  <span className="clearance-icon">◦</span>
                  <span className="clearance-text">STANDARD</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="system-grid">
        <div className="system-panel primary">
          <div className="panel-header">SYSTEM STATUS</div>
          <div className="panel-content">
            <div className="status-indicator">
              <div
                className={`status-light ${serverStatus?.status === "Online" ? "online" : "offline"}`}
              ></div>
              <div className="status-text">
                {serverStatus?.status === "Online" ? "OPERATIONAL" : "OFFLINE"}
              </div>
            </div>
          </div>
        </div>

        <div className="system-panel">
          <div className="panel-header">ACTIVE USERS</div>
          <div className="panel-content">
            <div className="metric-display">
              <span className="metric-number">
                {serverStatus ? serverStatus.players : "0"}
              </span>
              <span className="metric-separator">/</span>
              <span className="metric-max">
                {serverStatus ? serverStatus.slots : "50"}
              </span>
            </div>
          </div>
        </div>

        <div className="system-panel">
          <div className="panel-header">TOTAL ACCOUNTS</div>
          <div className="panel-content">
            <div className="metric-number large">
              {serverStats.totalAccounts.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="system-panel">
          <div className="panel-header">ACTIVE ENTITIES</div>
          <div className="panel-content">
            <div className="metric-number large">
              {serverStats.totalCharacters.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Entity Database */}
      <div className="database-section">
        <div className="database-header">
          <div className="db-title">ENTITY DATABASE</div>
          <div className="db-subtitle">Registered character entities</div>
        </div>

        {characters.length === 0 ? (
          <div className="no-data-panel">
            <div className="no-data-icon">◦</div>
            <div className="no-data-text">NO ENTITIES FOUND</div>
            <div className="no-data-desc">
              Connect to server to register new character entity
            </div>
          </div>
        ) : (
          <div className="entities-grid">
            {characters.map((ch) => (
              <div key={ch.id} className="entity-card">
                <div className="entity-header">
                  <div className="entity-id">
                    #{String(ch.id).padStart(4, "0")}
                  </div>
                  <div className="entity-avatar">
                    <div className="avatar-hex">
                      {(ch.charactername || "??").slice(0, 1)}
                    </div>
                  </div>
                </div>
                <div className="entity-data">
                  <div className="entity-name">{ch.charactername}</div>
                  <div className="entity-metrics">
                    <div className="metric-row">
                      <span className="metric-label">CASH</span>
                      <span className="metric-value">
                        ${(ch.money || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">BANK</span>
                      <span className="metric-value">
                        ${(ch.bankmoney || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">LEVEL</span>
                      <span className="metric-value">{ch.level || 1}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">TIME</span>
                      <span className="metric-value">
                        {ch.hoursplayed || 0}H
                      </span>
                    </div>
                  </div>
                </div>
                <div className="entity-actions">
                  <button
                    className="access-btn"
                    onClick={() => openCharacterModal(ch)}
                  >
                    ACCESS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Discount Codes */}
      <div className="database-section">
        <div className="database-header">
          <div className="db-title">MY CODES</div>
          <div className="db-subtitle">Discount codes from Wheel of Fortune</div>
        </div>

        {(!codes || codes.length === 0) ? (
          <div className="no-data-panel">
            <div className="no-data-icon">◦</div>
            <div className="no-data-text">NO CODES AVAILABLE</div>
            <div className="no-data-desc">Spin the wheel in the shop to try your luck</div>
          </div>
        ) : (
          <div className="entities-grid">
            {codes.map((c) => {
              const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
              return (
                <div key={c.code} className="entity-card">
                  <div className="entity-header">
                    <div className="entity-id">{c.percent}% OFF</div>
                    <div className="entity-avatar">
                      <div className="avatar-hex">%</div>
                    </div>
                  </div>
                  <div className="entity-data">
                    <div className="entity-name" style={{ fontFamily: 'monospace' }}>{c.code}</div>
                    <div className="entity-metrics">
                      <div className="metric-row">
                        <span className="metric-label">STATUS</span>
                        <span className="metric-value">
                          {c.used ? 'USED' : expired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div className="metric-row">
                        <span className="metric-label">EXPIRES</span>
                        <span className="metric-value">
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleString('cs-CZ') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="entity-actions">
                    <button
                      className="access-btn"
                      onClick={() => navigator.clipboard?.writeText(c.code)}
                      disabled={c.used || expired}
                    >
                      COPY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Matrix */}
      <div className="nav-matrix">
        <div className="matrix-header">
          <div className="matrix-title">NAVIGATION MATRIX</div>
        </div>

        <div className="matrix-grid">
          <div className="nav-node">
            <div className="node-header">
              <span className="node-icon">█</span>
              <span className="node-code">STATS</span>
            </div>
            <div className="node-desc">Server analytics & metrics</div>
            <a href="/stats" className="node-link">
              → ACCESS
            </a>
          </div>

          <div className="nav-node">
            <div className="node-header">
              <span className="node-icon">▲</span>
              <span className="node-code">CONFIG</span>
            </div>
            <div className="node-desc">Account configuration</div>
            <a href="/settings" className="node-link">
              → ACCESS
            </a>
          </div>

          {activeRoles.some((r) => r.key === "admin") && (
            <div className="nav-node admin">
              <div className="node-header">
                <span className="node-icon">◆</span>
                <span className="node-code">ADMIN</span>
              </div>
              <div className="node-desc">System administration</div>
              <a href="/admin" className="node-link admin">
                → ACCESS
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Character Detail Modal */}
      {isModalOpen && selectedCharacter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail postavy</h2>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="character-detail-header">
                <div className="character-avatar-large">
                  <div className="character-initial-large">
                    {(selectedCharacter.charactername || "??").slice(0, 1)}
                  </div>
                </div>
                <div className="character-detail-info">
                  <h3>{selectedCharacter.charactername}</h3>
                  <p className="character-id">ID: {selectedCharacter.id}</p>
                </div>
              </div>

              <div className="character-stats-grid">
                <div className="stat-box">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <div className="stat-label">Hotovost</div>
                    <div className="stat-value">
                      ${(selectedCharacter.money || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">🏦</div>
                  <div className="stat-info">
                    <div className="stat-label">V bance</div>
                    <div className="stat-value">
                      ${(selectedCharacter.bankmoney || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <div className="stat-label">Level</div>
                    <div className="stat-value">
                      {selectedCharacter.level || 1}
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-info">
                    <div className="stat-label">Zkušenosti</div>
                    <div className="stat-value">
                      {selectedCharacter.xp || 0} XP
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <div className="stat-label">Odehráno</div>
                    <div className="stat-value">
                      {selectedCharacter.hoursplayed || 0}h
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">❤️</div>
                  <div className="stat-info">
                    <div className="stat-label">Zdraví</div>
                    <div className="stat-value">
                      {Math.round(selectedCharacter.health || 100)}%
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">🛡️</div>
                  <div className="stat-info">
                    <div className="stat-label">Brnění</div>
                    <div className="stat-value">
                      {Math.round(selectedCharacter.armor || 0)}%
                    </div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon">👤</div>
                  <div className="stat-info">
                    <div className="stat-label">Skin ID</div>
                    <div className="stat-value">
                      {selectedCharacter.skin || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="character-additional-info">
                <div className="info-section">
                  <h4>🔢 Celková hodnota</h4>
                  <p className="total-money">
                    $
                    {(
                      (selectedCharacter.money || 0) +
                      (selectedCharacter.bankmoney || 0)
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="info-section">
                  <h4>📅 Poslední přihlášení</h4>
                  <p>
                    {selectedCharacter.lastlogin
                      ? new Date(selectedCharacter.lastlogin).toLocaleString(
                          "cs-CZ",
                        )
                      : "Nikdy"}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
