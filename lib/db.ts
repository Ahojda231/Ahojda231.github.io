import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT = "3306", DB_NAME, DB_USER, DB_PASS } = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASS) {
  // Do not throw at import time on Vercel build, but log for visibility
  console.warn(
    "DB env vars are not fully set. Ensure DB_HOST, DB_NAME, DB_USER, DB_PASS are configured.",
  );
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT || 3306),
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
});

export type AccountRow = {
  id: number;
  username: string;
  password: string;
  email: string | null;
  activated: number;
  avatar: string | null;
  admin: number; // >=1 means some admin level
  supporter: number;
  vct: number;
  mapper: number;
  scripter: number;
  fmt: number;
};

export async function getAccountByUsername(
  username: string,
): Promise<AccountRow | null> {
  const [rows] = await pool.query(
    "SELECT id, username, password, email, activated, avatar, admin, supporter, vct, mapper, scripter, fmt FROM accounts WHERE username = ? LIMIT 1",
    [username],
  );
  const arr = rows as any[];
  if (!arr || arr.length === 0) return null;
  return arr[0] as AccountRow;
}

export type CharacterRow = {
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

export async function getCharactersForAccount(
  accountId: number,
): Promise<CharacterRow[]> {
  const [rows] = await pool.query(
    "SELECT id, charactername, account, money, bankmoney, level, xp, hoursplayed, health, armor, skin, lastlogin FROM characters WHERE account = ? ORDER BY id DESC",
    [accountId],
  );
  const arr = rows as any[];
  return (arr || []) as CharacterRow[];
}

// Admin helpers
export type AccountListItem = Pick<
  AccountRow,
  | "id"
  | "username"
  | "email"
  | "activated"
  | "avatar"
  | "admin"
  | "supporter"
  | "vct"
  | "mapper"
  | "scripter"
  | "fmt"
>;

export async function getAccountById(id: number): Promise<AccountRow | null> {
  const [rows] = await pool.query(
    "SELECT id, username, password, email, activated, avatar, admin, supporter, vct, mapper, scripter, fmt FROM accounts WHERE id = ? LIMIT 1",
    [id],
  );
  const arr = rows as any[];
  if (!arr || arr.length === 0) return null;
  return arr[0] as AccountRow;
}

export async function countAccounts(search?: string): Promise<number> {
  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    const [rows] = await pool.query(
      "SELECT COUNT(*) as c FROM accounts WHERE username LIKE ? OR email LIKE ?",
      [like, like],
    );
    const arr = rows as any[];
    return Number(arr?.[0]?.c || 0);
  }
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM accounts");
  const arr = rows as any[];
  return Number(arr?.[0]?.c || 0);
}

export async function getAccounts(
  page: number,
  pageSize: number,
  search?: string,
): Promise<AccountListItem[]> {
  const offset = Math.max(0, (page - 1) * pageSize);
  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    const [rows] = await pool.query(
      "SELECT id, username, email, activated, avatar, admin, supporter, vct, mapper, scripter, fmt FROM accounts WHERE username LIKE ? OR email LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
      [like, like, pageSize, offset],
    );
    return rows as any[] as AccountListItem[];
  }
  const [rows] = await pool.query(
    "SELECT id, username, email, activated, avatar, admin, supporter, vct, mapper, scripter, fmt FROM accounts ORDER BY id DESC LIMIT ? OFFSET ?",
    [pageSize, offset],
  );
  return rows as any[] as AccountListItem[];
}

export type BanRow = {
  id: number;
  mta_serial: string | null;
  ip: string | null;
  account: number | null;
  admin: number | null;
  reason: string;
  date: Date;
  until: Date | null;
  threadid: number | null;
};

export async function getBans(
  page: number,
  pageSize: number,
): Promise<BanRow[]> {
  const offset = Math.max(0, (page - 1) * pageSize);
  const [rows] = await pool.query(
    "SELECT id, mta_serial, ip, account, admin, reason, date, until, threadid FROM bans ORDER BY id DESC LIMIT ? OFFSET ?",
    [pageSize, offset],
  );
  return rows as any[] as BanRow[];
}

export async function getBansForAccount(accountId: number): Promise<BanRow[]> {
  const [rows] = await pool.query(
    "SELECT id, mta_serial, ip, account, admin, reason, date, until, threadid FROM bans WHERE account = ? ORDER BY id DESC",
    [accountId],
  );
  return rows as any[] as BanRow[];
}

export async function countActiveBans(): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as c FROM bans WHERE until IS NULL OR until > NOW()",
  );
  const arr = rows as any[];
  return Number(arr?.[0]?.c || 0);
}

export async function countBans(): Promise<number> {
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM bans");
  const arr = rows as any[];
  return Number(arr?.[0]?.c || 0);
}

export async function createBan(params: {
  accountId?: number;
  adminId?: number;
  reason: string;
  days?: number;
  permanent?: boolean;
  ip?: string | null;
  mta_serial?: string | null;
}): Promise<number> {
  const {
    accountId,
    adminId,
    reason,
    days,
    permanent,
    ip = null,
    mta_serial = null,
  } = params;
  const until = permanent
    ? null
    : days && days > 0
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : null;
  const [res] = await pool.query(
    "INSERT INTO bans (mta_serial, ip, account, admin, reason, date, until, threadid) VALUES (?, ?, ?, ?, ?, NOW(), ?, NULL)",
    [mta_serial, ip, accountId ?? null, adminId ?? null, reason, until],
  );
  // @ts-ignore mysql2 returns insertId
  return Number(res.insertId || 0);
}

