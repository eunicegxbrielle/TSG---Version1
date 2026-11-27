import QRCode from 'qrcode';
import {
  Court,
  CourtMatch,
  Player,
  PlayerStats,
  PreReadyMatch,
  QueueEntry,
  QueueSession,
  SkillCategory,
  SponsorGiftPayload,
  TECHNICAL_SKILLS,
  CHARACTER_SPORTSMANSHIP,
  GamemakerAuth,
  ReapingQueueStatus,
  CATEGORY_TO_DISTRICT,
} from '../types';
import { playMockingjayWhistle } from './audio';
import { createTributeSvgAvatar } from './avatars';

const INITIAL_SESSIONS: QueueSession[] = [
  {
    id: 'SHUTTLE-74-S1',
    code: 'SHUTTLE-74-OPEN',
    name: 'The Shuttle Games · Opening Reaping',
    date: '2026-11-02T09:00:00.000Z',
    month: '2026-11',
    qrCodeUrl: '',
    courtCount: 4,
    isActive: false,
    reapingStatus: 'open',
    totalMatchesPlayed: 12,
    tributesPresent: ['p-katniss', 'p-peeta', 'p-finnick', 'p-johanna', 'p-haymitch', 'p-cato'],
  },
  {
    id: 'SHUTTLE-74-S2',
    code: 'SHUTTLE-DISTRICT4-CUP',
    name: 'The Shuttle Games · District 4 Open',
    date: '2026-11-05T14:00:00.000Z',
    month: '2026-11',
    qrCodeUrl: '',
    courtCount: 4,
    isActive: false,
    reapingStatus: 'open',
    totalMatchesPlayed: 14,
    tributesPresent: ['p-katniss', 'p-peeta', 'p-finnick', 'p-johanna', 'p-rue', 'p-haymitch'],
  },
  {
    id: 'SHUTTLE-75-QUARTER',
    code: 'SHUTTLE-QUARTER-QUELL',
    name: 'The Shuttle Games · The 75th Reaping',
    date: '2026-11-09T08:00:00.000Z',
    month: '2026-11',
    qrCodeUrl: '',
    courtCount: 4,
    isActive: true,
    reapingStatus: 'open',
    totalMatchesPlayed: 5,
    tributesPresent: ['p-katniss', 'p-peeta', 'p-finnick', 'p-johanna', 'p-haymitch', 'p-rue', 'p-cato', 'p-glimmer'],
  },
];

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-katniss',
    name: 'Katniss Everdeen',
    district: 'District 5',
    category: 'Advance',
    avatarUrl: createTributeSvgAvatar('Katniss Everdeen', 0),
    bio: 'Pinpoint cross-court smashes and relentless back-court recovery. Never misses a crucial line call.',
    stats: {
      totalGames: 16,
      totalWins: 13,
      totalLoses: 3,
      winRate: 81,
    },
    sponsorGifts: {
      Smash: 9,
      Recovery: 11,
      'Low Serve': 7,
      Overhead: 8,
      'Net Kill': 6,
      Footwork: 5,
      Strategy: 8,
      'Fair Play': 9,
      Patience: 7,
      Teamwork: 6,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-peeta',
    name: 'Peeta Mellark',
    district: 'District 4',
    category: 'Intermediate',
    avatarUrl: createTributeSvgAvatar('Peeta Mellark', 1),
    bio: 'Steady doubles anchor known for deceptive net drops, supportive communication, and clutch saves.',
    stats: {
      totalGames: 14,
      totalWins: 10,
      totalLoses: 4,
      winRate: 71,
    },
    sponsorGifts: {
      Drop: 6,
      'Net Shot': 8,
      Drive: 5,
      Teamwork: 12,
      Positivity: 10,
      'Fair Play': 8,
      Cheerleader: 5,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-finnick',
    name: 'Finnick Odair',
    district: 'District 5',
    category: 'Advance',
    avatarUrl: createTributeSvgAvatar('Finnick Odair', 2),
    bio: 'Lightning-fast net kills and razor-sharp flick serves. Thrives in fast flat-drive exchanges.',
    stats: {
      totalGames: 15,
      totalWins: 12,
      totalLoses: 3,
      winRate: 80,
    },
    sponsorGifts: {
      'Net Kill': 10,
      Drive: 8,
      Slice: 6,
      'Flick Serve': 6,
      Style: 14,
      Entertainer: 9,
      Strategy: 7,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-johanna',
    name: 'Johanna Mason',
    district: 'District 4',
    category: 'Intermediate',
    avatarUrl: createTributeSvgAvatar('Johanna Mason', 3),
    bio: 'Fearless left-wing attacker with crisp backhand clears and fearless front-court pressure.',
    stats: {
      totalGames: 13,
      totalWins: 9,
      totalLoses: 4,
      winRate: 69,
    },
    sponsorGifts: {
      'Backhand Clear': 8,
      Clear: 7,
      Recovery: 5,
      Overhead: 6,
      Strategy: 6,
      Organizer: 5,
      'Fair Play': 6,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-haymitch',
    name: 'Haymitch Abernathy',
    district: 'District 5',
    category: 'Advance',
    avatarUrl: createTributeSvgAvatar('Haymitch Abernathy', 0),
    bio: 'Veteran tactician who controls tempo with high defensive lifts and calm late-game placement.',
    stats: {
      totalGames: 12,
      totalWins: 8,
      totalLoses: 4,
      winRate: 67,
    },
    sponsorGifts: {
      Recovery: 9,
      Smash: 7,
      Lift: 5,
      Strategy: 11,
      Patience: 8,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-rue',
    name: 'Rue',
    district: 'District 3',
    category: 'Lower Intermediate',
    avatarUrl: createTributeSvgAvatar('Rue', 4),
    bio: 'Agile court mover covering every corner effortlessly with soft drops and upbeat spirit.',
    stats: {
      totalGames: 8,
      totalWins: 5,
      totalLoses: 3,
      winRate: 63,
    },
    sponsorGifts: {
      Footwork: 8,
      Drop: 6,
      Positivity: 11,
      Cheerleader: 9,
      'Fair Play': 6,
    },
    sessionsJoined: ['SHUTTLE-74-S2', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-cato',
    name: 'Cato',
    district: 'District 5',
    category: 'Advance',
    avatarUrl: createTributeSvgAvatar('Cato', 3),
    bio: 'Powerhouse smasher from the rear court who turns every loose lift into an instant point.',
    stats: {
      totalGames: 7,
      totalWins: 5,
      totalLoses: 2,
      winRate: 71,
    },
    sponsorGifts: {
      Smash: 9,
      'Net Kill': 7,
      Overhead: 7,
      Drive: 6,
      Style: 4,
      Strategy: 3,
    },
    sessionsJoined: ['SHUTTLE-74-S1', 'SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-glimmer',
    name: 'Glimmer Belcourt',
    district: 'District 2',
    category: 'Beginner',
    avatarUrl: createTributeSvgAvatar('Glimmer Belcourt', 1),
    bio: 'Focused on tight low serves and stylish rallying while climbing through District 2.',
    stats: {
      totalGames: 5,
      totalWins: 2,
      totalLoses: 3,
      winRate: 40,
    },
    sponsorGifts: {
      'Low Serve': 4,
      Drop: 3,
      Style: 7,
      Positivity: 4,
    },
    sessionsJoined: ['SHUTTLE-75-QUARTER'],
  },
  {
    id: 'p-cinna',
    name: 'Cinna',
    district: 'District 1',
    category: 'Newbie',
    avatarUrl: createTributeSvgAvatar('Cinna', 5),
    bio: 'Fresh into The Reaping with clean clears, sharp court style, and endless enthusiasm.',
    stats: {
      totalGames: 4,
      totalWins: 2,
      totalLoses: 2,
      winRate: 50,
    },
    sponsorGifts: {
      'Low Serve': 3,
      Clear: 2,
      Style: 8,
      Positivity: 6,
      Organizer: 5,
    },
    sessionsJoined: ['SHUTTLE-75-QUARTER'],
  },
];

const INITIAL_COURTS: Court[] = [
  {
    id: 1,
    name: 'Arena 1',
    arenaSubtitle: 'Court 1',
    status: 'in_game',
  },
  {
    id: 2,
    name: 'Arena 2',
    arenaSubtitle: 'Court 2',
    status: 'in_game',
  },
  {
    id: 3,
    name: 'Arena 3',
    arenaSubtitle: 'Court 3',
    status: 'available',
  },
  {
    id: 4,
    name: 'Arena 4',
    arenaSubtitle: 'Court 4',
    status: 'available',
  },
];

const STORAGE_KEYS = {
  PLAYERS: 'shuttle_games_tributes',
  CURRENT_PLAYER_ID: 'shuttle_games_current_player_id',
  QUEUE: 'shuttle_games_queue',
  COURTS: 'shuttle_games_courts',
  SESSIONS: 'shuttle_games_sessions',
  ACTIVE_SESSION_ID: 'shuttle_games_active_session_id',
  MATCH_HISTORY: 'shuttle_games_match_history',
  GAMEMAKER_AUTH: 'shuttle_games_gamemaker_auth',
  PRE_READY_MATCHES: 'shuttle_games_pre_ready_matches',
};

const LEGACY_SKILL_MAP: Record<string, string> = {
  Dropshot: 'Drop',
  Serve: 'Low Serve',
  Defense: 'Recovery',
  Interception: 'Drive',
};

function migrateGiftRecord(record?: Record<string, number>): { migrated: Record<string, number>; changed: boolean } {
  if (!record) return { migrated: {}, changed: false };
  let changed = false;
  const next: Record<string, number> = {};
  Object.entries(record).forEach(([key, count]) => {
    const mappedKey = LEGACY_SKILL_MAP[key] || key;
    if (mappedKey !== key) changed = true;
    next[mappedKey] = (next[mappedKey] || 0) + (Number(count) || 0);
  });
  return { migrated: next, changed };
}

// Seed initial state in storage
export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PLAYERS)) {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER_ID)) {
    // Default to Katniss
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER_ID, 'p-katniss');
  }

  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    // Generate QR codes for initial sessions
    const sessionsWithQr = await Promise.all(
      INITIAL_SESSIONS.map(async (sess) => {
        try {
          const qrCodeUrl = await QRCode.toDataURL(
            `${window.location.origin}/?session=${sess.id}`,
            {
              width: 320,
              margin: 2,
              color: {
                dark: '#0f172a',
                light: '#fef3c7',
              },
            }
          );
          return { ...sess, qrCodeUrl };
        } catch {
          return sess;
        }
      })
    );
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsWithQr));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, 'SHUTTLE-75-QUARTER');
  }

  // Ensure existing stored players have District 1-5, updated technical skills, avatarUrl, and bio
  const storedPlayersRaw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (storedPlayersRaw) {
    try {
      const stored: Player[] = JSON.parse(storedPlayersRaw);
      let changed = false;
      stored.forEach((p: Player) => {
        const correctDistrict = CATEGORY_TO_DISTRICT[p.category];
        if (correctDistrict && p.district !== correctDistrict) {
          p.district = correctDistrict;
          changed = true;
        }
        const seedMatch = INITIAL_PLAYERS.find((ip) => ip.id === p.id);
        if (!p.avatarUrl) {
          p.avatarUrl = seedMatch?.avatarUrl || createTributeSvgAvatar(p.name);
          changed = true;
        }
        if (p.bio === undefined) {
          p.bio = seedMatch?.bio || `${p.category} tribute competing from ${p.district}.`;
          changed = true;
        }

        const sg = migrateGiftRecord(p.sponsorGifts);
        if (sg.changed) {
          p.sponsorGifts = sg.migrated;
          changed = true;
        }
        if (p.monthlySponsorGifts) {
          Object.keys(p.monthlySponsorGifts).forEach((mKey) => {
            const mg = migrateGiftRecord(p.monthlySponsorGifts![mKey]);
            if (mg.changed) {
              p.monthlySponsorGifts![mKey] = mg.migrated;
              changed = true;
            }
          });
        }
        if (p.sessionSponsorGifts) {
          Object.keys(p.sessionSponsorGifts).forEach((sKey) => {
            const ss = migrateGiftRecord(p.sessionSponsorGifts![sKey]);
            if (ss.changed) {
              p.sessionSponsorGifts![sKey] = ss.migrated;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(stored));
      }
    } catch {}
  }

  if (!localStorage.getItem(STORAGE_KEYS.COURTS)) {
    const players = getTributes();
    const katniss = players.find((p) => p.id === 'p-katniss') || players[0];
    const peeta = players.find((p) => p.id === 'p-peeta') || players[1];
    const finnick = players.find((p) => p.id === 'p-finnick') || players[2];
    const johanna = players.find((p) => p.id === 'p-johanna') || players[3];

    const match1: CourtMatch = {
      id: 'match-live-1',
      sessionId: 'SHUTTLE-75-QUARTER',
      courtId: 1,
      courtName: 'Arena 1',
      startTime: Date.now() - 1000 * 60 * 11, // 11 mins ago
      team1: {
        player1: katniss,
        player2: peeta,
      },
      team2: {
        player1: finnick,
        player2: johanna,
      },
      kudosSubmittedBy: [],
    };

    const haymitch = players.find((p) => p.id === 'p-haymitch') || players[4];
    const cato = players.find((p) => p.id === 'p-cato') || players[6];
    const rue = players.find((p) => p.id === 'p-rue') || players[5];
    const glimmer = players.find((p) => p.id === 'p-glimmer') || players[7];

    const match2: CourtMatch = {
      id: 'match-live-2',
      sessionId: 'SHUTTLE-75-QUARTER',
      courtId: 2,
      courtName: 'Arena 2',
      startTime: Date.now() - 1000 * 60 * 6, // 6 mins ago
      team1: {
        player1: haymitch,
        player2: rue,
      },
      team2: {
        player1: cato,
        player2: glimmer,
      },
      kudosSubmittedBy: [],
    };

    const initialCourts = [...INITIAL_COURTS];
    initialCourts[0].currentMatch = match1;
    initialCourts[1].currentMatch = match2;

    localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(initialCourts));
  }

  if (!localStorage.getItem(STORAGE_KEYS.QUEUE)) {
    const players = getTributes();
    const cinna = players.find((p) => p.id === 'p-cinna');
    // Seed Cinna in queue waiting
    const initialQueue: QueueEntry[] = [
      {
        id: 'q-entry-1',
        playerId: 'p-cinna',
        playerName: 'Cinna',
        playerCategory: 'Newbie',
        playerDistrict: 'District 1',
        avatarUrl: cinna?.avatarUrl || createTributeSvgAvatar('Cinna', 5),
        joinedAt: Date.now() - 1000 * 60 * 4,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(initialQueue));
  }
}

// Player / Tribute APIs
export function getTributes(): Player[] {
  if (typeof window === 'undefined') return INITIAL_PLAYERS;
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  return stored ? JSON.parse(stored) : INITIAL_PLAYERS;
}

export function saveTributes(players: Player[]): void {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}

export function getCurrentPlayer(): Player | null {
  if (typeof window === 'undefined') return null;
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER_ID);
  const players = getTributes();
  return players.find((p) => p.id === currentId) || players[0] || null;
}

export function setCurrentPlayerId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER_ID, id);
}

