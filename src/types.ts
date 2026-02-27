export interface Player {
  id: string;
  name: string;
  points: number;
}

export interface Team {
  playerIds: [string, string];
}

export interface Match {
  id: string;
  court: number; // 1, 2, or 3
  team1: [string, string];
  team2: [string, string];
  score1: number;
  score2: number;
  isCompleted: boolean;
}

export interface Rotation {
  id: number;
  startTime: string;
  endTime: string;
  matches: Match[];
  byePlayerIds: string[];
  isCompleted: boolean;
}

export interface TournamentState {
  players: Player[];
  rotations: Rotation[];
  currentRotationIndex: number;
  startTime: string;
}
