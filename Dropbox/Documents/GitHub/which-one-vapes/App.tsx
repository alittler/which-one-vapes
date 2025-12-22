
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_CANDIDATES } from './constants';
import { Candidate, GlobalVotes } from './types';
import { Trophy, Wind, Zap, Home, Mail, Construction, Settings, Download, Search } from 'lucide-react';

const VAPE_REASONINGS = [
  "Scanners detect a 99% probability of 'Blue Razz' scent molecules.",
  "Atmospheric sensors show a localized fog bank moving with this subject.",
  "Digital fingerprinting suggests a high frequency of USB-C charging activity.",
  "Subject's pulse matches the rhythmic flickering of a low-battery LED.",
  "Thermal imaging reveals a suspiciously warm pocket area.",
  "Acoustic analysis detected a faint 'pffft' sound during the last 5 seconds.",
  "High levels of vegetable glycerin detected in the immediate airspace.",
  "Subject possesses the distinct aura of someone who knows what a 'coil' is.",
  "Neural network identifies a 'cloud-chaser' pattern in subject's respiration.",
  "Detected hidden stash of 'Cotton Bacon' in secondary pocket."
];

const App: React.FC = () => {
  const [pair, setPair] = useState<[Candidate, Candidate]>([INITIAL_CANDIDATES[0], INITIAL_CANDIDATES[1]]);
  const [votes, setVotes] = useState<GlobalVotes>({});
  const [view, setView] = useState<'vote' | 'leaderboard' | 'admin'>('vote');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hitCount, setHitCount] = useState(133742);
  
  // Local Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentVerdict, setCurrentVerdict] = useState<{ leader: string, reason: string } | null>(null);

  // Load/Init votes
  useEffect(() => {
    const saved = localStorage.getItem('vape-votes-comparison');
    if (saved) {
      setVotes(JSON.parse(saved));
    } else {
      const initial: GlobalVotes = {};
      INITIAL_CANDIDATES.forEach(c => {
        initial[c.id] = { chosenCount: Math.floor(Math.random() * 50), totalAppearances: 100 };
      });
      setVotes(initial);
    }
    setHitCount(prev => prev + Math.floor(Math.random() * 100));
  }, []);

  const generateNewPair = useCallback(() => {
    let i1 = Math.floor(Math.random() * INITIAL_CANDIDATES.length);
    let i2 = Math.floor(Math.random() * INITIAL_CANDIDATES.length);
    while (i1 === i2) {
      i2 = Math.floor(Math.random() * INITIAL_CANDIDATES.length);
    }
    setPair([INITIAL_CANDIDATES[i1], INITIAL_CANDIDATES[i2]]);
    setIsTransitioning(false);
    setCurrentVerdict(null);
    setAnalysisProgress(0);
  }, []);

  const runAnalysis = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentVerdict(null);
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15;
      if (prog >= 100) {
        clearInterval(interval);
        setAnalysisProgress(100);
        setIsAnalyzing(false);
        
        // Calculate verdict locally using baseVapeScore for "accuracy"
        const [c1, c2] = pair;
        const leader = c1.baseVapeScore > c2.baseVapeScore ? c1.name : c2.name;
        const reason = VAPE_REASONINGS[Math.floor(Math.random() * VAPE_REASONINGS.length)];
        setCurrentVerdict({ leader, reason });
      } else {
        setAnalysisProgress(prog);
      }
    }, 120);
  };

  const handleVote = useCallback((winnerId: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newVotes = { ...votes };
    const winnerStats = newVotes[winnerId] || { chosenCount: 0, totalAppearances: 0 };
    newVotes[winnerId] = {
      chosenCount: winnerStats.chosenCount + 1,
      totalAppearances: winnerStats.totalAppearances + 1
    };

    const loserId = pair[0].id === winnerId ? pair[1].id : pair[0].id;
    const loserStats = newVotes[loserId] || { chosenCount: 0, totalAppearances: 0 };
    newVotes[loserId] = {
      ...loserStats,
      totalAppearances: loserStats.totalAppearances + 1
    };

    setVotes(newVotes);
    localStorage.setItem('vape-votes-comparison', JSON.stringify(newVotes));

    setTimeout(() => {
      generateNewPair();
    }, 250);
  }, [pair, votes, isTransitioning, generateNewPair]);

  const getVapeRate = (id: string) => {
    const v = votes[id] || { chosenCount: 0, totalAppearances: 0 };
    if (v.totalAppearances === 0) return 0;
    return Math.round((v.chosenCount / v.totalAppearances) * 100);
  };

  const sortedCandidates = useMemo(() => {
    return [...INITIAL_CANDIDATES].sort((a, b) => getVapeRate(b.id) - getVapeRate(a.id));
  }, [votes]);

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ votes, candidates: INITIAL_CANDIDATES }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "vape_db_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Top Banner Area */}
      <header className="w-full max-w-4xl mt-1 md:mt-4">
        <div className="win95-card mb-2 md:mb-4">
          <div className="win95-header text-[10px] md:text-sm">
            <span className="truncate">Microsoft Internet Explorer - [WHICH_ONE_VAPES.HTM]</span>
            <div className="flex gap-1 shrink-0">
              <div className="win95-button py-0 px-1 md:px-2 text-[10px]">_</div>
              <div className="win95-button py-0 px-1 md:px-2 text-[10px]">□</div>
              <div className="win95-button py-0 px-1 md:px-2 text-[10px] bg-red-400">X</div>
            </div>
          </div>
          <div className="p-2 md:p-4 bg-gray-200 flex flex-col items-center text-center">
             <h1 className="text-xl md:text-4xl font-black mb-1 md:mb-2 italic text-blue-800" style={{ textShadow: '1px 1px #fff' }}>
                <span className="text-red-600">***</span> WHICH ONE VAPES? <span className="text-red-600">***</span>
             </h1>
             <div className="bg-black w-full py-0.5 text-xs md:text-base overflow-hidden relative h-6 md:h-8 flex items-center">
                <div className="absolute whitespace-nowrap text-white" style={{ animation: 'retro-marquee 15s linear infinite' }}>
                   WELCOME TO THE ULTIMATE VAPE SHOWDOWN -- NOW WITH 100% LOCAL PROCESSING -- VOTE NOW!! &nbsp;&nbsp;&nbsp;&nbsp;
                   WELCOME TO THE ULTIMATE VAPE SHOWDOWN -- NOW WITH 100% LOCAL PROCESSING -- VOTE NOW!!
                </div>
                <style>{`
                  @keyframes retro-marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                  }
                `}</style>
             </div>
          </div>
        </div>

        {/* Navigation Toolbar */}
        <div className="win95-card flex gap-1 md:gap-2 p-1 mb-4 md:mb-6">
          <button onClick={() => setView('vote')} className={`win95-button flex items-center gap-1 text-xs md:text-sm ${view === 'vote' ? 'win95-inset' : ''}`}>
            <Home size={14} className="md:w-4 md:h-4" /> <u>V</u>ote
          </button>
          <button onClick={() => setView('leaderboard')} className={`win95-button flex items-center gap-1 text-xs md:text-sm ${view === 'leaderboard' ? 'win95-inset' : ''}`}>
            <Trophy size={14} className="md:w-4 md:h-4" /> <u>L</u>eader
          </button>
          <button onClick={() => setView('admin')} className={`win95-button flex items-center gap-1 text-xs md:text-sm ${view === 'admin' ? 'win95-inset' : ''}`}>
            <Settings size={14} className="md:w-4 md:h-4" /> <u>A</u>dmin
          </button>
          <div className="flex-1"></div>
           <div className="win95-inset px-2 md:px-4 flex items-center text-[8px] md:text-xs font-mono truncate max-w-[120px] md:max-w-none">
             URL: whichonevapes.site
           </div>
        </div>
      </header>

      <main className="w-full max-w-4xl px-2 md:px-4 flex-1 pb-32 md:pb-40">
        {view === 'vote' ? (
          <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex justify-center mb-3 md:mb-6 items-center">
               <h2 className="text-lg md:text-2xl font-bold mx-2 md:mx-4 underline italic">SELECT THE PROBABLE VAPER</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-8 justify-items-center mb-4">
              {pair.map((candidate) => (
                <div key={candidate.id} className="win95-card w-full">
                  <div className="win95-header text-[8px] md:text-xs py-0.5">
                    <span className="truncate">{candidate.name}</span>
                  </div>
                  <div className="p-1 md:p-2 flex flex-col items-center">
                    <div className="win95-inset p-0.5 mb-1 md:mb-3 bg-black">
                      <img 
                        src={candidate.image} 
                        alt={candidate.name} 
                        className="w-full h-auto aspect-[3/4] object-cover border border-white"
                      />
                    </div>
                    <div className="text-center mb-2 md:mb-4">
                      <p className="font-bold text-xs md:text-lg mb-0.5 truncate max-w-full">{candidate.name}</p>
                      <p className="text-[8px] md:text-sm bg-yellow-200 border border-black px-1 py-0.5">CAT: {candidate.category}</p>
                    </div>
                    <button 
                      className="win95-button w-full text-[10px] md:text-xl py-1.5 md:py-3 bg-blue-100 hover:bg-blue-200"
                      onClick={() => handleVote(candidate.id)}
                      disabled={isTransitioning}
                    >
                      <span className="blink font-black">VOTE!</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Local Analysis Tool - Works without AI */}
            <div className="win95-card w-full mb-6">
               <div className="win95-header bg-green-800">
                  <div className="flex items-center gap-1"><Search size={12}/> VAPE-O-METER DIAGNOSTIC 2.0 (LOCAL)</div>
               </div>
               <div className="p-3 bg-gray-200 text-center">
                  {!currentVerdict && !isAnalyzing && (
                    <button onClick={runAnalysis} className="win95-button px-6 py-2 bg-green-200 hover:bg-green-300">
                       RUN COMPU-ANALYSIS
                    </button>
                  )}

                  {isAnalyzing && (
                    <div className="w-full">
                      <p className="text-xs font-mono mb-2">SCANNING SUBJECTS...</p>
                      <div className="win95-inset h-6 w-full relative overflow-hidden bg-white">
                        <div 
                          className="h-full bg-blue-800 transition-all duration-100" 
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {currentVerdict && (
                    <div className="animate-in fade-in duration-500">
                      <div className="win95-inset p-3 bg-white text-left font-mono">
                        <p className="text-red-600 font-bold mb-1 underline uppercase">Findings:</p>
                        <p className="text-sm text-black mb-2">
                           <span className="bg-blue-100 px-1 font-bold">{currentVerdict.leader}</span> is the probable vaper.
                        </p>
                        <p className="text-xs italic text-gray-700">
                           " {currentVerdict.reason} "
                        </p>
                      </div>
                      <button onClick={generateNewPair} className="mt-3 text-xs underline text-blue-800 hover:text-blue-600">
                         Clear and Skip Matchup
                      </button>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : view === 'leaderboard' ? (
          <div className="win95-card">
            <div className="win95-header text-[10px] md:text-sm">
              <span>HALL_OF_SHAME.XLS</span>
            </div>
            <div className="p-1 md:p-4 bg-white overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-[10px] md:text-base">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-1 md:p-2">#</th>
                    <th className="border border-gray-400 p-1 md:p-2">PIC</th>
                    <th className="border border-gray-400 p-1 md:p-2 text-left">NAME</th>
                    <th className="border border-gray-400 p-1 md:p-2">%</th>
                    <th className="border border-gray-400 p-1 md:p-2">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((candidate, idx) => {
                    const rate = getVapeRate(candidate.id);
                    const voteCount = votes[candidate.id]?.chosenCount || 0;
                    return (
                      <tr key={candidate.id} className="hover:bg-yellow-50">
                        <td className="border border-gray-400 p-1 md:p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-gray-400 p-1 md:p-2">
                          <img src={candidate.image} alt="" className="w-6 h-6 md:w-10 md:h-10 object-cover mx-auto border border-black" />
                        </td>
                        <td className="border border-gray-400 p-1 md:p-2">
                           <div className="font-bold truncate max-w-[80px] md:max-w-none">{candidate.name}</div>
                        </td>
                        <td className="border border-gray-400 p-1 md:p-2 text-center font-mono font-bold text-red-600">{rate}%</td>
                        <td className="border border-gray-400 p-1 md:p-2 text-center font-mono font-bold">{voteCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="win95-card">
            <div className="win95-header text-[10px] md:text-sm">
              <span>C:\WINDOWS\SYSTEM32\ADMIN.EXE</span>
            </div>
            <div className="p-2 md:p-4 bg-gray-200">
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={handleBackup} className="win95-button flex items-center gap-1 text-xs">
                  <Download size={12} /> BACKUP DATABASE
                </button>
              </div>

              <div className="win95-inset bg-white overflow-x-auto">
                <table className="w-full border-collapse text-[9px] md:text-xs">
                  <thead className="sticky top-0 bg-gray-100 shadow-sm">
                    <tr>
                      <th className="border border-gray-300 p-1 text-left">ID</th>
                      <th className="border border-gray-300 p-1 text-left">NAME</th>
                      <th className="border border-gray-300 p-1">CATEGORY</th>
                      <th className="border border-gray-300 p-1">SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_CANDIDATES.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50">
                        <td className="border border-gray-300 p-1 font-mono text-gray-500">{c.id}</td>
                        <td className="border border-gray-300 p-1 font-bold">{c.name}</td>
                        <td className="border border-gray-300 p-1">{c.category}</td>
                        <td className="border border-gray-300 p-1 text-center font-bold text-purple-700">{c.baseVapeScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Retro Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-1.5 md:p-4 bg-gray-200 border-t-2 border-white flex flex-col items-center gap-1 md:gap-2">
        <div className="flex gap-4 md:gap-8 items-center w-full justify-center">
           <div className="flex flex-col items-center shrink-0">
              <span className="text-[8px] md:text-[10px] font-bold">HITS</span>
              <div className="hit-counter text-[10px] md:text-sm">{hitCount.toString().padStart(6, '0')}</div>
           </div>
           <div className="hidden sm:flex gap-2 md:gap-4">
              <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZkMHJ4N3ZkMHJ4N3ZkMHJ4N3ZkMHJ4N3ZkMHJ4N3ZkMHJ4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/fX8B6Z79s0R5M3j4mX/giphy.gif" alt="IE Badge" className="h-6 md:h-8" />
              <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZkMHJ4N3ZkMHJ4N3ZkMHJ4N3ZkMHJ4N3ZkMHJ4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/667vA8T1XyF0i0G0p4/giphy.gif" alt="Netscape Badge" className="h-6 md:h-8" />
           </div>
           <div className="text-center">
             <a href="mailto:webmaster@whichonevapes.com" className="text-[9px] md:text-xs flex items-center gap-1 font-bold justify-center">
               <Mail size={10} className="md:w-3 md:h-3" /> Webmaster
             </a>
             <div className="text-[7px] md:text-[9px] mt-0.5 text-gray-600 flex items-center justify-center gap-1 truncate">
               <Construction size={8} className="md:w-2.5 md:h-2.5" /> Site Fully Localized
             </div>
           </div>
        </div>
        <p className="text-[8px] md:text-[10px] italic text-center text-red-700 max-w-2xl px-2 font-bold leading-tight">
          Vaping isn't for kids, which I mention only so the babies out there will know how cool they are for puffin' cotton. What's up, you cool baby?
        </p>
      </footer>
    </div>
  );
};

export default App;