export function createOrUpdatePlayer(
  name: string,
  category: SkillCategory,
  bio?: string,
  avatarUrl?: string
): Player {
  const players = getTributes();
  const district = CATEGORY_TO_DISTRICT[category] || 'District 1';
  const existing = players.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const activeSessionId = getActiveSessionId();

  if (existing) {
    existing.category = category;
    existing.district = district;
    if (bio !== undefined) existing.bio = bio;
    if (avatarUrl) existing.avatarUrl = avatarUrl;
    if (activeSessionId && !existing.sessionsJoined.includes(activeSessionId)) {
      existing.sessionsJoined.push(activeSessionId);
    }
    saveTributes(players);
    setCurrentPlayerId(existing.id);
    return existing;
  }

  const newPlayer: Player = {
    id: `p-${Date.now()}`,
    name,
    category,
    district,
    avatarUrl: avatarUrl || createTributeSvgAvatar(name),
    bio: bio?.trim() || `${category} tribute representing ${district} in The Shuttle Games.`,
    stats: {
      totalGames: 0,
      totalWins: 0,
      totalLoses: 0,
      winRate: 0,
    },
    sponsorGifts: {},
    sessionsJoined: activeSessionId ? [activeSessionId] : [],
  };

  players.push(newPlayer);
  saveTributes(players);
  setCurrentPlayerId(newPlayer.id);

  // Add tribute to active session present list
  if (activeSessionId) {
    const sessions = getSessions();
    const curr = sessions.find((s) => s.id === activeSessionId);
    if (curr && !curr.tributesPresent.includes(newPlayer.id)) {
      curr.tributesPresent.push(newPlayer.id);
      saveSessions(sessions);
    }
  }

  return newPlayer;
}

