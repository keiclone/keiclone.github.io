const { useState, useEffect, useCallback, useRef } = React;

// All TI4 Factions organized by expansion
const FACTIONS = {
  base: [
    { id: 'arborec', name: 'The Arborec', color: '#2d5a27', icon: '🌳' },
    { id: 'barony', name: 'The Barony of Letnev', color: '#4a4a4a', icon: '⚔️' },
    { id: 'saar', name: 'The Clan of Saar', color: '#8b7355', icon: '🔥' },
    { id: 'muaat', name: 'The Embers of Muaat', color: '#ff4500', icon: '🌋' },
    { id: 'hacan', name: 'The Emirates of Hacan', color: '#ffd700', icon: '🦁' },
    { id: 'sol', name: 'The Federation of Sol', color: '#1e90ff', icon: '🌍' },
    { id: 'creuss', name: 'The Ghosts of Creuss', color: '#00ced1', icon: '👻' },
    { id: 'l1z1x', name: 'The L1Z1X Mindnet', color: '#483d8b', icon: '🤖' },
    { id: 'mentak', name: 'The Mentak Coalition', color: '#ff8c00', icon: '🏴‍☠️' },
    { id: 'naalu', name: 'The Naalu Collective', color: '#9370db', icon: '🐍' },
    { id: 'nekro', name: 'The Nekro Virus', color: '#8b0000', icon: '☠️' },
    { id: 'sardakk', name: "Sardakk N'orr", color: '#b22222', icon: '🪲' },
    { id: 'jolnar', name: 'The Universities of Jol-Nar', color: '#4169e1', icon: '🔬' },
    { id: 'winnu', name: 'The Winnu', color: '#daa520', icon: '👑' },
    { id: 'xxcha', name: 'The Xxcha Kingdom', color: '#228b22', icon: '🐢' },
    { id: 'yin', name: 'The Yin Brotherhood', color: '#f5f5f5', icon: '☯️' },
    { id: 'yssaril', name: 'The Yssaril Tribes', color: '#006400', icon: '🥷' },
  ],
  pok: [
    { id: 'argent', name: 'The Argent Flight', color: '#c0c0c0', icon: '🦅' },
    { id: 'empyrean', name: 'The Empyrean', color: '#9932cc', icon: '🌌' },
    { id: 'mahact', name: 'The Mahact Gene-Sorcerers', color: '#800080', icon: '🧬' },
    { id: 'naazrokha', name: 'The Naaz-Rokha Alliance', color: '#cd853f', icon: '🐿️' },
    { id: 'nomad', name: 'The Nomad', color: '#2f4f4f', icon: '🚀' },
    { id: 'titans', name: 'The Titans of Ul', color: '#708090', icon: '⚙️' },
    { id: 'cabal', name: "The Vuil'Raith Cabal", color: '#dc143c', icon: '👁️' },
  ],
  codex: [
    { id: 'keleres', name: 'The Council Keleres', color: '#fafad2', icon: '⚖️' },
  ],
  thundersEdge: [
    { id: 'crimson', name: 'The Crimson Rebellion', color: '#cc0000', icon: '🔴' },
    { id: 'deepwrought', name: 'The Deepwrought Scholarate', color: '#1a5276', icon: '🌊' },
    { id: 'firmament', name: 'The Firmament / The Obsidian', color: '#1c1c1c', icon: '✨' },
    { id: 'lastbastion', name: 'Last Bastion', color: '#d4af37', icon: '🛡️' },
    { id: 'ralnel', name: 'The Ral Nel Consortium', color: '#4ecdc4', icon: '💎' },
  ],
};

const ALL_FACTIONS = [...FACTIONS.base, ...FACTIONS.pok, ...FACTIONS.codex, ...FACTIONS.thundersEdge];

const STRATEGY_CARDS = [
  { id: 1, name: 'Leadership', color: '#dc2626', initiative: 1 },
  { id: 2, name: 'Diplomacy', color: '#f59e0b', initiative: 2 },
  { id: 3, name: 'Politics', color: '#eab308', initiative: 3 },
  { id: 4, name: 'Construction', color: '#22c55e', initiative: 4 },
  { id: 5, name: 'Trade', color: '#06b6d4', initiative: 5 },
  { id: 6, name: 'Warfare', color: '#3b82f6', initiative: 6 },
  { id: 7, name: 'Technology', color: '#8b5cf6', initiative: 7 },
  { id: 8, name: 'Imperial', color: '#ec4899', initiative: 8 },
];

const PHASES = ['setup', 'drafting', 'strategy', 'action', 'status', 'agenda', 'results'];

const PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'
];

const STORAGE_KEY = 'ti4_extracomputer_state';

// Helper to get effective initiative - Naalu Collective always has initiative 0
function getEffectiveInitiative(player) {
  if (player.factionId === 'naalu') {
    return 0;
  }
  return player.strategyCard?.initiative || 99;
}

// Sort players by effective initiative
function sortByInitiative(players) {
  return [...players].sort((a, b) => getEffectiveInitiative(a) - getEffectiveInitiative(b));
}

// Load initial state from localStorage
function getInitialState(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.phase) {
        // Merge with defaults to ensure new properties exist
        return { ...defaultValue, ...parsed };
      }
    }
  } catch {
    // ignore
  }
  return defaultValue;
}

const INITIAL_STATE = {
  phase: 'setup',
  playerCount: 6,
  players: [],
  round: 1,
  maxVP: 10,
  expansions: { base: true, pok: true, codex: true, thundersEdge: true },
  currentTurnPlayerId: null,
  passedPlayers: [],
  usedStrategyCards: [],
  timerElapsed: 0,
  timerRunning: false,
  actionLog: [],
  winner: null,
  // Time limit mode settings
  timeLimitMode: false,
  turnTimerPhase: null, // 'prep' | 'initiate' | 'resolve' | null
  turnTimerRemaining: 0, // milliseconds remaining
  turnTimerRunning: false,
  playerExtensions: {}, // Per-player extensions: { playerId: number }
  alarmEnabled: true, // Toggle for alarm sound
};

// Time limit constants (in milliseconds)
const TIME_LIMITS = {
  prep: 2 * 60 * 1000,      // 2 minutes prep after strategy phase
  initiate: 60 * 1000,       // 60 seconds to initiate action
  resolve: 90 * 1000,        // 90 seconds to resolve action
  extension: 2 * 60 * 1000,  // 2 minute extension
};

// Timer component
function Timer({ isRunning, elapsed, onToggle }) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <button 
      onClick={onToggle}
      className="font-mono text-2xl tracking-wider hover:opacity-80 transition-opacity"
      style={{ color: isRunning ? '#4ade80' : '#fbbf24' }}
    >
      {formatTime(elapsed)} {isRunning ? '⏸' : '▶'}
    </button>
  );
}

