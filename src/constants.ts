import { Player } from "./types";

export const INITIAL_PLAYERS: Player[] = Array.from({ length: 14 }, (_, i) => ({
  id: String(i + 1),
  name: `Joueur ${i + 1}`,
  points: 0,
}));

export const TOURNAMENT_CONFIG_BY_PLAYER_COUNT: Record<number, {
  numRotations: number;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  numCourts: number;
  playersPerCourt: number;
  totalPlayers: number;
}> = {
  8:  { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 2, playersPerCourt: 4, totalPlayers: 8  },
  9:  { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 2, playersPerCourt: 4, totalPlayers: 9  },
  10: { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 2, playersPerCourt: 4, totalPlayers: 10 },
  11: { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 2, playersPerCourt: 4, totalPlayers: 11 },
  12: { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 3, playersPerCourt: 4, totalPlayers: 12 },
  13: { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 3, playersPerCourt: 4, totalPlayers: 13 },
  14: { numRotations: 7, matchDurationMinutes: 15, breakDurationMinutes: 3, numCourts: 3, playersPerCourt: 4, totalPlayers: 14 },
};

// ✅ Garde seulement cette ligne, supprime le bloc { ... } en dessous
export const TOURNAMENT_CONFIG = TOURNAMENT_CONFIG_BY_PLAYER_COUNT[14];