export function updatePlayerProfile(
  playerId: string,
  updates: {
    name?: string;
    category?: SkillCategory;
    bio?: string;
    avatarUrl?: string;
  }
): Player | null {
  const players = getTributes();
  const idx = players.findIndex((p) => p.id === playerId);
  if (idx < 0) return null;

  const target = { ...players[idx] };
  if (updates.name && updates.name.trim()) {
    target.name = updates.name.trim();
  }
  if (updates.category) {
    target.category = updates.category;
    target.district = CATEGORY_TO_DISTRICT[updates.category] || target.district;
  }
  if (updates.bio !== undefined) {
    target.bio = updates.bio.trim();
  }
  if (updates.avatarUrl) {
    target.avatarUrl = updates.avatarUrl;
  }

  players[idx] = target;
  saveTributes(players);

  // Sync queue entries
  const queue = getQueue();
  let queueChanged = false;
  queue.forEach((q) => {
    if (q.playerId === playerId) {
      q.playerName = target.name;
      q.playerCategory = target.category;
      q.playerDistrict = target.district;
      q.avatarUrl = target.avatarUrl;
      queueChanged = true;
    }
  });
  if (queueChanged) saveQueue(queue);

  // Sync active court matches
  const courts = getCourts();
  let courtsChanged = false;
  const syncMatchPlayer = (p?: Player): Player | undefined => {
    if (!p) return p;
    if (p.id === playerId) {
      courtsChanged = true;
      return { ...target };
    }
    return p;
  };
  courts.forEach((c) => {
    if (c.currentMatch) {
      c.currentMatch.team1.player1 = syncMatchPlayer(c.currentMatch.team1.player1) || c.currentMatch.team1.player1;
      c.currentMatch.team1.player2 = syncMatchPlayer(c.currentMatch.team1.player2);
      c.currentMatch.team2.player1 = syncMatchPlayer(c.currentMatch.team2.player1) || c.currentMatch.team2.player1;
      c.currentMatch.team2.player2 = syncMatchPlayer(c.currentMatch.team2.player2);
    }
  });
  if (courtsChanged) saveCourts(courts);

  return target;
}

