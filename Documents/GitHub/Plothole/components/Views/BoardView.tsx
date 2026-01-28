import React from 'react';
import { TimelineEvent, Character, Location } from '../../types';
import { SmartText } from '../ui/SmartText';

interface BoardViewProps {
  events?: TimelineEvent[];
  characters?: Character[];
  locations?: Location[];
  onLinkClick: (type: 'character' | 'location', id: string) => void;
}

// Simple categorization of events for the board
const getStatus = (index: number, total: number) => {
  if (index < total * 0.25) return 'Act I';
  if (index < total * 0.75) return 'Act II';
  return 'Act III';
};

export const BoardView: React.FC<BoardViewProps> = ({ 
  events = [],
  characters = [],
  locations = [],
  onLinkClick
}) => {
  if (events.length === 0) {
    return <div className="p-8 text-center text-slate-500 italic">No scenes to display on board.</div>;
  }

  const columns = {
    'Act I': events.filter((_, i) => getStatus(i, events.length) === 'Act I'),
    'Act II': events.filter((_, i) => getStatus(i, events.length) === 'Act II'),
    'Act III': events.filter((_, i) => getStatus(i, events.length) === 'Act III'),
  };

  return (
    <div className="p-6 h-full overflow-x-auto overflow-y-hidden whitespace-nowrap">
       <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6 sticky left-0">Story Board</h2>
       <div className="flex gap-6 h-[calc(100%-4rem)]">
         {Object.entries(columns).map(([title, items]) => (
           <div key={title} className="w-80 flex-shrink-0 flex flex-col bg-slate-50 rounded-xl border border-slate-200">
             <div className="p-3 border-b border-slate-200 bg-slate-100 rounded-t-xl">
                <h3 className="font-bold text-slate-700">{title}</h3>
                <span className="text-xs text-slate-500">{items.length} scenes</span>
             </div>
             <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all whitespace-normal">
                    <div className="text-xs text-primary font-medium mb-1">{item.date}</div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-2">{item.title}</h4>
                    <SmartText 
                      text={item.description}
                      characters={characters}
                      locations={locations}
                      onLinkClick={onLinkClick}
                      className="text-xs text-slate-500 line-clamp-3"
                    />
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {item.charactersInvolved?.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{c}</span>
                      ))}
                      {item.charactersInvolved?.length > 2 && <span className="text-[10px] text-slate-400">+{item.charactersInvolved.length - 2}</span>}
                    </div>
                  </div>
                ))}
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};