export async function unbanAccount(accountId: number): Promise<number> {
  // Remove any active bans for the account
  const [res] = await pool.query(
    "DELETE FROM bans WHERE account = ? AND (until IS NULL OR until > NOW())",
    [accountId],
  );
  // @ts-ignore
  return Number(res.affectedRows || 0);
}

export async function updateAccountProfile(
  accountId: number,
  data: { email?: string | null; avatar?: string | null },
): Promise<void> {
  const { email, avatar } = data;
  await pool.query("UPDATE accounts SET email = ?, avatar = ? WHERE id = ?", [
    email ?? null,
    avatar ?? null,
    accountId,
  ]);
}

export async function updateAccountPassword(
  accountId: number,
  passwordHash: string,
): Promise<void> {
  await pool.query("UPDATE accounts SET password = ? WHERE id = ?", [
    passwordHash,
    accountId,
  ]);
}

// Server Statistics Functions
export type ServerStats = {
  totalAccounts: number;
  totalCharacters: number;
  totalFactions: number;
  activeBans: number;
  onlinePlayersCount: number;
  recentRegistrations: number;
};

export async function getServerStats(): Promise<ServerStats> {
  const [accountsResult] = await pool.query(
    "SELECT COUNT(*) as count FROM accounts",
  );
  const [charactersResult] = await pool.query(
    "SELECT COUNT(*) as count FROM characters",
  );
  const [factionsResult] = await pool.query(
    "SELECT COUNT(*) as count FROM factions",
  );
  const [bansResult] = await pool.query(
    "SELECT COUNT(*) as count FROM bans WHERE until IS NULL OR until > NOW()",
  );
  const [recentResult] = await pool.query(
    "SELECT COUNT(*) as count FROM accounts WHERE DATE(registerdate) >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
  );

  return {
    totalAccounts: Number((accountsResult as any[])[0]?.count || 0),
    totalCharacters: Number((charactersResult as any[])[0]?.count || 0),
    totalFactions: Number((factionsResult as any[])[0]?.count || 0),
    activeBans: Number((bansResult as any[])[0]?.count || 0),
    onlinePlayersCount: 0, // Will be fetched from API
    recentRegistrations: Number((recentResult as any[])[0]?.count || 0),
  };
}

export type FactionRow = {
  id: number;
  name: string;
  type: number;
  leader: number | null;
  members: number;
  money: number;
  created: Date;
};

export async function getFactions(): Promise<FactionRow[]> {
  const [rows] = await pool.query(`
    SELECT f.id, f.name, f.type, 0 as leader,
           COUNT(cf.character_id) as members,
           COALESCE(f.bankbalance, 0) as money, NOW() as created
    FROM factions f
    LEFT JOIN characters_faction cf ON f.id = cf.faction_id
    GROUP BY f.id, f.name, f.type, f.bankbalance
    ORDER BY members DESC, f.name ASC
  `);
  return rows as any[] as FactionRow[];
}

export type PlayerStats = {
  id: number;
  charactername: string;
  account: number;
  username: string;
  money: number;
  bankmoney: number;
  hours: number;
  kills: number;
  deaths: number;
  lastlogin: Date | null;
};

export async function getTopPlayers(
  limit: number = 10,
): Promise<PlayerStats[]> {
  const [rows] = await pool.query(
    `
    SELECT c.id, c.charactername, c.account, a.username,
           c.money, c.bankmoney, COALESCE(c.hoursplayed, 0) as hours,
           0 as kills, c.deaths, NULL as lastlogin
    FROM characters c
    JOIN accounts a ON c.account = a.id
    WHERE c.charactername IS NOT NULL AND c.charactername != ''
    ORDER BY c.hoursplayed DESC, c.money DESC
    LIMIT ?
  `,
    [limit],
  );
  return rows as any[] as PlayerStats[];
}

export type VehicleStats = {
  id: number;
  model: number;
  owner: number;
  charactername: string | null;
  faction: number | null;
  factionname: string | null;
  x: number;
  y: number;
  z: number;
  created: Date;
};

export async function getVehicleStats(): Promise<{
  total: number;
  byFaction: number;
  personal: number;
}> {
  const [totalResult] = await pool.query(
    "SELECT COUNT(*) as count FROM vehicles",
  );
  const [factionResult] = await pool.query(
    "SELECT COUNT(*) as count FROM vehicles WHERE faction > 0",
  );
  const [personalResult] = await pool.query(
    "SELECT COUNT(*) as count FROM vehicles WHERE owner > 0 AND faction = 0",
  );

  return {
    total: Number((totalResult as any[])[0]?.count || 0),
    byFaction: Number((factionResult as any[])[0]?.count || 0),
    personal: Number((personalResult as any[])[0]?.count || 0),
  };
}

// Server Status API
export type ServerStatus = {
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

export async function getServerStatus(): Promise<ServerStatus | null> {
  try {
    const response = await fetch(
      "https://query.fakaheda.eu/185.180.2.20:27944.feed",
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data as ServerStatus;
  } catch (error) {
    console.error("Failed to fetch server status:", error);
    return null;
  }
}
