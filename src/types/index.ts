export type SkillCategory =
  | 'Newbie'
  | 'Beginner'
  | 'Lower Intermediate'
  | 'Intermediate'
  | 'Advance';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Newbie',
  'Beginner',
  'Lower Intermediate',
  'Intermediate',
  'Advance',
];

export const CATEGORY_TO_DISTRICT: Record<SkillCategory, string> = {
  Newbie: 'District 1',
  Beginner: 'District 2',
  'Lower Intermediate': 'District 3',
  Intermediate: 'District 4',
  Advance: 'District 5',
};

export const TECHNICAL_SKILLS = [
  'Clear',
  'Drive',
  'Drop',
  'Smash',
  'Lift',
  'Net Shot',
  'Net Kill',
  'Footwork',
  'Backhand Clear',
  'Overhead',
  'Recovery',
  'Slice',
  'Low Serve',
  'Flick Serve',
] as const;

export type TechnicalSkill = (typeof TECHNICAL_SKILLS)[number];

export const CHARACTER_SPORTSMANSHIP = [
  'Positivity',
  'Teamwork',
  'Fair Play',
  'Strategy',
  'Patience',
  'Entertainer',
  'Cheerleader',
  'Organizer',
  'Style',
] as const;

export type CharacterTrait = (typeof CHARACTER_SPORTSMANSHIP)[number];

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  totalLoses: number;
  winRate: number; // percentage 0-100
}

export interface Player {
  id: string;
  name: string;
  username?: string;
  district: string;
  category: SkillCategory;
  avatarUrl?: string;
  bio?: string;
  avatarSeed?: string;
  stats: PlayerStats;
  sponsorGifts: Record<string, number>; // key is skill or character trait name -> count
  sessionsJoined: string[]; // session IDs attended
  sessionStats?: Record<string, PlayerStats>; // sessionId -> stats for that session (Current Reaping)
  sessionSponsorGifts?: Record<string, Record<string, number>>; // sessionId -> gifts for that session
  monthlyStats?: Record<string, PlayerStats>; // month (YYYY-MM) -> stats for that month
  monthlySponsorGifts?: Record<string, Record<string, number>>; // month (YYYY-MM) -> gifts for that month
}

export type QueueStatus = 'waiting' | 'assigned' | 'in_game' | 'pending_kudos' | 'idle';

export interface QueueEntry {
  id: string;
  playerId: string;
  playerName: string;
  playerCategory: SkillCategory;
  playerDistrict: string;
  avatarUrl?: string;
  joinedAt: number;
  assignedCourtId?: number;
}

export interface CourtMatch {
  id: string;
  sessionId: string;
  courtId: number;
  courtName: string;
  team1: {
    player1: Player;
    player2?: Player;
    score?: number;
  };
  team2: {
    player1: Player;
    player2?: Player;
    score?: number;
  };
  startTime: number;
  endTime?: number;
  winnerTeam?: 1 | 2;
  kudosSubmittedBy: string[]; // player IDs who submitted their 6 kudos
}

export interface PreReadyMatch {
  id: string;
  sessionId: string;
  team1: {
    player1: Player;
    player2: Player;
  };
  team2: {
    player1: Player;
    player2: Player;
  };
  stagedAt: number;
  targetCourtId?: number; // specific arena or undefined for next available
}

export interface Court {
  id: number;
  name: string;
  arenaSubtitle: string;
  status: 'available' | 'in_game' | 'scoring';
  currentMatch?: CourtMatch;
}

export type ReapingQueueStatus = 'open' | 'closed' | 'full';

export interface GamemakerAuth {
  isAuthorized: boolean;
  gamemakerName: string;
}

export interface QueueSession {
  id: string;
  code: string;
  name: string;
  date: string;
  month: string; // e.g. "2026-11"
  qrCodeUrl: string;
  courtCount: number;
  isActive: boolean;
  reapingStatus?: ReapingQueueStatus; // 'open' = Reaping is Open, 'closed' = Reaping has Ended, 'full' = The Arena is Full
  totalMatchesPlayed: number;
  tributesPresent: string[]; // player IDs
}

export interface SponsorGiftPayload {
  matchId: string;
  giverId: string;
  recipients: {
    playerId: string;
    playerName: string;
    role: 'teammate' | 'opponent1' | 'opponent2';
    technicalSkill: TechnicalSkill;
    characterTrait?: CharacterTrait | null;
  }[];
}
