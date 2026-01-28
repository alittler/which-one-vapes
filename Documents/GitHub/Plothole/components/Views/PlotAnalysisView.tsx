
import React, { useState } from 'react';
import { PlotBeat, SentimentPoint, PlotHole } from '../../types';
import { TrendingUp, Target, Activity, AlertTriangle, Lightbulb, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface PlotAnalysisViewProps {
  beats: PlotBeat[];
  sentiment: SentimentPoint[];
  plotHoles: PlotHole[];
  onRunAnalysis: () => void;
}

export const PlotAnalysisView: React.FC<PlotAnalysisViewProps> = ({
  beats,
  sentiment,
  plotHoles,
  onRunAnalysis
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    onRunAnalysis();
    // Reset loading state after a timeout or when props change (in a real app, props would trigger this)
    setTimeout(() => setIsRunning(false), 8000); 
  };

  // --- Sentiment Graph Rendering ---
  const renderSentimentGraph = () => {
    if (sentiment.length === 0) return <div className="text-slate-400 text-sm italic text-center p-10">No sentiment data available. Run analysis.</div>;

    const width = 800;
    const height = 300;
    const padding = 40;
    const graphW = width - padding * 2;
    const graphH = height - padding * 2;

    // Scales
    const maxScore = 10;
    const minScore = -10;
    const range = maxScore - minScore;
    
    const getX = (index: number) => padding + (index / (sentiment.length - 1)) * graphW;
    const getY = (score: number) => padding + graphH - ((score - minScore) / range) * graphH;

    // Generate Path
    let pathD = "";
    sentiment.forEach((pt, i) => {
      const x = getX(i);
      const y = getY(pt.score);
      if (i === 0) pathD += `M ${x} ${y}`;
      else pathD += ` L ${x} ${y}`;
    });

    // Zero Line
    const zeroY = getY(0);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid & Zero Line */}
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4" />
        <text x={padding - 10} y={zeroY + 4} textAnchor="end" className="text-[10px] fill-slate-400">Neutral</text>
        <text x={padding - 10} y={getY(10) + 4} textAnchor="end" className="text-[10px] fill-emerald-500 font-bold">Joy</text>
        <text x={padding - 10} y={getY(-10) + 4} textAnchor="end" className="text-[10px] fill-rose-500 font-bold">Tragedy</text>

        {/* The Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />

        {/* Dots */}
        {sentiment.map((pt, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={getX(i)} cy={getY(pt.score)} r="4" className="fill-white stroke-indigo-600 stroke-2 group-hover:scale-150 transition-transform" />
            
            {/* Tooltip on Hover */}
            <foreignObject x={getX(i) - 60} y={getY(pt.score) - 50} width="120" height="50" className="overflow-visible pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg text-center">
                  <div className="font-bold mb-0.5">{pt.label}</div>
                  <div>Score: {pt.score}</div>
               </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-3xl font-serif font-bold text-slate-800">Plot Architecture</h1>
              <p className="text-slate-500">Analyze structure, pacing, and logical consistency.</p>
           </div>
           <Button onClick={handleRun} isLoading={isRunning} size="lg" className="shadow-lg">
              <Sparkles size={18} className="mr-2" /> Run Deep Analysis
           </Button>
        </div>

        {/* Plot Holes & Inconsistencies */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-1 h-full ${plotHoles.length > 0 ? 'bg-amber-500' : 'bg-green-500'}`} />
           <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${plotHoles.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                 <AlertTriangle size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-800">Integrity Check</h2>
                 <p className="text-sm text-slate-500">
                    {plotHoles.length > 0 ? `Detected ${plotHoles.length} potential issues.` : "No significant plot holes detected."}
                 </p>
              </div>
           </div>

           {plotHoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {plotHoles.map((hole, i) => (
                    <div key={hole.id} className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
                       <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-amber-800 text-sm">Issue #{i+1}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                             hole.severity === 'Critical' ? 'bg-red-200 text-red-800' : 
                             hole.severity === 'Major' ? 'bg-orange-200 text-orange-800' : 
                             'bg-yellow-200 text-yellow-800'
                          }`}>
                             {hole.severity}
                          </span>
                       </div>
                       <p className="text-sm text-slate-700 mb-3">{hole.description}</p>
                       {hole.suggestion && (
                          <div className="flex gap-2 items-start text-xs text-slate-600 bg-white p-2 rounded border border-amber-100">
                             <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                             <span>{hole.suggestion}</span>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           ) : (
              <div className="text-center py-8 bg-green-50 rounded-lg border border-green-100">
                 <p className="text-green-700 font-medium">Timeline appears consistent.</p>
              </div>
           )}
        </section>

        {/* Beat Sheet */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                 <Target size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-800">Structural Beats</h2>
                 <p className="text-sm text-slate-500">Key narrative milestones mapped to your timeline.</p>
              </div>
           </div>

           {beats.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                 <p>No beat analysis found. Run deep analysis.</p>
              </div>
           ) : (
              <div className="space-y-0">
                 {beats.map((beat, i) => (
                    <div key={beat.id} className="relative pl-8 pb-8 group last:pb-0">
                       {/* Connector Line */}
                       {i !== beats.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200 group-hover:bg-rose-200 transition-colors" />
                       )}
                       
                       {/* Node */}
                       <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-rose-400 text-rose-600 flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                          {i + 1}
                       </div>

                       <div className="bg-white p-4 rounded-lg border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-slate-800 text-lg">{beat.beatName}</h3>
                             {beat.timelineEventId && (
                                <span className="text-[10px] uppercase tracking-wide font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                   Timeline Event
                                </span>
                             )}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{beat.description}</p>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </section>

        {/* Sentiment Arc */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                 <Activity size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-800">Emotional Sentiment Arc</h2>
                 <p className="text-sm text-slate-500">Tracking mood and tension across the timeline.</p>
              </div>
           </div>
           
           <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              {renderSentimentGraph()}
           </div>
        </section>

      </div>
    </div>
  );
};
