import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  RefreshCw, 
  LayoutGrid,
  History,
  AlertCircle,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { Player, TournamentState, Rotation, Match } from './types';
import { INITIAL_PLAYERS, TOURNAMENT_CONFIG, TOURNAMENT_CONFIG_BY_PLAYER_COUNT } from './constants';
import { 
  generateInitialRotation, 
  generateNextRotation, 
  calculatePlayerPoints,
  formatTime 
} from './logic/tournament';

export default function App() {
  const [playerCount, setPlayerCount] = useState<number>(() => {
    const saved = localStorage.getItem('padel_tournament');
    if (saved) return JSON.parse(saved).players.length;
    return 14;
  });

  const config = TOURNAMENT_CONFIG_BY_PLAYER_COUNT[playerCount] ?? TOURNAMENT_CONFIG;

  const [state, setState] = useState<TournamentState>(() => {
    const saved = localStorage.getItem('padel_tournament');
    if (saved) {
      return JSON.parse(saved);
    }
    const initialRotation = generateInitialRotation(INITIAL_PLAYERS, "09:00");
    return {
      players: INITIAL_PLAYERS,
      rotations: [initialRotation],
      currentRotationIndex: 0,
      startTime: "09:00"
    };
  });

  // Sauvegarde automatique à chaque changement de state
  useEffect(() => {
    localStorage.setItem('padel_tournament', JSON.stringify(state));
  }, [state]);

  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'history' | 'players'>('players');

  const currentRotation = state.rotations[state.currentRotationIndex];
  const sortedPlayers = useMemo(() => calculatePlayerPoints(state), [state]);

  const handlePlayerNameChange = (id: string, newName: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, name: newName } : p)
    }));
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, score: number) => {
    setState(prev => {
      const newRotations = [...prev.rotations];
      const rotation = { ...newRotations[prev.currentRotationIndex] };
      const matchIndex = rotation.matches.findIndex(m => m.id === matchId);
      const match = { ...rotation.matches[matchIndex] };
      
      if (team === 1) match.score1 = score;
      else match.score2 = score;
      
      rotation.matches[matchIndex] = match;
      newRotations[prev.currentRotationIndex] = rotation;
      
      return { ...prev, rotations: newRotations };
    });
  };

  const completeRotation = () => {
if (state.currentRotationIndex === config.numRotations - 1)
      setState(prev => {
        const newRotations = [...prev.rotations];
        newRotations[prev.currentRotationIndex].isCompleted = true;
        return { ...prev, rotations: newRotations };
      });
      return;
    }

    setState(prev => {
      const newRotations = [...prev.rotations];
      newRotations[prev.currentRotationIndex].isCompleted = true;
      
      const nextRotation = generateNextRotation(
        newRotations[prev.currentRotationIndex],
        prev.players,
        prev.currentRotationIndex + 1
      );
      
      return {
        ...prev,
        rotations: [...newRotations, nextRotation],
        currentRotationIndex: prev.currentRotationIndex + 1
      };
    });
  };

  const updateStartTime = (newTime: string) => {
    setState(prev => {
      // Recalculate all rotation times based on new start time
      let currentTime = new Date(`2026-02-27T${newTime}`);
      const newRotations = prev.rotations.map((r, idx) => {
        const startTime = formatTime(currentTime);
        const endTimeDate = new Date(currentTime.getTime() + TOURNAMENT_CONFIG.matchDurationMinutes * 60000);
        const endTime = formatTime(endTimeDate);
        
        // Prepare for next rotation start time
        const endTimeDate = new Date(currentTime.getTime() + config.matchDurationMinutes * 60000);
currentTime = new Date(endTimeDate.getTime() + config.breakDurationMinutes * 60000);
        
        return { ...r, startTime, endTime };
      });

      return { ...prev, startTime: newTime, rotations: newRotations };
    });
  };

  const getPlayerName = (id: string) => state.players.find(p => p.id === id)?.name || "Inconnu";

  const resetTournament = () => {
    if (window.confirm("Êtes-vous sûr de vouloir tout réinitialiser ? Cela effacera tous les scores et les noms des joueurs.")) {
      const initialRotation = generateInitialRotation(INITIAL_PLAYERS, "09:00");
      const initialState = {
        players: INITIAL_PLAYERS,
        rotations: [initialRotation],
        currentRotationIndex: 0,
        startTime: "09:00"
      };
      // Efface aussi le localStorage
      localStorage.removeItem('padel_tournament');
      setState(initialState);
      setActiveTab('players');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Padel Master</h1>
            <p className="text-xs text-black/40 font-medium uppercase tracking-widest">Montante-Descendante</p>
          </div>
        </div>

        <div className="flex bg-black/5 p-1 rounded-xl overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'players' ? 'bg-white shadow-sm text-emerald-700' : 'text-black/60 hover:text-black'}`}
          >
            Joueurs
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'matches' ? 'bg-white shadow-sm text-emerald-700' : 'text-black/60 hover:text-black'}`}
          >
            Matchs
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-white shadow-sm text-emerald-700' : 'text-black/60 hover:text-black'}`}
          >
            Classement
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white shadow-sm text-emerald-700' : 'text-black/60 hover:text-black'}`}
          >
            Historique
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'players' && (
            <motion.div 
              key="players"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Configuration</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter italic serif">LES JOUEURS</h2>
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    <p className="text-black/40 text-sm font-medium">Nombre de joueurs :</p>
    <div className="flex bg-black/5 p-1 rounded-xl">
      {[8, 9, 10, 11, 12, 13, 14].map(n => (
        <button
          key={n}
          onClick={() => {
            setPlayerCount(n);
            const newPlayers = INITIAL_PLAYERS.slice(0, n);
            const initialRotation = generateInitialRotation(newPlayers, "09:00");
            localStorage.removeItem('padel_tournament');
            setState({ players: newPlayers, rotations: [initialRotation], currentRotationIndex: 0, startTime: "09:00" });
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${playerCount === n ? 'bg-white shadow-sm text-emerald-700' : 'text-black/60 hover:text-black'}`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
  <button 
    onClick={resetTournament}
    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors"
  >
    <Trash2 className="w-4 h-4" />
    Tout réinitialiser
  </button>
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.players.slice(0, playerCount).map((player, idx) => (
                  <div key={player.id} className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 group focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                    <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center font-mono font-black text-black/20 group-hover:text-emerald-600 transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Nom du joueur</label>
                      <input 
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                        placeholder={`Joueur ${idx + 1}`}
                        className="w-full bg-transparent font-bold text-lg focus:outline-none placeholder:text-black/10"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setActiveTab('matches')}
                  className="bg-black text-white px-10 py-5 rounded-2xl font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-3"
                >
                  Accéder aux matchs
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div 
              key="matches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Rotation Info */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <RefreshCw className="w-5 h-5" />
                    <span>Rotation {state.currentRotationIndex + 1} / {config.numRotations}</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter italic serif">EN COURS</h2>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-lg">
                    <Clock className="w-4 h-4 text-black/40" />
                    <input 
                      type="time" 
                      value={currentRotation.startTime}
                      onChange={(e) => updateStartTime(e.target.value)}
                      className="bg-transparent font-mono text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <div className="text-black/20 font-light">→</div>
                  <div className="font-mono text-sm font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    {currentRotation.endTime}
                  </div>
                </div>
              </div>

              {/* Courts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {currentRotation.matches.slice().sort((a, b) => a.court - b.court).map((match) => (
                  <motion.div 
                    key={match.id}
                    layoutId={match.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between relative">
                      <span className="text-xs font-bold uppercase tracking-widest text-black/30">Terrain {match.court}</span>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        match.court === 3 ? 'bg-amber-100 text-amber-700' : 
                        match.court === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {match.court === 3 ? 'Top' : match.court === 2 ? 'Milieu' : 'Bas'}
                      </div>
                    </div>

                    <div className="space-y-4 relative">
                      {/* Team 1 */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">{getPlayerName(match.team1[0])}</p>
                            <p className="text-sm font-bold">{getPlayerName(match.team1[1])}</p>
                          </div>
                          <input 
                            type="number"
                            value={match.score1}
                            onChange={(e) => handleScoreChange(match.id, 1, parseInt(e.target.value) || 0)}
                            className="w-12 h-12 bg-black/5 rounded-xl text-center font-mono text-xl font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-black/5"></div>
                        <span className="text-[10px] font-black text-black/20 italic">VS</span>
                        <div className="h-px flex-1 bg-black/5"></div>
                      </div>

                      {/* Team 2 */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">{getPlayerName(match.team2[0])}</p>
                            <p className="text-sm font-bold">{getPlayerName(match.team2[1])}</p>
                          </div>
                          <input 
                            type="number"
                            value={match.score2}
                            onChange={(e) => handleScoreChange(match.id, 2, parseInt(e.target.value) || 0)}
                            className="w-12 h-12 bg-black/5 rounded-xl text-center font-mono text-xl font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bye Players */}
              <div className="bg-white/50 border border-dashed border-black/10 rounded-3xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-black/40" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">En attente (Bye)</p>
                    <p className="text-sm font-semibold">
                      {currentRotation.byePlayerIds.map(id => getPlayerName(id)).join(' & ')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={completeRotation}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
                >
                  Valider la rotation
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Performance</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter italic serif">CLASSEMENT</h2>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-bottom border-black/5 bg-black/[0.02]">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Rang</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Joueur</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 text-right">Points (Diff)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((player, idx) => (
                      <tr key={player.id} className="group hover:bg-black/[0.01] transition-colors border-b border-black/5 last:border-0">
                        <td className="px-8 py-6">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-700' : 
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-black/20'
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-lg">{player.name}</td>
                        <td className="px-8 py-6 text-right">
                          <span className={`font-mono font-black text-xl ${player.points > 0 ? 'text-emerald-600' : player.points < 0 ? 'text-rose-600' : 'text-black/40'}`}>
                            {player.points > 0 ? `+${player.points}` : player.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <History className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Archives</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter italic serif">HISTORIQUE</h2>
              </div>

              <div className="space-y-4">
                {state.rotations.map((rotation, idx) => (
                  <div key={rotation.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black italic serif">R{idx + 1}</span>
                        <div className="h-4 w-px bg-black/10"></div>
                        <span className="text-sm font-bold text-black/40">{rotation.startTime} - {rotation.endTime}</span>
                      </div>
                      {rotation.isCompleted ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Terminé</span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">En cours</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {rotation.matches.map(m => (
                        <div key={m.id} className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                          <p className="text-[10px] font-black text-black/20 uppercase mb-3">Terrain {m.court}</p>
                          <div className="flex justify-between items-center text-sm font-bold">
                            <div className="flex-1">
                              <p>{getPlayerName(m.team1[0])}</p>
                              <p>{getPlayerName(m.team1[1])}</p>
                            </div>
                            <div className="px-3 py-1 bg-white rounded-lg font-mono font-black text-emerald-600">
                              {m.score1} - {m.score2}
                            </div>
                            <div className="flex-1 text-right">
                              <p>{getPlayerName(m.team2[0])}</p>
                              <p>{getPlayerName(m.team2[1])}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5 mt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <AlertCircle className="w-4 h-4" />
          Règle de séparation des partenaires active
        </div>
        <p className="text-xs font-medium">© 2026 Padel Master Tournament System</p>
      </footer>
    </div>
  );
}
