import { Match, Player, Rotation, TournamentState } from "../types";
import { TOURNAMENT_CONFIG } from "../constants";

/**
 * Logic for the "Montante-Descendante" Padel Tournament
 */

export function generateInitialRotation(players: Player[], startTimeStr: string): Rotation {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const byePlayerIds = shuffled.slice(12).map(p => p.id);
  const activePlayers = shuffled.slice(0, 12);

  const matches: Match[] = [];
  for (let i = 0; i < 3; i++) {
    const courtPlayers = activePlayers.slice(i * 4, (i + 1) * 4);
    matches.push({
      id: `r0-c${i + 1}`,
      court: i + 1,
      team1: [courtPlayers[0].id, courtPlayers[1].id],
      team2: [courtPlayers[2].id, courtPlayers[3].id],
      score1: 0,
      score2: 0,
      isCompleted: false,
    });
  }

  const startTime = new Date(`2026-02-27T${startTimeStr}`);
  const endTime = new Date(startTime.getTime() + TOURNAMENT_CONFIG.matchDurationMinutes * 60000);

  return {
    id: 0,
    startTime: formatTime(startTime),
    endTime: formatTime(endTime),
    matches,
    byePlayerIds,
    isCompleted: false,
  };
}

export function generateNextRotation(
  currentRotation: Rotation,
  allPlayers: Player[],
  rotationIndex: number
): Rotation {
  // 1. Identify winners and losers from current rotation
  const courtResults = currentRotation.matches.map(m => {
    const isTeam1Winner = m.score1 > m.score2;
    return {
      court: m.court,
      winners: isTeam1Winner ? m.team1 : m.team2,
      losers: isTeam1Winner ? m.team2 : m.team1,
      previousPartners: [m.team1, m.team2] as [string, string][],
    };
  });

  const c1 = courtResults.find(r => r.court === 1)!;
  const c2 = courtResults.find(r => r.court === 2)!;
  const c3 = courtResults.find(r => r.court === 3)!;

  // 2. Apply movement logic
  // T3: Winners stay, Losers go to T2
  // T2: Winners go to T3, Losers go to T1
  // T1: Winners go to T2, Losers go to Bye
  // Bye: Enter at T1

  const nextC3Players = [...c3.winners, ...c2.winners];
  const nextC2Players = [...c3.losers, ...c1.winners];
  const nextC1Players = [...c2.losers, ...currentRotation.byePlayerIds];
  const nextByePlayers = [...c1.losers];

  // 3. Create matches with partner separation
  // We need to know who was partner with whom in the PREVIOUS rotation
  const previousPartnersMap = new Map<string, string>();
  currentRotation.matches.forEach(m => {
    previousPartnersMap.set(m.team1[0], m.team1[1]);
    previousPartnersMap.set(m.team1[1], m.team1[0]);
    previousPartnersMap.set(m.team2[0], m.team2[1]);
    previousPartnersMap.set(m.team2[1], m.team2[0]);
  });

  const nextMatches: Match[] = [
    createMatchWithSeparation(3, nextC3Players, previousPartnersMap, rotationIndex),
    createMatchWithSeparation(2, nextC2Players, previousPartnersMap, rotationIndex),
    createMatchWithSeparation(1, nextC1Players, previousPartnersMap, rotationIndex),
  ];

  // 4. Calculate times
  const prevEndTime = new Date(`2026-02-27T${currentRotation.endTime}`);
  const nextStartTime = new Date(prevEndTime.getTime() + TOURNAMENT_CONFIG.breakDurationMinutes * 60000);
  const nextEndTime = new Date(nextStartTime.getTime() + TOURNAMENT_CONFIG.matchDurationMinutes * 60000);

  return {
    id: rotationIndex,
    startTime: formatTime(nextStartTime),
    endTime: formatTime(nextEndTime),
    matches: nextMatches,
    byePlayerIds: nextByePlayers,
    isCompleted: false,
  };
}

function createMatchWithSeparation(
  court: number,
  playerIds: string[],
  prevPartners: Map<string, string>,
  rotationIndex: number
): Match {
  // Simple heuristic for separation:
  // Try to pair playerIds[0] with someone who isn't their previous partner
  const p1 = playerIds[0];
  const forbidden = prevPartners.get(p1);
  
  let p2Index = 1;
  if (playerIds[1] === forbidden) {
    p2Index = 2; // Swap if they were partners
  }
  
  const p2 = playerIds[p2Index];
  const remaining = playerIds.filter(id => id !== p1 && id !== p2);
  
  return {
    id: `r${rotationIndex}-c${court}`,
    court,
    team1: [p1, p2],
    team2: [remaining[0], remaining[1]],
    score1: 0,
    score2: 0,
    isCompleted: false,
  };
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function calculatePlayerPoints(state: TournamentState): Player[] {
  const playerPoints = new Map<string, number>();
  state.players.forEach(p => playerPoints.set(p.id, 0));

  state.rotations.forEach(r => {
    if (r.isCompleted) {
      r.matches.forEach(m => {
        const diff = m.score1 - m.score2;
        // Team 1 gets +diff, Team 2 gets -diff
        m.team1.forEach(pid => playerPoints.set(pid, (playerPoints.get(pid) || 0) + diff));
        m.team2.forEach(pid => playerPoints.set(pid, (playerPoints.get(pid) || 0) - diff));
      });
    }
  });

  return state.players.map(p => ({
    ...p,
    points: playerPoints.get(p.id) || 0,
  })).sort((a, b) => b.points - a.points);
}
