import { getServerStats, getServerStatus, getFactions, getTopPlayers, getVehicleStats } from '@/lib/db';
import Image from 'next/image';

export const metadata = { title: 'Statistiky Serveru - Legacy RP' };

export default async function StatsPage() {
  const [serverStats, serverStatus, factions, topPlayers, vehicleStats] = await Promise.all([
    getServerStats(),
    getServerStatus(),
    getFactions(),
    getTopPlayers(5),
    getVehicleStats(),
  ]);

  const onlineCount = serverStatus ? parseInt(serverStatus.players) : 0;
  const maxSlots = serverStatus ? parseInt(serverStatus.slots) : 50;

  return (
    <div className="stats-page">
      {/* Server Status Header */}
      <div className="server-status-header">
        <div className="status-card">
          <div className="status-indicator">
            <div className={`status-dot ${serverStatus?.status === 'Online' ? 'online' : 'offline'}`}></div>
            <span className="status-text">
              {serverStatus?.status === 'Online' ? 'Server Online' : 'Server Offline'}
            </span>
          </div>
          <div className="server-name">
            {serverStatus?.hostname ? 
              serverStatus.hostname.replace(/\\u[\dA-F]{4}/gi, (match) => 
                String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
              ) : 'Legacy RP Server'
            }
          </div>
          <div className="player-count">
            <span className="current">{onlineCount}</span>
            <span className="separator">/</span>
            <span className="max">{maxSlots}</span>
            <span className="label">hráčů online</span>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-number">{serverStats.totalAccounts.toLocaleString()}</div>
          <div className="stat-label">Registrovaných účtů</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎭</div>
          <div className="stat-number">{serverStats.totalCharacters.toLocaleString()}</div>
          <div className="stat-label">Vytvořených postav</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-number">{serverStats.totalFactions}</div>
          <div className="stat-label">Aktivních frakcí</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-number">{vehicleStats.total.toLocaleString()}</div>
          <div className="stat-label">Vozidel na serveru</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-number">{serverStats.recentRegistrations}</div>
          <div className="stat-label">Nových hráčů (7 dní)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-number">{serverStats.activeBans}</div>
          <div className="stat-label">Aktivních banů</div>
        </div>
      </div>

      {/* Online Players */}
      {serverStatus && serverStatus.players_list && serverStatus.players_list.length > 0 && (
        <div className="card">
          <h2>Hráči Online ({serverStatus.players_list.length})</h2>
          <div className="online-players">
            {serverStatus.players_list.map((player, index) => (
              <div key={index} className="player-item">
                <div className="player-avatar">
                  {player.name.charAt(0)}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-stats">
                    Score: {player.score} | Ping: {player.ping}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Players */}
      <div className="card">
        <h2>Top Hráči (podle hodin)</h2>
        <div className="leaderboard">
          {topPlayers.map((player, index) => (
            <div key={player.id} className="leaderboard-item">
              <div className="rank">#{index + 1}</div>
              <div className="player-info">
                <div className="character-name">{player.charactername}</div>
                <div className="player-details">
                  {player.hours}h | ${player.money?.toLocaleString()} | K/D: {player.kills}/{player.deaths}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Factions */}
      <div className="card">
        <h2>Největší Frakce</h2>
        <div className="factions-grid">
          {factions.slice(0, 6).map((faction) => (
            <div key={faction.id} className="faction-card">
              <div className="faction-name">{faction.name}</div>
              <div className="faction-members">{faction.members} členů</div>
              <div className="faction-money">${faction.money?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Statistics */}
      <div className="card">
        <h2>Statistiky Vozidel</h2>
        <div className="vehicle-stats">
          <div className="vehicle-stat">
            <div className="vehicle-number">{vehicleStats.total}</div>
            <div className="vehicle-label">Celkem vozidel</div>
          </div>
          <div className="vehicle-stat">
            <div className="vehicle-number">{vehicleStats.personal}</div>
            <div className="vehicle-label">Osobních vozidel</div>
          </div>
          <div className="vehicle-stat">
            <div className="vehicle-number">{vehicleStats.byFaction}</div>
            <div className="vehicle-label">Frakčních vozidel</div>
          </div>
        </div>
      </div>
    </div>
  );
}
