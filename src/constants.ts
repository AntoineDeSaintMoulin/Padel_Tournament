import { Player } from "./types";

export const INITIAL_PLAYERS: Player[] = [
  { id: "1", name: "Joueur 1", points: 0 },
  { id: "2", name: "Joueur 2", points: 0 },
  { id: "3", name: "Joueur 3", points: 0 },
  { id: "4", name: "Joueur 4", points: 0 },
  { id: "5", name: "Joueur 5", points: 0 },
  { id: "6", name: "Joueur 6", points: 0 },
  { id: "7", name: "Joueur 7", points: 0 },
  { id: "8", name: "Joueur 8", points: 0 },
  { id: "9", name: "Joueur 9", points: 0 },
  { id: "10", name: "Joueur 10", points: 0 },
  { id: "11", name: "Joueur 11", points: 0 },
  { id: "12", name: "Joueur 12", points: 0 },
  { id: "13", name: "Joueur 13", points: 0 },
  { id: "14", name: "Joueur 14", points: 0 },
];

export const TOURNAMENT_CONFIG = {
  numRotations: 7,
  matchDurationMinutes: 15,
  breakDurationMinutes: 3,
  numCourts: 3,
  playersPerCourt: 4,
  totalPlayers: 14,
};