// Queue APIs
export function getQueue(): QueueEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.QUEUE);
  return stored ? JSON.parse(stored) : [];
}

export function saveQueue(queue: QueueEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
}

export function addToQueue(player: Player): QueueEntry[] {
  const queue = getQueue();
  // check if already in queue
  const idx = queue.findIndex((q) => q.playerId === player.id);
  if (idx >= 0) return queue;

  const entry: QueueEntry = {
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    playerId: player.id,
    playerName: player.name,
    playerCategory: player.category,
    playerDistrict: CATEGORY_TO_DISTRICT[player.category] || player.district,
    avatarUrl: player.avatarUrl,
    joinedAt: Date.now(),
  };

  queue.push(entry);
  saveQueue(queue);

  // Mark session joined
  const activeSessionId = getActiveSessionId();
  if (activeSessionId && !player.sessionsJoined.includes(activeSessionId)) {
    player.sessionsJoined.push(activeSessionId);
    const players = getTributes();
    const pIdx = players.findIndex((p) => p.id === player.id);
    if (pIdx >= 0) {
      players[pIdx] = player;
      saveTributes(players);
    }
  }

  return queue;
}

export function removeFromQueue(playerId: string): QueueEntry[] {
  const queue = getQueue().filter((q) => q.playerId !== playerId);
  saveQueue(queue);
  return queue;
}

