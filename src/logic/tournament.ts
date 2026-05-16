import { Match, Player, Rotation, TournamentState } from "../types";
import { TOURNAMENT_CONFIG, TOURNAMENT_CONFIG_BY_PLAYER_COUNT } from "../constants";

/**
 * Logic for the "Montante-Descendante" Padel Tournament
 */

export function generateInitialRotation(players: Player[], startTimeStr: string): Rotation {
  const config = TOURNAMENT_CONFIG_BY_PLAYER_COUNT[players.length] 
    ?? TOURNAMENT_CONFIG_BY_PLAYER_COUNT[14];
  
  const numActivePlayers = config.numCourts * config.playersPerCourt;
  
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const byePlayerIds = shuffled.slice(numActivePlayers).map(p => p.id);
  const activePlayers = shuffled.slice(0, numActivePlayers);

  const matches: Match[] = [];
  for (let i = 0; i < config.numCourts; i++) {
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
  const endTime = new Date(startTime.getTime() + config.matchDurationMinutes * 60000);

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
  const config = TOURNAMENT_CONFIG_BY_PLAYER_COUNT[allPlayers.length] 
    ?? TOURNAMENT_CONFIG_BY_PLAYER_COUNT[14];

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

  // Sort courts from highest to lowest
  const sortedCourts = [...courtResults].sort((a, b) => b.court - a.court);
  const topCourt = sortedCourts[0];
  const bottomCourt = sortedCourts[sortedCourts.length - 1];

  // 2. Build next court assignments dynamically based on numCourts
  const nextCourtPlayers: string[][] = [];

  if (config.numCourts === 2) {
    // 2 terrains, ex: 8-11 joueurs
    // T2: Winners T2 stay + Winners T1 go up
    // T1: Losers T2 go down + Bye players enter
    // Bye: Losers T1
    const c1 = courtResults.find(r => r.court === 1)!;
    const c2 = courtResults.find(r => r.court === 2)!;

    nextCourtPlayers[1] = [...c2.winners, ...c1.winners];
    nextCourtPlayers[0] = [...c2.losers, ...currentRotation.byePlayerIds];
    
    const nextByePlayers = [...c1.losers];

    const nextMatches: Match[] = [
      createMatchWithSeparation(2, nextCourtPlayers[1], buildPartnersMap(currentRotation), rotationIndex),
      createMatchWithSeparation(1, nextCourtPlayers[0], buildPartnersMap(currentRotation), rotationIndex),
    ];

    const prevEndTime = new Date(`2026-02-27T${currentRotation.endTime}`);
    const nextStartTime = new Date(prevEndTime.getTime() + config.breakDurationMinutes * 60000);
    const nextEndTime = new Date(nextStartTime.getTime() + config.matchDurationMinutes * 60000);

    return {
      id: rotationIndex,
      startTime: formatTime(nextStartTime),
      endTime: formatTime(nextEndTime),
      matches: nextMatches,
      byePlayerIds: nextByePlayers,
      isCompleted: false,
    };
  }

  // 3 terrains (12-14 joueurs) — logique originale
  const c1 = courtResults.find(r => r.court === 1)!;
  const c2 = courtResults.find(r => r.court === 2)!;
  const c3 = courtResults.find(r => r.court === 3)!;

  const nextC3Players = [...c3.winners, ...c2.winners];
  const nextC2Players = [...c3.losers, ...c1.winners];
  const nextC1Players = [...c2.losers, ...currentRotation.byePlayerIds];
  const nextByePlayers = [...c1.losers];

  const previousPartnersMap = buildPartnersMap(currentRotation);

  const nextMatches: Match[] = [
    createMatchWithSeparation(3, nextC3Players, previousPartnersMap, rotationIndex),
    createMatchWithSeparation(2, nextC2Players, previousPartnersMap, rotationIndex),
    createMatchWithSeparation(1, nextC1Players, previousPartnersMap, rotationIndex),
  ];

  const prevEndTime = new Date(`2026-02-27T${currentRotation.endTime}`);
  const nextStartTime = new Date(prevEndTime.getTime() + config.breakDurationMinutes * 60000);
  const nextEndTime = new Date(nextStartTime.getTime() + config.matchDurationMinutes * 60000);

  return {
    id: rotationIndex,
    startTime: formatTime(nextStartTime),
    endTime: formatTime(nextEndTime),
    matches: nextMatches,
    byePlayerIds: nextByePlayers,
    isCompleted: false,
  };
}

function buildPartnersMap(rotation: Rotation): Map<string, string> {
  const map = new Map<string, string>();
  rotation.matches.forEach(m => {
    map.set(m.team1[0], m.team1[1]);
    map.set(m.team1[1], m.team1[0]);
    map.set(m.team2[0], m.team2[1]);
    map.set(m.team2[1], m.team2[0]);
  });
  return map;
}

function createMatchWithSeparation(
  court: number,
  playerIds: string[],
  prevPartners: Map<string, string>,
  rotationIndex: number
): Match {
  const p1 = playerIds[0];
  const forbidden = prevPartners.get(p1);
  
  let p2Index = 1;
  if (playerIds[1] === forbidden) {
    p2Index = 2;
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