// Turn Timer component for time limit mode
function TurnTimer({ 
  phase, // 'prep' | 'initiate' | 'resolve'
  remaining, 
  isRunning, 
  extensionsRemaining,
  alarmEnabled,
  onToggle, 
  onExtend,
  onTimeUp,
  onStartEarly, // For prep phase - start first player's turn early
  onToggleAlarm // Toggle alarm on/off
}) {
  const timerRef = useRef(null);
  const [localRemaining, setLocalRemaining] = useState(remaining);
  
  // Play alarm sound using Web Audio API
  const playAlarm = useCallback(() => {
    if (!alarmEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'square';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Beep pattern: 3 short beeps
      setTimeout(() => { gainNode.gain.value = 0; }, 200);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 300);
      setTimeout(() => { gainNode.gain.value = 0; }, 500);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 600);
      setTimeout(() => { gainNode.gain.value = 0; }, 800);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 900);
    } catch (e) {
      // Audio not supported
      console.log('Audio not supported');
    }
  }, [alarmEnabled]);
  
  // Sync with prop changes
  useEffect(() => {
    setLocalRemaining(remaining);
  }, [remaining]);
  
  // Run the countdown - restart when remaining prop changes (e.g., after undo)
  useEffect(() => {
    if (isRunning && localRemaining > 0) {
      timerRef.current = setInterval(() => {
        setLocalRemaining(prev => {
          const newVal = prev - 100;
          if (newVal <= 0) {
            clearInterval(timerRef.current);
            playAlarm();
            onTimeUp();
            return 0;
          }
          return newVal;
        });
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, remaining, onTimeUp, playAlarm]); // Added 'remaining' to deps
  
  const formatCountdown = (ms) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const getPhaseLabel = () => {
    switch (phase) {
      case 'prep': return '🎯 PREP TIME';
      case 'initiate': return '⏱️ INITIATE ACTION';
      case 'resolve': return '⚡ RESOLVE ACTION';
      default: return 'TIMER';
    }
  };
  
  const getPhaseColor = () => {
    if (localRemaining <= 10000) return '#ef4444'; // Red when < 10 seconds
    if (localRemaining <= 30000) return '#f59e0b'; // Orange when < 30 seconds
    switch (phase) {
      case 'prep': return '#3b82f6'; // Blue
      case 'initiate': return '#22c55e'; // Green
      case 'resolve': return '#a855f7'; // Purple
      default: return '#ffffff';
    }
  };
  
  const progressPercent = TIME_LIMITS[phase] ? (localRemaining / TIME_LIMITS[phase]) * 100 : 0;
  
  return (
    <div className="bg-slate-800/90 backdrop-blur rounded-xl border border-slate-600 p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold" style={{ color: getPhaseColor() }}>
          {getPhaseLabel()}
        </span>
        {phase !== 'prep' && (
          <span className="text-xs text-slate-400">
            🎫 {extensionsRemaining} extensions left
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div 
          className="h-full transition-all duration-100 rounded-full"
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: getPhaseColor()
          }}
        />
      </div>
      
      {/* Time display */}
      <div className="text-center mb-3">
        {localRemaining <= 0 && !isRunning ? (
          <span className="font-mono text-3xl font-bold text-red-500 animate-pulse">
            ⏰ TIME'S UP!
          </span>
        ) : (
          <span 
            className="font-mono text-4xl font-bold"
            style={{ color: getPhaseColor() }}
          >
            {formatCountdown(localRemaining)}
          </span>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        {/* Only show Pause/Resume if timer hasn't expired */}
        {!(localRemaining <= 0 && !isRunning) && (
          <button
            onClick={onToggle}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              isRunning 
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
        )}
        
        {/* Alarm toggle button */}
        {onToggleAlarm && (
          <button
            onClick={onToggleAlarm}
            className={`px-3 py-2 rounded-lg font-bold transition-colors ${
              alarmEnabled 
                ? 'bg-green-600/70 hover:bg-green-500 text-white' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
            }`}
            title={alarmEnabled ? 'Alarm ON - Click to mute' : 'Alarm OFF - Click to enable'}
          >
            {alarmEnabled ? '🔔' : '🔕'}
          </button>
        )}
        
        {/* Start Early button - only during prep phase */}
        {phase === 'prep' && onStartEarly && (
          <button
            onClick={onStartEarly}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
          >
            🚀 Start First Turn
          </button>
        )}
        
        {/* Extension button - only during initiate/resolve phases, even when timer expired */}
        {phase !== 'prep' && extensionsRemaining > 0 && (
          <button
            onClick={onExtend}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-colors"
          >
            +2 min 🎫
          </button>
        )}
      </div>
    </div>
  );
}

// Victory Screen component
function VictoryScreen({ winner, players, round, elapsed, onNewGame }) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const winnerFaction = ALL_FACTIONS.find(f => f.id === winner.factionId);
  const sortedPlayers = [...players].sort((a, b) => b.vp - a.vp);
  
  // Ensure readable color (darken light colors)
  const getReadableColor = (hexColor) => {
    if (!hexColor) return '#ffffff';
    // Parse hex color
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // If too light, return a darker version or gold
    if (luminance > 0.7) {
      return '#ffd700'; // Gold for light factions
    }
    return hexColor;
  };

  const factionColor = winnerFaction?.color || winner.color || '#ffd700';

  return (
    <div 
      className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${factionColor}33 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, ${factionColor}22 0%, transparent 40%),
          radial-gradient(ellipse at 20% 80%, ${factionColor}22 0%, transparent 40%),
          linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)
        `,
      }}
    >
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>
      
      {/* Glowing ring effect behind winner */}
      <div 
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${factionColor} 0%, transparent 70%)`,
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 30px ${factionColor}66, 0 0 60px ${factionColor}33; }
          50% { box-shadow: 0 0 50px ${factionColor}88, 0 0 100px ${factionColor}44; }
        }
      `}</style>

      <div className="relative z-10 text-center mb-8">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-3xl md:text-4xl font-bold italic mb-4 text-amber-100 drop-shadow-lg"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(251,191,36,0.3)' }}
        >
          Swear your allegiance to the new Galactic Emperor
        </h1>
      </div>

      {/* Winner Display */}
      <div className="relative z-10 mb-8 flex flex-col items-center" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <div 
          className="w-32 h-32 md:w-40 md:h-40 rounded-lg border-4 flex items-center justify-center text-6xl md:text-7xl mb-4"
          style={{ 
            borderColor: getReadableColor(factionColor),
            backgroundColor: `${factionColor}44`,
            animation: 'glow 2s ease-in-out infinite',
          }}
        >
          {winnerFaction?.icon || '👑'}
        </div>
        <h2 
          className="text-3xl font-bold mb-1" 
          style={{ 
            color: getReadableColor(factionColor),
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px ' + factionColor + '66'
          }}
        >
          {winner.name}
        </h2>
        <p className="text-xl text-slate-300" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          {winnerFaction?.name}
        </p>
        <p className="text-amber-400 font-bold text-2xl mt-2">
          🏆 {winner.vp} Victory Points
        </p>
      </div>

      {/* Results Table */}
      <div className="relative z-10 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-600 p-4 mb-8 w-full max-w-2xl">
        <h3 className="text-lg font-bold text-slate-300 mb-3 text-center">Final Standings</h3>
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-sm border-b border-slate-700">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Faction</th>
              <th className="text-center py-2 px-2">VP</th>
              <th className="text-center py-2 px-2">Speaker</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, idx) => {
              const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
              const isWinner = player.id === winner.id;
              return (
                <tr 
                  key={player.id} 
                  className={`border-b border-slate-800 ${isWinner ? 'bg-amber-900/30' : ''}`}
                >
                  <td className="py-3 px-2 text-slate-400 font-bold">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{faction?.icon}</span>
                      <span className="text-slate-100">{faction?.name || player.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-slate-100 font-bold">{player.vp}</span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-slate-100">{player.isSpeaker ? '🎤' : ''}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Game Stats */}
      <div className="relative z-10 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-600 p-4 mb-8">
        <div className="flex gap-8 justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Game Duration</p>
            <p className="text-amber-200 font-bold text-xl">{formatTime(elapsed)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Rounds Played</p>
            <p className="text-amber-200 font-bold text-xl">{round}</p>
          </div>
        </div>
      </div>

      {/* New Game Button */}
      <button
        onClick={onNewGame}
        className="relative z-10 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg"
        style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)' }}
      >
        🚀 Start New Game
      </button>
    </div>
  );
}

// Player card component
function PlayerCard({ player, isActive, onVPChange, onSpeakerToggle, compact }) {
  const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
        isActive ? 'ring-2 ring-white scale-105 z-10' : 'opacity-80 hover:opacity-100'
      }`}
      style={{ 
        background: `linear-gradient(135deg, ${faction?.color || player.color}dd, ${faction?.color || player.color}88)`,
        boxShadow: isActive ? `0 0 30px ${faction?.color || player.color}66` : 'none'
      }}
    >
      <div className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '30px 30px'
        }} 
      />
      
      <div className={`relative ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{faction?.icon || '🌟'}</span>
            <div>
              <div className="text-white font-bold text-sm truncate max-w-32">
                {player.name}
              </div>
              <div className="text-white/70 text-xs truncate max-w-32">
                {faction?.name || 'Unknown'}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onSpeakerToggle(player.id)}
            className={`text-xl transition-transform hover:scale-110 ${
              player.isSpeaker ? 'drop-shadow-lg' : 'opacity-40'
            }`}
          >
            🎤
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onVPChange(player.id, -1)}
              className="w-6 h-6 rounded bg-black/30 text-white hover:bg-black/50 transition-colors text-xs"
            >
              −
            </button>
            <div className="px-3 py-1 bg-black/40 rounded font-mono text-white text-lg min-w-12 text-center">
              {player.vp}
            </div>
            <button
              onClick={() => onVPChange(player.id, 1)}
              className="w-6 h-6 rounded bg-black/30 text-white hover:bg-black/50 transition-colors text-xs"
            >
              +
            </button>
            <span className="text-white/60 text-xs ml-1">VP</span>
          </div>
          
          {player.strategyCard && (
            <div 
              className="px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: player.strategyCard.color }}
            >
              {player.strategyCard.initiative}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Faction selection modal
function FactionSelector({ player, onSelect, onClose, usedFactions, expansions }) {
  const [filter, setFilter] = useState('all');
  
  const availableFactions = ALL_FACTIONS.filter(f => {
    if (usedFactions.includes(f.id) && player.factionId !== f.id) return false;
    
    if (filter === 'all') return true;
    if (filter === 'base') return FACTIONS.base.some(bf => bf.id === f.id);
    if (filter === 'pok') return FACTIONS.pok.some(pf => pf.id === f.id);
    if (filter === 'codex') return FACTIONS.codex.some(cf => cf.id === f.id);
    if (filter === 'thundersEdge') return FACTIONS.thundersEdge.some(tf => tf.id === f.id);
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Select Faction for {player.name}</h3>
            <p className="text-slate-400 text-sm">Choose a faction from the available options</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="p-4 border-b border-slate-700 flex gap-2 flex-wrap">
          {['all', 'base', 'pok', 'codex', 'thundersEdge'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'thundersEdge' ? "Thunder's Edge" : f.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="p-4 overflow-y-auto max-h-96 grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableFactions.map(faction => (
            <button
              key={faction.id}
              onClick={() => { onSelect(faction); onClose(); }}
              className="p-3 rounded-lg text-left transition-all hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${faction.color}cc, ${faction.color}66)`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{faction.icon}</span>
                <span className="text-white font-medium text-sm">{faction.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Strategy card selection
function StrategyPhase({ players, onCardSelect, onComplete, strategyCards }) {
  const availableCards = strategyCards.filter(
    card => !players.some(p => p.strategyCard?.id === card.id)
  );
  
  // Find speaker and create pick order starting from speaker
  const speakerIndex = players.findIndex(p => p.isSpeaker);
  const pickOrder = [];
  for (let i = 0; i < players.length; i++) {
    pickOrder.push(players[(speakerIndex + i) % players.length]);
  }
  
  // Find the first player in pick order who hasn't picked yet
  const currentPicker = pickOrder.find(p => !p.strategyCard);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Strategy Phase</h2>
        {currentPicker ? (
          <p className="text-slate-300">
            <span className="font-bold" style={{ color: currentPicker.color }}>
              {currentPicker.name}
            </span> is selecting a Strategy Card
            {currentPicker.isSpeaker && <span className="ml-2">🎤</span>}
          </p>
        ) : (
          <p className="text-green-400 font-bold">All players have selected!</p>
        )}
      </div>
      
      {/* Pick order display */}
      <div className="flex justify-center gap-2 flex-wrap">
        {pickOrder.map((player, idx) => {
          const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
          const hasPicked = !!player.strategyCard;
          const isCurrent = player.id === currentPicker?.id;
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isCurrent ? 'ring-2 ring-white scale-110' : ''
              } ${hasPicked ? 'opacity-40' : ''}`}
              style={{ backgroundColor: `${faction?.color || player.color}88` }}
            >
              <span className="text-lg">{faction?.icon}</span>
              <span className="text-white font-medium text-sm">{player.name}</span>
              {player.isSpeaker && <span className="text-xs">🎤</span>}
              {player.strategyCard && (
                <span 
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: player.strategyCard.color }}
                >
                  {player.strategyCard.initiative}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {strategyCards.map(card => {
          const owner = players.find(p => p.strategyCard?.id === card.id);
          const isAvailable = !owner;
          
          return (
            <button
              key={card.id}
              onClick={() => isAvailable && currentPicker && onCardSelect(currentPicker.id, card)}
              disabled={!isAvailable || !currentPicker}
              className={`relative p-4 rounded-xl transition-all ${
                isAvailable && currentPicker
                  ? 'hover:scale-105 cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              style={{ 
                background: `linear-gradient(135deg, ${card.color}, ${card.color}88)`,
                boxShadow: isAvailable ? `0 4px 20px ${card.color}44` : 'none'
              }}
            >
              <div className="text-4xl font-black text-white/30 absolute top-2 right-3">
                {card.initiative}
              </div>
              <div className="text-white font-bold text-lg">{card.name}</div>
              {owner && (
                <div className="mt-2 text-white/80 text-sm flex items-center gap-1">
                  <span>{ALL_FACTIONS.find(f => f.id === owner.factionId)?.icon}</span>
                  <span>{owner.name}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {!currentPicker && (
        <button
          onClick={onComplete}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
        >
          Begin Action Phase →
        </button>
      )}
    </div>
  );
}

// Action phase tracker
function ActionPhase({ 
  players, 
  onAction, 
  onPass, 
  onUndo, 
  onAllPassed, 
  currentTurnPlayerId, 
  passedPlayers, 
  usedStrategyCards, 
  actionLog,
  // Time limit mode props
  timeLimitMode,
  turnTimerPhase,
  turnTimerRemaining,
  turnTimerRunning,
  extensionsRemaining,
  alarmEnabled,
  onToggleTurnTimer,
  onExtendTurnTimer,
  onTurnTimerTimeUp,
  onFinishResolve,
  onStartEarly,
  onToggleAlarm
}) {
  const sortedPlayers = sortByInitiative(players);
  
  // Find the current player - if they've passed, find the next active player
  const findCurrentPlayer = () => {
    if (!currentTurnPlayerId) {
      // Start with first player in initiative order who hasn't passed
      return sortedPlayers.find(p => !passedPlayers.includes(p.id));
    }
    
    const currentIdx = sortedPlayers.findIndex(p => p.id === currentTurnPlayerId);
    if (currentIdx === -1) {
      return sortedPlayers.find(p => !passedPlayers.includes(p.id));
    }
    
    // If current player hasn't passed, it's their turn
    if (!passedPlayers.includes(currentTurnPlayerId)) {
      return sortedPlayers[currentIdx];
    }
    
    // Otherwise find the next non-passed player
    for (let i = 1; i <= sortedPlayers.length; i++) {
      const nextIdx = (currentIdx + i) % sortedPlayers.length;
      if (!passedPlayers.includes(sortedPlayers[nextIdx].id)) {
        return sortedPlayers[nextIdx];
      }
    }
    return null;
  };
  
  const currentPlayer = findCurrentPlayer();
  const hasUsedStrategy = currentPlayer ? usedStrategyCards.includes(currentPlayer.id) : false;
  const activePlayers = sortedPlayers.filter(p => !passedPlayers.includes(p.id));
  
  // Auto-advance to status phase when all players have passed
  useEffect(() => {
    if (activePlayers.length === 0 && onAllPassed) {
      const timer = setTimeout(() => {
        onAllPassed();
      }, 1500); // Small delay so users can see the completion message
      return () => clearTimeout(timer);
    }
  }, [activePlayers.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  if (activePlayers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏁</div>
        <h2 className="text-2xl font-bold text-white mb-2">Action Phase Complete</h2>
        <p className="text-slate-400">All players have passed. Proceeding to Status Phase...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Action Phase</h2>
        <p className="text-slate-300">
          Current turn: <span className="font-bold" style={{ color: currentPlayer?.color }}>
            {currentPlayer?.name}
          </span>
        </p>
      </div>
      
      {/* Initiative order display */}
      <div className="flex justify-center gap-2 flex-wrap">
        {sortedPlayers.map((player, idx) => {
          const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
          const isPassed = passedPlayers.includes(player.id);
          const isCurrent = player.id === currentPlayer?.id;
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isCurrent ? 'ring-2 ring-white scale-110' : ''
              } ${isPassed ? 'opacity-40 line-through' : ''}`}
              style={{ backgroundColor: `${faction?.color || player.color}88` }}
            >
              <span className="text-lg">{faction?.icon}</span>
              <span className="text-white font-medium text-sm">{player.name}</span>
              <span className="text-white/60 text-xs">({getEffectiveInitiative(player)})</span>
            </div>
          );
        })}
      </div>
      
      {/* Turn Timer (time limit mode) */}
      {timeLimitMode && turnTimerPhase && (
        <div className="flex justify-center mb-4">
          <TurnTimer
            phase={turnTimerPhase}
            remaining={turnTimerRemaining}
            isRunning={turnTimerRunning}
            extensionsRemaining={extensionsRemaining}
            alarmEnabled={alarmEnabled}
            onToggle={onToggleTurnTimer}
            onExtend={onExtendTurnTimer}
            onTimeUp={onTurnTimerTimeUp}
            onStartEarly={onStartEarly}
            onToggleAlarm={onToggleAlarm}
          />
        </div>
      )}
      
      {/* Prep phase message */}
      {timeLimitMode && turnTimerPhase === 'prep' && (
        <div className="text-center text-amber-300 mb-4">
          <p className="text-lg font-medium">🎯 Prep Time - Everyone get ready!</p>
          <p className="text-sm text-slate-400">Gather your command tokens, review your cards, plan your strategy</p>
        </div>
      )}
      
      {/* Action buttons */}
      {currentPlayer && (!timeLimitMode || turnTimerPhase !== 'prep') && (
        <div className="flex flex-wrap justify-center gap-3">
          {/* Resolve phase - show action being resolved and Done button */}
          {timeLimitMode && turnTimerPhase === 'resolve' ? (
            <div className="text-center">
              {/* Get the current action from the last log entry */}
              {(() => {
                const lastAction = actionLog.length > 0 ? actionLog[actionLog.length - 1] : null;
                const actionLabel = lastAction?.action === 'strategic' || lastAction?.action === 'strategic (auto)'
                  ? `📋 Strategic Action (${currentPlayer?.strategyCard?.name || 'Strategy Card'})`
                  : lastAction?.action === 'tactical' || lastAction?.action === 'tactical (auto)'
                    ? '⚔️ Tactical / Component Action'
                    : '⚡ Action';
                
                const isExpired = turnTimerRemaining <= 0 && !turnTimerRunning;
                
                return (
                  <>
                    <p className="text-purple-300 mb-2 text-lg font-medium">
                      Resolving: {actionLabel}
                    </p>
                    <p className="text-slate-400 mb-3">for {currentPlayer.name}</p>
                    
                    {isExpired && (
                      <div className="bg-red-900/50 border border-red-500 rounded-lg px-4 py-2 mb-3">
                        <p className="text-red-300 font-bold">⏰ Time Expired!</p>
                        <p className="text-red-400 text-sm">Finish resolving and click Done</p>
                      </div>
                    )}
                  </>
                );
              })()}
              <button
                onClick={onFinishResolve}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors font-bold"
              >
                ✓ Done - Next Player
              </button>
            </div>
          ) : (
            <>
              {/* Tactical / Component button */}
              <button
                onClick={() => onAction(currentPlayer.id, 'tactical')}
                className="px-6 py-3 text-white rounded-xl transition-colors flex items-center gap-2 hover:opacity-80"
                style={{ backgroundColor: '#334155' }}
              >
                <span className="text-xl">⚔️</span>
                <span className="font-medium">Tactical / Component</span>
              </button>
              
              {/* Strategic button - disabled if already used this round */}
              <button
                onClick={() => !hasUsedStrategy && onAction(currentPlayer.id, 'strategic')}
                disabled={hasUsedStrategy}
                className={`px-6 py-3 text-white rounded-xl transition-colors flex items-center gap-2 ${
                  hasUsedStrategy 
                    ? 'opacity-40 cursor-not-allowed line-through' 
                    : 'hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: currentPlayer?.strategyCard?.color || '#334155',
                }}
              >
                <span className="text-xl">📋</span>
                <span className="font-medium">
                  {currentPlayer?.strategyCard?.name || 'Strategic'}
                  {hasUsedStrategy && ' (Used)'}
                </span>
              </button>
              
              {/* Pass button - disabled if strategic action not used yet */}
              <button
                onClick={() => hasUsedStrategy && onPass(currentPlayer.id)}
                disabled={!hasUsedStrategy}
                className={`px-6 py-3 text-white rounded-xl transition-colors flex items-center gap-2 ${
                  hasUsedStrategy 
                    ? 'bg-red-900/50 hover:bg-red-800/50' 
                    : 'bg-slate-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-xl">🏳️</span>
                <span className="font-medium">
                  {hasUsedStrategy ? 'Pass' : 'Must use Strategy first'}
                </span>
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Undo button */}
      {actionLog && actionLog.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onUndo}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <span>↩️</span>
            <span>Undo Last Action</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Main App component
 function TI4ExtraComputer() {
  const [gameState, setGameState] = useState(() => getInitialState(STORAGE_KEY, INITIAL_STATE));
  const [resetKey, setResetKey] = useState(0);

  const [selectingFactionFor, setSelectingFactionFor] = useState(null);
  const timerRef = useRef(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // ignore if localStorage not available
    }
  }, [gameState]);

  // Clean up stale winner data on mount
  useEffect(() => {
    setGameState(prev => {
      if (prev.winner) {
        const winner = prev.players.find(p => p.id === prev.winner);
        if (!winner) {
          return { ...prev, winner: null };
        }
      }
      return prev;
    });
  }, []); // Only run on mount

  // Timer effect
  useEffect(() => {
    if (gameState.timerRunning) {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({ ...prev, timerElapsed: prev.timerElapsed + 1000 }));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState.timerRunning]);

  const toggleTimer = useCallback(() => {
    setGameState(prev => ({ ...prev, timerRunning: !prev.timerRunning }));
  }, []);

  const initializePlayers = useCallback((count) => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      color: PLAYER_COLORS[i],
      factionId: null,
      vp: 0,
      strategyCard: null,
      isSpeaker: i === 0,
      timer: 0,
    }));
    // Initialize per-player extensions (6 each)
    const playerExtensions = {};
    players.forEach(p => {
      playerExtensions[p.id] = 6;
    });
    setGameState(prev => ({ ...prev, players, playerCount: count, playerExtensions }));
  }, []);

  const updatePlayer = useCallback((playerId, updates) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const handleVPChange = useCallback((playerId, delta) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId 
          ? { ...p, vp: Math.max(0, Math.min(prev.maxVP, p.vp + delta)) }
          : p
      ),
    }));
  }, []);

  const handleSpeakerToggle = useCallback((playerId) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => ({
        ...p,
        isSpeaker: p.id === playerId,
      })),
    }));
  }, []);

  const handleFactionSelect = useCallback((faction) => {
    if (!selectingFactionFor) return;
    updatePlayer(selectingFactionFor.id, { factionId: faction.id });
    setSelectingFactionFor(null);
  }, [selectingFactionFor, updatePlayer]);

  const handleStrategyCardSelect = useCallback((playerId, card) => {
    updatePlayer(playerId, { strategyCard: card });
  }, [updatePlayer]);

  // Helper to find the next player in initiative order
  const getNextPlayerId = useCallback((currentPlayerId, passedPlayersList) => {
    const sortedPlayers = sortByInitiative(gameState.players);
    const currentIdx = sortedPlayers.findIndex(p => p.id === currentPlayerId);
    
    for (let i = 1; i <= sortedPlayers.length; i++) {
      const nextIdx = (currentIdx + i) % sortedPlayers.length;
      if (!passedPlayersList.includes(sortedPlayers[nextIdx].id)) {
        return sortedPlayers[nextIdx].id;
      }
    }
    return null;
  }, [gameState.players]);

  const handleAction = useCallback((playerId, actionType) => {
    const player = gameState.players.find(p => p.id === playerId);
    setGameState(prev => {
      const newState = {
        ...prev,
        // Don't change currentTurnPlayerId yet - we're still on this player during resolve
        actionLog: [...prev.actionLog, {
          player: player.name,
          playerId: playerId,
          action: actionType,
          time: Date.now(),
          previousState: {
            currentTurnPlayerId: prev.currentTurnPlayerId,
            passedPlayers: [...prev.passedPlayers],
            usedStrategyCards: [...prev.usedStrategyCards],
            turnTimerPhase: prev.turnTimerPhase,
            turnTimerRemaining: prev.turnTimerRemaining,
            turnTimerRunning: prev.turnTimerRunning,
          },
        }],
      };
      
      // If strategic action, mark this player's strategy card as used
      if (actionType === 'strategic') {
        newState.usedStrategyCards = [...prev.usedStrategyCards, playerId];
      }
      
      // In time limit mode, start the resolve timer
      if (prev.timeLimitMode) {
        newState.turnTimerPhase = 'resolve';
        newState.turnTimerRemaining = TIME_LIMITS.resolve;
        newState.turnTimerRunning = true;
      } else {
        // Not in time limit mode - immediately go to next player
        newState.currentTurnPlayerId = getNextPlayerId(playerId, prev.passedPlayers);
      }
      
      return newState;
    });
  }, [gameState.players, getNextPlayerId]);

  const handleUndo = useCallback(() => {
    setGameState(prev => {
      if (prev.actionLog.length === 0) return prev;
      
      const lastAction = prev.actionLog[prev.actionLog.length - 1];
      const newActionLog = prev.actionLog.slice(0, -1);
      
      if (lastAction.previousState) {
        const restoredState = {
          ...prev,
          currentTurnPlayerId: lastAction.previousState.currentTurnPlayerId,
          passedPlayers: lastAction.previousState.passedPlayers,
          usedStrategyCards: lastAction.previousState.usedStrategyCards,
          actionLog: newActionLog,
        };
        
        // Restore timer state if in time limit mode
        if (prev.timeLimitMode) {
          restoredState.turnTimerPhase = lastAction.previousState.turnTimerPhase || 'initiate';
          restoredState.turnTimerRemaining = lastAction.previousState.turnTimerRemaining || TIME_LIMITS.initiate;
          restoredState.turnTimerRunning = lastAction.previousState.turnTimerRunning !== undefined 
            ? lastAction.previousState.turnTimerRunning 
            : true;
        }
        
        return restoredState;
      }
      
      return {
        ...prev,
        actionLog: newActionLog,
      };
    });
  }, []);

  const handlePass = useCallback((playerId) => {
    const player = gameState.players.find(p => p.id === playerId);
    setGameState(prev => {
      const newPassedPlayers = [...prev.passedPlayers, playerId];
      const nextPlayerId = getNextPlayerId(playerId, newPassedPlayers);
      
      const newState = {
        ...prev,
        passedPlayers: newPassedPlayers,
        currentTurnPlayerId: nextPlayerId,
        actionLog: [...prev.actionLog, {
          player: player.name,
          playerId: playerId,
          action: 'pass',
          time: Date.now(),
          previousState: {
            currentTurnPlayerId: prev.currentTurnPlayerId,
            passedPlayers: [...prev.passedPlayers],
            usedStrategyCards: [...prev.usedStrategyCards],
            turnTimerPhase: prev.turnTimerPhase,
            turnTimerRemaining: prev.turnTimerRemaining,
            turnTimerRunning: prev.turnTimerRunning,
          },
        }],
      };
      
      // In time limit mode, start next player's initiate timer (or stop if no more players)
      if (prev.timeLimitMode) {
        if (nextPlayerId) {
          newState.turnTimerPhase = 'initiate';
          newState.turnTimerRemaining = TIME_LIMITS.initiate;
          newState.turnTimerRunning = true;
        } else {
          newState.turnTimerPhase = null;
          newState.turnTimerRemaining = 0;
          newState.turnTimerRunning = false;
        }
      }
      
      return newState;
    });
  }, [gameState.players, getNextPlayerId]);

  const advancePhase = useCallback(() => {
    const currentIndex = PHASES.indexOf(gameState.phase);
    const nextPhase = PHASES[(currentIndex + 1) % PHASES.length];
    
    if (nextPhase === 'strategy') {
      // Reset strategy cards
      setGameState(prev => ({
        ...prev,
        phase: nextPhase,
        players: prev.players.map(p => ({ ...p, strategyCard: null })),
        passedPlayers: [],
        usedStrategyCards: [],
        currentTurnPlayerId: null,
        actionLog: [],
        turnTimerPhase: null,
        turnTimerRemaining: 0,
        turnTimerRunning: false,
      }));
    } else if (nextPhase === 'setup') {
      // New round
      setGameState(prev => ({
        ...prev,
        phase: 'strategy',
        round: prev.round + 1,
        players: prev.players.map(p => ({ ...p, strategyCard: null })),
        passedPlayers: [],
        usedStrategyCards: [],
        currentTurnPlayerId: null,
        actionLog: [],
        turnTimerPhase: null,
        turnTimerRemaining: 0,
        turnTimerRunning: false,
        // Note: playerExtensions persist across rounds - they're for the entire game
      }));
    } else if (nextPhase === 'action') {
      // Going to action phase - start prep timer if time limit mode
      setGameState(prev => {
        const newState = { ...prev, phase: nextPhase };
        if (prev.timeLimitMode) {
          newState.turnTimerPhase = 'prep';
          newState.turnTimerRemaining = TIME_LIMITS.prep;
          newState.turnTimerRunning = true;
        }
        return newState;
      });
    } else {
      setGameState(prev => ({ ...prev, phase: nextPhase }));
    }
  }, [gameState.phase]);

  // Skip to next player (used when done resolving early in time limit mode)
  const finishResolve = useCallback(() => {
    setGameState(prev => {
      if (prev.turnTimerPhase !== 'resolve') return prev;
      
      const nextPlayerId = getNextPlayerId(prev.currentTurnPlayerId, prev.passedPlayers);
      
      return {
        ...prev,
        currentTurnPlayerId: nextPlayerId,
        turnTimerPhase: nextPlayerId ? 'initiate' : null,
        turnTimerRemaining: nextPlayerId ? TIME_LIMITS.initiate : 0,
        turnTimerRunning: !!nextPlayerId,
      };
    });
  }, [getNextPlayerId]);

  // Confirm victory for a player
  const confirmVictory = useCallback((playerId) => {
    setGameState(prev => ({
      ...prev,
      winner: playerId,
      timerRunning: false,
      turnTimerRunning: false,
    }));
  }, []);

  // Turn timer handlers
  const startTurnTimer = useCallback((phase) => {
    setGameState(prev => ({
      ...prev,
      turnTimerPhase: phase,
      turnTimerRemaining: TIME_LIMITS[phase],
      turnTimerRunning: true,
    }));
  }, []);

  const toggleTurnTimer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      turnTimerRunning: !prev.turnTimerRunning,
    }));
  }, []);

  const extendTurnTimer = useCallback(() => {
    setGameState(prev => {
      const currentPlayerId = prev.currentTurnPlayerId;
      if (!currentPlayerId || !prev.playerExtensions) return prev;
      
      const playerExtCount = prev.playerExtensions[currentPlayerId] || 0;
      if (playerExtCount <= 0) return prev;
      
      return {
        ...prev,
        turnTimerRemaining: prev.turnTimerRemaining + TIME_LIMITS.extension,
        turnTimerRunning: true, // Restart timer if it was stopped
        playerExtensions: {
          ...prev.playerExtensions,
          [currentPlayerId]: playerExtCount - 1,
        },
      };
    });
  }, []);

  // Start first player's turn early (skip prep time)
  const startPrepEarly = useCallback(() => {
    setGameState(prev => {
      if (prev.turnTimerPhase !== 'prep') return prev;
      
      const sortedPlayers = sortByInitiative(prev.players);
      const firstPlayer = sortedPlayers.find(p => !prev.passedPlayers.includes(p.id));
      
      return {
        ...prev,
        turnTimerPhase: 'initiate',
        turnTimerRemaining: TIME_LIMITS.initiate,
        turnTimerRunning: true,
        currentTurnPlayerId: firstPlayer?.id || null,
      };
    });
  }, []);

  const handleTurnTimerTimeUp = useCallback(() => {
    setGameState(prev => {
      // Handle what happens when time runs out based on current phase
      if (prev.turnTimerPhase === 'prep') {
        // Prep time over, start first player's initiate timer
        const sortedPlayers = sortByInitiative(prev.players);
        const firstPlayer = sortedPlayers.find(p => !prev.passedPlayers.includes(p.id));
        return {
          ...prev,
          turnTimerPhase: 'initiate',
          turnTimerRemaining: TIME_LIMITS.initiate,
          turnTimerRunning: true,
          currentTurnPlayerId: firstPlayer?.id || null,
        };
      }
      
      if (prev.turnTimerPhase === 'initiate') {
        // Time to initiate ran out - auto play tactical/component action
        const currentPlayer = prev.players.find(p => p.id === prev.currentTurnPlayerId);
        if (!currentPlayer) return prev;
        
        // Auto-play tactical/component action - stay on current player for resolve phase
        return {
          ...prev,
          // Keep currentTurnPlayerId the same - it's still this player's turn during resolve
          turnTimerPhase: 'resolve',
          turnTimerRemaining: TIME_LIMITS.resolve,
          turnTimerRunning: true,
          actionLog: [...prev.actionLog, {
            player: currentPlayer.name,
            playerId: currentPlayer.id,
            action: 'tactical (auto)',
            time: Date.now(),
            previousState: {
              currentTurnPlayerId: prev.currentTurnPlayerId,
              passedPlayers: [...prev.passedPlayers],
              usedStrategyCards: [...prev.usedStrategyCards],
              turnTimerPhase: prev.turnTimerPhase,
              turnTimerRemaining: prev.turnTimerRemaining,
              turnTimerRunning: prev.turnTimerRunning,
            },
          }],
        };
      }
      
      if (prev.turnTimerPhase === 'resolve') {
        // Resolve time over - just stop the timer, don't auto-advance
        // User must click "Done" to proceed
        return {
          ...prev,
          turnTimerRunning: false,
          turnTimerRemaining: 0,
          // Keep turnTimerPhase as 'resolve' so the UI shows time expired
        };
      }
      
      return prev;
    });
  }, []);

  // Check for potential winners (players at or above maxVP)
  const potentialWinners = gameState.players.filter(p => p.vp >= gameState.maxVP);

  const resetGame = useCallback(() => {
    // Clear the timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const freshState = {
      phase: 'setup',
      playerCount: 6,
      players: [],
      round: 1,
      maxVP: 10,
      expansions: { base: true, pok: true, codex: true, thundersEdge: true },
      currentTurnPlayerId: null,
      passedPlayers: [],
      usedStrategyCards: [],
      timerElapsed: 0,
      timerRunning: false,
      actionLog: [],
      winner: null,
      timeLimitMode: false,
      turnTimerPhase: null,
      turnTimerRemaining: 0,
      turnTimerRunning: false,
      playerExtensions: {},
      alarmEnabled: true,
    };
    
    // Write fresh state directly to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
    } catch {
      // ignore
    }
    
    // Set fresh state in React
    setGameState(freshState);
    
    // Force re-render
    setResetKey(k => k + 1);
  }, []);

  const usedFactions = gameState.players.filter(p => p.factionId).map(p => p.factionId);

  // Victory screen
  if (gameState.winner) {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    if (winner) {
      return (
        <VictoryScreen
          winner={winner}
          players={gameState.players}
          round={gameState.round}
          elapsed={gameState.timerElapsed}
          onNewGame={resetGame}
        />
      );
    }
    // If winner ID exists but player not found, don't render victory screen
    // This can happen if localStorage has stale data
  }

  // Setup phase
  if (gameState.phase === 'setup') {
    return (
      <div key={`setup-${resetKey}`} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              TI4 EXTRA COMPUTER
            </h1>
            <p className="text-slate-400">Twilight Imperium 4th Edition Game Assistant</p>
            <p className="text-slate-500 text-sm mt-1">Including Thunder's Edge Expansion (v7)</p>
          </div>

          {/* Player count selection */}
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Number of Players</h2>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => initializePlayers(n)}
                  className={`w-14 h-14 rounded-xl font-bold text-xl transition-all ${
                    gameState.playerCount === n && gameState.players.length === n
                      ? 'bg-blue-600 text-white scale-110'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Expansion toggles */}
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Expansions</h2>
            <div className="flex gap-3 flex-wrap">
              {[
                { key: 'base', label: 'Base Game', count: FACTIONS.base.length },
                { key: 'pok', label: 'Prophecy of Kings', count: FACTIONS.pok.length },
                { key: 'codex', label: 'Codex', count: FACTIONS.codex.length },
                { key: 'thundersEdge', label: "Thunder's Edge", count: FACTIONS.thundersEdge.length },
              ].map(exp => (
                <button
                  key={exp.key}
                  onClick={() => setGameState(prev => ({
                    ...prev,
                    expansions: { ...prev.expansions, [exp.key]: !prev.expansions[exp.key] }
                  }))}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    gameState.expansions[exp.key]
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <span>{gameState.expansions[exp.key] ? '✓' : '○'}</span>
                  <span>{exp.label}</span>
                  <span className="text-xs opacity-60">({exp.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max VP selection */}
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Victory Points to Win</h2>
            <div className="flex gap-2 flex-wrap">
              {[10, 12, 14].map(vp => (
                <button
                  key={vp}
                  onClick={() => setGameState(prev => ({ ...prev, maxVP: vp }))}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    gameState.maxVP === vp
                      ? 'bg-amber-600 text-white scale-105'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {vp} VP
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit Mode */}
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">⏱️ Time Limit Mode</h2>
                <p className="text-slate-400 text-sm">Adds turn timers for faster gameplay</p>
              </div>
              <button
                onClick={() => setGameState(prev => ({ ...prev, timeLimitMode: !prev.timeLimitMode }))}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  gameState.timeLimitMode ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <div 
                  className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${
                    gameState.timeLimitMode ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
            
            {gameState.timeLimitMode && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-blue-400">🎯</span>
                    <span><strong>2 min</strong> prep after strategy phase (can start early)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-green-400">⏱️</span>
                    <span><strong>60 sec</strong> to initiate action (or auto-use strategy/pass)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-purple-400">⚡</span>
                    <span><strong>90 sec</strong> to resolve your action</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-amber-400">🎫</span>
                    <span><strong>6 extensions per player</strong> (+2 min each)</span>
                  </div>
                </div>
                
                {/* Alarm toggle */}
                <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔔</span>
                    <span className="text-slate-300">Play alarm when timer expires</span>
                  </div>
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, alarmEnabled: !prev.alarmEnabled }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      gameState.alarmEnabled !== false ? 'bg-green-600' : 'bg-slate-600'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                        gameState.alarmEnabled !== false ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Player setup */}
          {gameState.players.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Players</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.players.map((player, idx) => {
                  const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: player.color }}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                        className="flex-1 bg-slate-600 rounded-lg px-3 py-2 text-white"
                        placeholder="Player name"
                      />
                      <button
                        onClick={() => setSelectingFactionFor(player)}
                        className="px-3 py-2 rounded-lg transition-all flex items-center gap-2 min-w-40"
                        style={{ 
                          backgroundColor: faction ? `${faction.color}88` : '#475569',
                        }}
                      >
                        {faction ? (
                          <>
                            <span>{faction.icon}</span>
                            <span className="text-white text-sm truncate">{faction.name}</span>
                          </>
                        ) : (
                          <span className="text-slate-300">Select Faction</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start game button */}
          {gameState.players.length > 0 && gameState.players.every(p => p.factionId) && (
            <button
              onClick={() => setGameState(prev => ({ ...prev, phase: 'strategy' }))}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-green-900/50"
            >
              Start Game →
            </button>
          )}

          {/* Load saved game notice */}
          {gameState.players.length === 0 && (
            <div className="text-center text-slate-500 mt-8">
              <p>Select the number of players to begin</p>
              <p className="text-sm mt-2">Game state is automatically saved to your browser</p>
            </div>
          )}
        </div>

        {/* Faction selector modal */}
        {selectingFactionFor && (
          <FactionSelector
            player={selectingFactionFor}
            onSelect={handleFactionSelect}
            onClose={() => setSelectingFactionFor(null)}
            usedFactions={usedFactions}
            expansions={gameState.expansions}
          />
        )}
      </div>
    );
  }

  // Game in progress
  return (
    <div key={`game-${resetKey}`} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top bar */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              TI4
            </h1>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">Round</span>
              <span className="text-white font-bold text-lg">{gameState.round}</span>
            </div>
            <div className="px-3 py-1 bg-slate-700 rounded-full text-sm capitalize">
              {gameState.phase} Phase
            </div>
            {gameState.timeLimitMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/50 rounded-full text-sm">
                <span>⏱️</span>
                <span className="text-purple-300">Time Limit</span>
                {gameState.currentTurnPlayerId && gameState.phase === 'action' && gameState.playerExtensions && (
                  <span className="text-amber-300 font-bold">
                    🎫 {gameState.playerExtensions[gameState.currentTurnPlayerId] || 0}
                  </span>
                )}
                {/* Alarm toggle */}
                <button
                  onClick={() => setGameState(prev => ({ ...prev, alarmEnabled: !prev.alarmEnabled }))}
                  className={`ml-2 px-2 py-0.5 rounded text-xs transition-colors ${
                    gameState.alarmEnabled !== false
                      ? 'bg-green-600/50 text-green-200'
                      : 'bg-slate-600/50 text-slate-400'
                  }`}
                  title={gameState.alarmEnabled !== false ? 'Alarm ON - Click to mute' : 'Alarm OFF - Click to enable'}
                >
                  {gameState.alarmEnabled !== false ? '🔔' : '🔕'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Timer
              isRunning={gameState.timerRunning}
              elapsed={gameState.timerElapsed}
              onToggle={toggleTimer}
            />
            <button
              type="button"
              onClick={() => resetGame()}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-800/50 rounded-lg text-sm text-red-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Victory confirmation banner */}
      {potentialWinners.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600/90 to-yellow-600/90 border-b border-yellow-500">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <span className="text-white font-bold">
                  {potentialWinners.length === 1 
                    ? `${potentialWinners[0].name} has reached ${gameState.maxVP} VP!`
                    : `${potentialWinners.map(p => p.name).join(' & ')} have reached ${gameState.maxVP} VP!`
                  }
                </span>
              </div>
              <div className="flex gap-2">
                {potentialWinners.map(player => {
                  const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
                  return (
                    <button
                      key={player.id}
                      onClick={() => confirmVictory(player.id)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition-colors flex items-center gap-2"
                    >
                      <span>{faction?.icon}</span>
                      <span>Confirm {player.name}'s Victory</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Player cards - order depends on phase */}
        {(() => {
          const sortedByInitiative = sortByInitiative(gameState.players);
          
          // Get speaker order (starting from speaker, then clockwise by seat)
          const getSpeakerOrder = () => {
            const speakerIndex = gameState.players.findIndex(p => p.isSpeaker);
            const ordered = [];
            for (let i = 0; i < gameState.players.length; i++) {
              ordered.push(gameState.players[(speakerIndex + i) % gameState.players.length]);
            }
            return ordered;
          };
          
          // Determine display order based on phase
          let displayPlayers;
          if (gameState.phase === 'action' || gameState.phase === 'status') {
            displayPlayers = sortedByInitiative;
          } else if (gameState.phase === 'strategy' || gameState.phase === 'agenda') {
            displayPlayers = getSpeakerOrder();
          } else {
            displayPlayers = gameState.players;
          }
          
          // Find current active player (only relevant during action phase)
          const findCurrentPlayer = () => {
            const activePlayers = sortedByInitiative.filter(p => !gameState.passedPlayers.includes(p.id));
            if (activePlayers.length === 0) return null;
            
            if (!gameState.currentTurnPlayerId) {
              return activePlayers[0];
            }
            
            const currentIdx = sortedByInitiative.findIndex(p => p.id === gameState.currentTurnPlayerId);
            if (currentIdx === -1 || !gameState.passedPlayers.includes(gameState.currentTurnPlayerId)) {
              return sortedByInitiative.find(p => p.id === gameState.currentTurnPlayerId);
            }
            
            // Find next non-passed player
            for (let i = 1; i <= sortedByInitiative.length; i++) {
              const nextIdx = (currentIdx + i) % sortedByInitiative.length;
              if (!gameState.passedPlayers.includes(sortedByInitiative[nextIdx].id)) {
                return sortedByInitiative[nextIdx];
              }
            }
            return null;
          };
          
          const currentActivePlayer = findCurrentPlayer();
          
          return (
            <div className={`grid gap-3 mb-6 ${
              gameState.players.length <= 4 
                ? 'grid-cols-2 md:grid-cols-4' 
                : gameState.players.length <= 6
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8'
            }`}>
              {displayPlayers.map((player, idx) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isActive={gameState.phase === 'action' && 
                    !gameState.passedPlayers.includes(player.id) &&
                    player.id === currentActivePlayer?.id
                  }
                  onVPChange={handleVPChange}
                  onSpeakerToggle={handleSpeakerToggle}
                  compact={gameState.players.length > 6}
                />
              ))}
            </div>
          );
        })()}

        {/* Phase-specific content */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          {gameState.phase === 'strategy' && (
            <StrategyPhase
              players={gameState.players}
              onCardSelect={handleStrategyCardSelect}
              onComplete={() => setGameState(prev => {
                const newState = { ...prev, phase: 'action' };
                if (prev.timeLimitMode) {
                  newState.turnTimerPhase = 'prep';
                  newState.turnTimerRemaining = TIME_LIMITS.prep;
                  newState.turnTimerRunning = true;
                }
                return newState;
              })}
              strategyCards={STRATEGY_CARDS}
            />
          )}
          
          {gameState.phase === 'action' && (
            <ActionPhase
              players={gameState.players}
              onAction={handleAction}
              onPass={handlePass}
              onUndo={handleUndo}
              onAllPassed={() => setGameState(prev => ({ 
                ...prev, 
                phase: 'status',
                turnTimerPhase: null,
                turnTimerRemaining: 0,
                turnTimerRunning: false,
              }))}
              currentTurnPlayerId={gameState.currentTurnPlayerId}
              passedPlayers={gameState.passedPlayers}
              usedStrategyCards={gameState.usedStrategyCards || []}
              actionLog={gameState.actionLog}
              // Time limit props
              timeLimitMode={gameState.timeLimitMode}
              turnTimerPhase={gameState.turnTimerPhase}
              turnTimerRemaining={gameState.turnTimerRemaining}
              turnTimerRunning={gameState.turnTimerRunning}
              extensionsRemaining={gameState.currentTurnPlayerId && gameState.playerExtensions ? (gameState.playerExtensions[gameState.currentTurnPlayerId] || 0) : 0}
              alarmEnabled={gameState.alarmEnabled !== false}
              onToggleTurnTimer={toggleTurnTimer}
              onExtendTurnTimer={extendTurnTimer}
              onTurnTimerTimeUp={handleTurnTimerTimeUp}
              onFinishResolve={finishResolve}
              onStartEarly={startPrepEarly}
              onToggleAlarm={() => setGameState(prev => ({ ...prev, alarmEnabled: !prev.alarmEnabled }))}
            />
          )}
          
          {gameState.phase === 'status' && (
            <div className="py-4">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Status Phase</h2>
              
              {/* Initiative order display */}
              <div className="flex justify-center gap-2 flex-wrap mb-6">
                {sortByInitiative(gameState.players).map((player, idx) => {
                  const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: `${faction?.color || player.color}88` }}
                    >
                      <span className="text-lg">{faction?.icon}</span>
                      <span className="text-white font-medium text-sm">{player.name}</span>
                      <span className="text-white/60 text-xs">({getEffectiveInitiative(player)})</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="max-w-2xl mx-auto space-y-3">
                {[
                  { num: 1, text: 'Score 1 public and/or 1 secret objective' },
                  { num: 2, text: 'Flip next public objective' },
                  { num: 3, text: 'Draw 1 action card' },
                  { num: 4, text: 'Return Command Tokens' },
                  { num: 5, text: 'Gain 2 Command Tokens and redistribute' },
                  { num: 6, text: 'Ready all cards' },
                  { num: 7, text: 'Repair units' },
                  { num: 8, text: 'Return Strategies' },
                ].map(step => (
                  <div 
                    key={step.num}
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50 border border-slate-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {step.num}
                    </div>
                    <span className="text-white font-medium">{step.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6">
                <button
                  onClick={advancePhase}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                >
                  Continue to Agenda Phase →
                </button>
              </div>
            </div>
          )}
          
          {gameState.phase === 'agenda' && (
            <div className="py-4">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Agenda Phase</h2>
              <p className="text-slate-400 mb-6 text-center">
                Resolve 2 agenda cards. Voting order starts from Speaker.
              </p>
              
              {/* Voting order display */}
              <div className="flex justify-center gap-2 flex-wrap mb-6">
                {(() => {
                  const speakerIndex = gameState.players.findIndex(p => p.isSpeaker);
                  const votingOrder = [];
                  // Voting starts with the player AFTER the speaker
                  for (let i = 1; i <= gameState.players.length; i++) {
                    votingOrder.push(gameState.players[(speakerIndex + i) % gameState.players.length]);
                  }
                  return votingOrder.map((player, idx) => {
                    const faction = ALL_FACTIONS.find(f => f.id === player.factionId);
                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: `${faction?.color || player.color}88` }}
                      >
                        <span className="text-white/60 text-xs font-bold">{idx + 1}.</span>
                        <span className="text-lg">{faction?.icon}</span>
                        <span className="text-white font-medium text-sm">{player.name}</span>
                        {player.isSpeaker && <span className="text-xs">🎤</span>}
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={advancePhase}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                >
                  End Round →
                </button>
              </div>
            </div>
          )}
          
          {gameState.phase === 'results' && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-white mb-4">Round Complete</h2>
              <p className="text-slate-400 mb-6">
                Round {gameState.round} is complete. Ready for the next round?
              </p>
              <button
                onClick={advancePhase}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
              >
                Begin Round {gameState.round + 1} →
              </button>
            </div>
          )}
        </div>

        {/* Quick phase navigation - only backwards allowed */}
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          {(() => {
            const phaseOrder = ['strategy', 'action', 'status', 'agenda'];
            const currentPhaseIndex = phaseOrder.indexOf(gameState.phase);
            
            return phaseOrder.map((phase, idx) => {
              const canNavigate = idx < currentPhaseIndex; // Only allow going backwards
              const isCurrent = gameState.phase === phase;
              
              return (
                <button
                  key={phase}
                  onClick={() => canNavigate && setGameState(prev => {
                    const newState = { 
                      ...prev, 
                      phase,
                    };
                    if (phase === 'action') {
                      newState.currentTurnPlayerId = null;
                      newState.passedPlayers = [];
                      newState.usedStrategyCards = [];
                      // Reset timer for action phase
                      if (prev.timeLimitMode) {
                        newState.turnTimerPhase = 'prep';
                        newState.turnTimerRemaining = TIME_LIMITS.prep;
                        newState.turnTimerRunning = true;
                      }
                    } else {
                      // Clear timer when going to non-action phases
                      newState.turnTimerPhase = null;
                      newState.turnTimerRemaining = 0;
                      newState.turnTimerRunning = false;
                    }
                    return newState;
                  })}
                  disabled={!canNavigate && !isCurrent}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : canNavigate
                        ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 cursor-pointer'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {phase}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Faction selector modal */}
      {selectingFactionFor && (
        <FactionSelector
          player={selectingFactionFor}
          onSelect={handleFactionSelect}
          onClose={() => setSelectingFactionFor(null)}
          usedFactions={usedFactions}
          expansions={gameState.expansions}
        />
      )}
    </div>
  );
}