// Courts APIs
export function getCourts(): Court[] {
  if (typeof window === 'undefined') return INITIAL_COURTS;
  const stored = localStorage.getItem(STORAGE_KEYS.COURTS);
  if (!stored) return INITIAL_COURTS;
  try {
    const list: Court[] = JSON.parse(stored);
    let changed = false;
    list.forEach((c) => {
      const cleanName = `Arena ${c.id}`;
      if (c.name !== cleanName) {
        c.name = cleanName;
        changed = true;
      }
      if (c.arenaSubtitle && /cornucopia|training|forest|quarter/i.test(c.arenaSubtitle)) {
        c.arenaSubtitle = `Court ${c.id}`;
        changed = true;
      }
      if (c.currentMatch?.courtName && c.currentMatch.courtName !== cleanName) {
        c.currentMatch.courtName = cleanName;
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(list));
    }
    return list;
  } catch {
    return INITIAL_COURTS;
  }
}

export function saveCourts(courts: Court[]): void {
  localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
}

// Match History
export function getMatchHistory(): CourtMatch[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
  if (!stored) return [];
  try {
    const list: CourtMatch[] = JSON.parse(stored);
    let changed = false;
    list.forEach((m) => {
      if (m.courtId) {
        const cleanName = `Arena ${m.courtId}`;
        if (m.courtName !== cleanName) {
          m.courtName = cleanName;
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

export function saveMatchHistory(matches: CourtMatch[]): void {
  localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(matches));
}

// Sessions & QR Code
export function getSessions(): QueueSession[] {
  if (typeof window === 'undefined') return INITIAL_SESSIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
}

export function saveSessions(sessions: QueueSession[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getActiveSessionId(): string {
  if (typeof window === 'undefined') return 'SHUTTLE-75-QUARTER';
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) || 'SHUTTLE-75-QUARTER';
}

export function setActiveSessionId(sessionId: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
}

export async function createNewSession(name: string, courtCount: number = 4): Promise<QueueSession> {
  const id = `SHUTTLE-${Date.now().toString(36).toUpperCase()}`;
  const code = `SHUTTLE-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sessionUrl = `${window.location.origin}/?session=${id}`;

  const qrCodeUrl = await QRCode.toDataURL(sessionUrl, {
    width: 360,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#fef3c7',
    },
  });

  const newSession: QueueSession = {
    id,
    code,
    name,
    date: now.toISOString(),
    month,
    qrCodeUrl,
    courtCount,
    isActive: true,
    totalMatchesPlayed: 0,
    tributesPresent: [],
  };

  const sessions = getSessions();
  // set others to inactive
  sessions.forEach((s) => (s.isActive = false));
  sessions.unshift(newSession);
  saveSessions(sessions);
  setActiveSessionId(id);

  return newSession;
}

/**
 * Assign players from queue to a specific court
 */
export function assignPlayersToCourt(
  courtId: number,
  playerIds: string[]
): { success: boolean; error?: string } {
  const players = getTributes();
  const selectedPlayers = playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  if (selectedPlayers.length < 4) {
    return { success: false, error: 'The Reaping is strictly Doubles. Exactly 4 tributes required for an Arena battle.' };
  }

  const courts = getCourts();
  const courtIndex = courts.findIndex((c) => c.id === courtId);
  if (courtIndex < 0) return { success: false, error: 'Arena not found.' };

  const currentSessionId = getActiveSessionId();
  const courtName = courts[courtIndex].name;

  const team1: CourtMatch['team1'] = { player1: selectedPlayers[0], player2: selectedPlayers[1] };
  const team2: CourtMatch['team2'] = { player1: selectedPlayers[2], player2: selectedPlayers[3] };

  const newMatch: CourtMatch = {
    id: `match-${Date.now()}`,
    sessionId: currentSessionId,
    courtId,
    courtName,
    team1,
    team2,
    startTime: Date.now(),
    kudosSubmittedBy: [],
  };

  courts[courtIndex].status = 'in_game';
  courts[courtIndex].currentMatch = newMatch;
  saveCourts(courts);

  // Remove players from queue
  const queue = getQueue().filter((q) => !playerIds.includes(q.playerId));
  saveQueue(queue);

  return { success: true };
}

/**
 * End a match, assign scores, declare victors, and enter 'scoring' / 'pending_kudos' state
 */
export function recordMatchScore(
  courtId: number,
  scoreTeam1: number,
  scoreTeam2: number
): { match: CourtMatch; winningTeam: 1 | 2 } {
  const courts = getCourts();
  const courtIndex = courts.findIndex((c) => c.id === courtId);
  if (courtIndex < 0 || !courts[courtIndex].currentMatch) {
    throw new Error('No active match on this court');
  }

  const match = courts[courtIndex].currentMatch!;
  const winningTeam: 1 | 2 = scoreTeam1 > scoreTeam2 ? 1 : 2;

  match.team1.score = scoreTeam1;
  match.team2.score = scoreTeam2;
  match.winnerTeam = winningTeam;
  match.endTime = Date.now();

  // Determine match session & month
  const sessions = getSessions();
  const sess = sessions.find((s) => s.id === match.sessionId);
  const nowDate = new Date();
  const fallbackMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
  const matchMonth = sess?.month || fallbackMonth;

  // Update players stats (overall, session, and monthly)
  const allTributes = getTributes();
  const t1Players = [match.team1.player1, match.team1.player2].filter(Boolean) as Player[];
  const t2Players = [match.team2.player1, match.team2.player2].filter(Boolean) as Player[];

  const applyWinLoss = (statsObj: PlayerStats, isWinner: boolean): PlayerStats => {
    const totalGames = statsObj.totalGames + 1;
    const totalWins = statsObj.totalWins + (isWinner ? 1 : 0);
    const totalLoses = statsObj.totalLoses + (isWinner ? 0 : 1);
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    return { totalGames, totalWins, totalLoses, winRate };
  };

  const updatePlayerWinLoss = (p: Player, isWinner: boolean) => {
    const tribute = allTributes.find((t) => t.id === p.id);
    if (!tribute) return;

    // Seed monthlyStats for active baseline month if not yet tracked
    if (!tribute.monthlyStats) tribute.monthlyStats = {};
    if (!tribute.monthlyStats[matchMonth]) {
      const hasPriorBaselineInMonth =
        matchMonth === '2026-11' ||
        tribute.sessionsJoined.some((sid) => sessions.find((s) => s.id === sid)?.month === matchMonth);
      tribute.monthlyStats[matchMonth] = hasPriorBaselineInMonth
        ? { ...tribute.stats }
        : { totalGames: 0, totalWins: 0, totalLoses: 0, winRate: 0 };
    }

    // Update overall stats
    tribute.stats = applyWinLoss(tribute.stats, isWinner);

    // Update monthly stats
    tribute.monthlyStats[matchMonth] = applyWinLoss(tribute.monthlyStats[matchMonth], isWinner);

    // Update current session (Current Reaping) stats
    if (!tribute.sessionStats) tribute.sessionStats = {};
    const prevSessStats = tribute.sessionStats[match.sessionId] || {
      totalGames: 0,
      totalWins: 0,
      totalLoses: 0,
      winRate: 0,
    };
    tribute.sessionStats[match.sessionId] = applyWinLoss(prevSessStats, isWinner);
  };

  t1Players.forEach((p) => updatePlayerWinLoss(p, winningTeam === 1));
  t2Players.forEach((p) => updatePlayerWinLoss(p, winningTeam === 2));
  saveTributes(allTributes);

  // Add match to history
  const history = getMatchHistory();
  history.unshift(match);
  saveMatchHistory(history);

  // Update session total matches count
  if (sess) {
    sess.totalMatchesPlayed += 1;
    saveSessions(sessions);
  }

  // Free the court for next game
  courts[courtIndex].status = 'available';
  courts[courtIndex].currentMatch = undefined;
  saveCourts(courts);

  return { match, winningTeam };
}

/**
 * Submit Sponsor's Gifts (kudos) for a completed match
 * Technical Skill is Required; Character & Sportsmanship is Optional.
 * Automatically re-joins the giver to The Reaping queue upon submission.
 */
export function submitSponsorGifts(payload: SponsorGiftPayload): void {
  const tributes = getTributes();
  const history = getMatchHistory();
  const match = history.find((m) => m.id === payload.matchId);
  const sessions = getSessions();
  const matchSess = match ? sessions.find((s) => s.id === match.sessionId) : undefined;
  const nowDate = new Date();
  const fallbackMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
  const matchMonth = matchSess?.month || fallbackMonth;
  const sessionId = match?.sessionId || getActiveSessionId();

  payload.recipients.forEach((rec) => {
    const recipient = tributes.find((t) => t.id === rec.playerId);
    if (!recipient) return;

    if (!recipient.sponsorGifts) {
      recipient.sponsorGifts = {};
    }
    if (!recipient.monthlySponsorGifts) {
      recipient.monthlySponsorGifts = {};
    }
    if (!recipient.monthlySponsorGifts[matchMonth]) {
      const hasPriorBaselineInMonth =
        matchMonth === '2026-11' ||
        recipient.sessionsJoined.some((sid) => sessions.find((s) => s.id === sid)?.month === matchMonth);
      recipient.monthlySponsorGifts[matchMonth] = hasPriorBaselineInMonth
        ? { ...recipient.sponsorGifts }
        : {};
    }
    if (!recipient.sessionSponsorGifts) {
      recipient.sessionSponsorGifts = {};
    }
    if (!recipient.sessionSponsorGifts[sessionId]) {
      recipient.sessionSponsorGifts[sessionId] = {};
    }

    // Add technical skill (Required)
    recipient.sponsorGifts[rec.technicalSkill] =
      (recipient.sponsorGifts[rec.technicalSkill] || 0) + 1;
    recipient.monthlySponsorGifts[matchMonth][rec.technicalSkill] =
      (recipient.monthlySponsorGifts[matchMonth][rec.technicalSkill] || 0) + 1;
    recipient.sessionSponsorGifts[sessionId][rec.technicalSkill] =
      (recipient.sessionSponsorGifts[sessionId][rec.technicalSkill] || 0) + 1;

    // Add character trait (Optional)
    if (rec.characterTrait) {
      recipient.sponsorGifts[rec.characterTrait] =
        (recipient.sponsorGifts[rec.characterTrait] || 0) + 1;
      recipient.monthlySponsorGifts[matchMonth][rec.characterTrait] =
        (recipient.monthlySponsorGifts[matchMonth][rec.characterTrait] || 0) + 1;
      recipient.sessionSponsorGifts[sessionId][rec.characterTrait] =
        (recipient.sessionSponsorGifts[sessionId][rec.characterTrait] || 0) + 1;
    }
  });

  saveTributes(tributes);

  // Mark match as kudos submitted by this giver
  if (match) {
    if (!match.kudosSubmittedBy.includes(payload.giverId)) {
      match.kudosSubmittedBy.push(payload.giverId);
      saveMatchHistory(history);
    }
  }

  // Automatically re-join the giver into The Reaping queue
  const giver = tributes.find((t) => t.id === payload.giverId);
  if (giver) {
    addToQueue(giver);
  }
}

/**
 * Helpers for Current Reaping vs Monthly Standing stats & Sponsor's Gifts
 */
export function getPlayerCurrentReapingStats(player: Player, sessionId: string): PlayerStats {
  if (player.sessionStats?.[sessionId]) {
    return player.sessionStats[sessionId];
  }
  const matches = getMatchHistory().filter(
    (m) =>
      m.sessionId === sessionId &&
      m.winnerTeam &&
      (m.team1.player1.id === player.id ||
        m.team1.player2?.id === player.id ||
        m.team2.player1.id === player.id ||
        m.team2.player2?.id === player.id)
  );
  let totalWins = 0;
  let totalLoses = 0;
  matches.forEach((m) => {
    const inT1 = m.team1.player1.id === player.id || m.team1.player2?.id === player.id;
    const isWin = (inT1 && m.winnerTeam === 1) || (!inT1 && m.winnerTeam === 2);
    if (isWin) totalWins += 1;
    else totalLoses += 1;
  });
  const totalGames = totalWins + totalLoses;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  return { totalGames, totalWins, totalLoses, winRate };
}

export function getPlayerCurrentReapingGifts(
  player: Player,
  sessionId: string
): Record<string, number> {
  return player.sessionSponsorGifts?.[sessionId] || {};
}

export function getPlayerMonthlyStats(player: Player, month: string): PlayerStats {
  if (player.monthlyStats?.[month]) {
    return player.monthlyStats[month];
  }
  const sessions = getSessions();
  const hasBaselineInMonth =
    month === '2026-11' ||
    player.sessionsJoined.some((sid) => sessions.find((s) => s.id === sid)?.month === month);
  return hasBaselineInMonth
    ? player.stats
    : { totalGames: 0, totalWins: 0, totalLoses: 0, winRate: 0 };
}

export function getPlayerMonthlyGifts(
  player: Player,
  month: string
): Record<string, number> {
  if (player.monthlySponsorGifts?.[month]) {
    return player.monthlySponsorGifts[month];
  }
  const sessions = getSessions();
  const hasBaselineInMonth =
    month === '2026-11' ||
    player.sessionsJoined.some((sid) => sessions.find((s) => s.id === sid)?.month === month);
  return hasBaselineInMonth ? player.sponsorGifts || {} : {};
}

/**
 * Find active match or pending kudos match for a player
 */
export function getPlayerMatchStatus(playerId: string): {
  activeMatch?: CourtMatch;
  pendingKudosMatch?: CourtMatch;
} {
  const courts = getCourts();
  // 1. Is player on an active court right now?
  for (const c of courts) {
    if (c.status === 'in_game' && c.currentMatch) {
      const m = c.currentMatch;
      const inT1 = m.team1.player1.id === playerId || m.team1.player2?.id === playerId;
      const inT2 = m.team2.player1.id === playerId || m.team2.player2?.id === playerId;
      if (inT1 || inT2) {
        return { activeMatch: m };
      }
    }
  }

  // 2. Did player finish a recent match without submitting kudos?
  const history = getMatchHistory();
  for (const m of history) {
    const inT1 = m.team1.player1.id === playerId || m.team1.player2?.id === playerId;
    const inT2 = m.team2.player1.id === playerId || m.team2.player2?.id === playerId;
    if ((inT1 || inT2) && !m.kudosSubmittedBy.includes(playerId)) {
      return { pendingKudosMatch: m };
    }
  }

  return {};
}

/**
 * Calculate dynamic estimated wait time in minutes
 */
export function calculateEstimatedWaitTime(
  queueIndex: number, // 0-based position in queue
  activeCourtsCount: number = 4,
  averageMatchMin: number = 15
): number {
  if (queueIndex < 0) return 0;
  if (queueIndex < 4) {
    // Next in queue / upcoming court assignment!
    return Math.max(2, Math.round(5 - queueIndex));
  }
  // 4 players enter per court rotation
  const batchesAhead = Math.floor(queueIndex / 4);
  const minutes = Math.max(3, Math.round((batchesAhead * averageMatchMin) / Math.max(1, activeCourtsCount / 2)));
  return minutes;
}

/**
 * Gamemaker / Organizer Access Control
 */
export function getGamemakerAuth(): GamemakerAuth {
  if (typeof window === 'undefined') return { isAuthorized: false, gamemakerName: '' };
  const raw = localStorage.getItem(STORAGE_KEYS.GAMEMAKER_AUTH);
  if (!raw) return { isAuthorized: false, gamemakerName: '' };
  try {
    return JSON.parse(raw);
  } catch {
    return { isAuthorized: false, gamemakerName: '' };
  }
}

export function setGamemakerAuth(auth: GamemakerAuth): void {
  localStorage.setItem(STORAGE_KEYS.GAMEMAKER_AUTH, JSON.stringify(auth));
}

export const GAMEMAKER_ORGANIZERS = ['Eunice', 'Hiro', 'Tiara'] as const;
export type GamemakerOrganizer = (typeof GAMEMAKER_ORGANIZERS)[number];

const ORGANIZER_PASSCODE_DIGESTS: Record<GamemakerOrganizer, string> = {
  Eunice: '30ff513c76b0fced',
  Hiro: '2744d85870fb586a',
  Tiara: '636c3782ac92100d',
};

function digestOrganizerPasscode(organizer: string, passcode: string): string {
  const input = `tsg-gm:${organizer}:${passcode}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i + 1) * 31;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function verifyGamemakerPasscode(organizer: GamemakerOrganizer, passcode: string): boolean {
  const trimmed = passcode.trim();
  if (!trimmed) return false;
  const expected = ORGANIZER_PASSCODE_DIGESTS[organizer];
  if (!expected) return false;
  return digestOrganizerPasscode(organizer, trimmed) === expected;
}

/**
 * Reaping Queue Status: 'open' | 'closed' | 'full'
 */
export function getActiveSessionReapingStatus(): ReapingQueueStatus {
  const sessions = getSessions();
  const activeId = getActiveSessionId();
  const curr = sessions.find((s) => s.id === activeId);
  return curr?.reapingStatus || 'open';
}

export function setActiveSessionReapingStatus(status: ReapingQueueStatus): void {
  const sessions = getSessions();
  const activeId = getActiveSessionId();
  const curr = sessions.find((s) => s.id === activeId);
  if (curr) {
    curr.reapingStatus = status;
    saveSessions(sessions);
  }
}

// -------------------------------------------------------------
// Pre-Ready Match / Staging (On Deck) System
// -------------------------------------------------------------
export function getPreReadyMatches(): PreReadyMatch[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PRE_READY_MATCHES);
  return stored ? JSON.parse(stored) : [];
}

export function savePreReadyMatches(matches: PreReadyMatch[]): void {
  localStorage.setItem(STORAGE_KEYS.PRE_READY_MATCHES, JSON.stringify(matches));
}

export function createPreReadyMatch(
  sessionId: string,
  team1P1: Player,
  team1P2: Player,
  team2P1: Player,
  team2P2: Player,
  targetCourtId?: number
): PreReadyMatch {
  const newMatch: PreReadyMatch = {
    id: `preready-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sessionId,
    team1: { player1: team1P1, player2: team1P2 },
    team2: { player1: team2P1, player2: team2P2 },
    stagedAt: Date.now(),
    targetCourtId,
  };

  const existing = getPreReadyMatches();
  existing.push(newMatch);
  savePreReadyMatches(existing);
  playMockingjayWhistle();
  return newMatch;
}

export function deletePreReadyMatch(id: string): void {
  const existing = getPreReadyMatches().filter((m) => m.id !== id);
  savePreReadyMatches(existing);
}

export function deployPreReadyMatchToCourt(
  preReadyMatchId: string,
  courtId: number
): { success: boolean; error?: string } {
  const preReadyMatches = getPreReadyMatches();
  const matchIdx = preReadyMatches.findIndex((m) => m.id === preReadyMatchId);
  if (matchIdx < 0) return { success: false, error: 'Pre-ready match not found.' };

  const staged = preReadyMatches[matchIdx];
  const playerIds = [
    staged.team1.player1.id,
    staged.team1.player2.id,
    staged.team2.player1.id,
    staged.team2.player2.id,
  ];

  const res = assignPlayersToCourt(courtId, playerIds);
  if (res.success) {
    preReadyMatches.splice(matchIdx, 1);
    savePreReadyMatches(preReadyMatches);
  }
  return res;
}

export function getPlayerPreReadyInfo(playerId: string): {
  isPreReady: boolean;
  match?: PreReadyMatch;
  teammate?: Player;
  opponents?: [Player, Player];
  targetCourtId?: number;
} {
  const preReadyMatches = getPreReadyMatches();
  for (const m of preReadyMatches) {
    const isT1P1 = m.team1.player1.id === playerId;
    const isT1P2 = m.team1.player2.id === playerId;
    const isT2P1 = m.team2.player1.id === playerId;
    const isT2P2 = m.team2.player2.id === playerId;

    if (isT1P1 || isT1P2) {
      return {
        isPreReady: true,
        match: m,
        teammate: isT1P1 ? m.team1.player2 : m.team1.player1,
        opponents: [m.team2.player1, m.team2.player2],
        targetCourtId: m.targetCourtId,
      };
    }
    if (isT2P1 || isT2P2) {
      return {
        isPreReady: true,
        match: m,
        teammate: isT2P1 ? m.team2.player2 : m.team2.player1,
        opponents: [m.team1.player1, m.team1.player2],
        targetCourtId: m.targetCourtId,
      };
    }
  }
  return { isPreReady: false };
}

