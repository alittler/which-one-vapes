
import React from 'react';
import { VerdictResponse } from '../types';

interface VerdictBoxProps {
  verdict: VerdictResponse | null;
  loading: boolean;
}

const VerdictBox: React.FC<VerdictBoxProps> = ({ verdict, loading }) => {
  if (loading) {
    return (
      <div className="mt-6 p-6 glass-card rounded-2xl animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
      </div>
    );
  }

  if (!verdict) return null;

  return (
    <div className="mt-6 p-6 glass-card rounded-2xl border-purple-500/30 border">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm">AI Comparative Study</h3>
        <span className="bg-pink-600/20 text-pink-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
          LEADER: {verdict.vapeLeader}
        </span>
      </div>
      <p className="text-gray-300 italic mb-4 leading-relaxed text-sm">
        "{verdict.comparisonReasoning}"
      </p>
      <div className="flex items-center gap-2">
        <span className="text-purple-400 font-bold text-[10px] uppercase">Matchup Vibe:</span>
        <span className="text-white text-xs tracking-wide">{verdict.vibeSummary}</span>
      </div>
    </div>
  );
};

export default VerdictBox;
