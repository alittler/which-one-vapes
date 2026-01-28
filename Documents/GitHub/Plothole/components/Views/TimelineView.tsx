import React, { useState } from 'react';
import { TimelineEvent, Character, Location } from '../../types';
import { MapPin, Users, Plus, X } from 'lucide-react';
import { SmartText } from '../ui/SmartText';
import { Button } from '../ui/Button';

interface TimelineViewProps {
  events?: TimelineEvent[];
  characters?: Character[];
  locations?: Location[];
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onAddEvent: (event: TimelineEvent) => void;
  onUpdateEvent: (event: TimelineEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  events = [],
  characters = [],
  locations = [],
  onLinkClick,
  onAddEvent
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
     date: '', title: '', description: '', location: '', charactersInvolved: []
  });

  const handleCreate = () => {
     if (newEvent.title && newEvent.date) {
        onAddEvent({
           id: crypto.randomUUID(),
           date: newEvent.date,
           title: newEvent.title,
           description: newEvent.description || '',
           location: newEvent.location || '',
           charactersInvolved: newEvent.charactersInvolved || [],
           source: 'manual'
        } as TimelineEvent);
        setIsAdding(false);
        setNewEvent({ date: '', title: '', description: '', location: '', charactersInvolved: [] });
     }
  };

  return (
    <div className="h-full overflow-y-auto w-full relative">
      
      {/* Floating Add Button */}
      <div className="absolute top-4 right-4 z-20">
         <Button size="sm" onClick={() => setIsAdding(true)} className="shadow-md">
            <Plus size={16} className="mr-2" /> Add Event
         </Button>
      </div>

      <div className="p-6 max-w-4xl mx-auto pt-16">
        {events.length === 0 && (
           <div className="text-center text-slate-500 italic mb-8 flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="mb-4">No timeline events found. Start building your plot.</p>
              <Button onClick={() => setIsAdding(true)}>
                 <Plus size={16} className="mr-2" /> Create First Event
              </Button>
           </div>
        )}
        <div className="relative border-l-2 border-primary/20 ml-3 space-y-8 pb-4">
          {events.map((event, idx) => (
            <div key={event.id} className="relative pl-8">
              {/* Dot */}
              <div className={`
                 absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 shadow-sm
                 ${event.source === 'manual' ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-primary'}
              `} />
              
              <div className={`
                 bg-white p-5 rounded-lg border shadow-sm hover:shadow-md transition-shadow
                 ${event.source === 'manual' ? 'border-yellow-200 ring-2 ring-yellow-100 shadow-yellow-50' : 'border-slate-100'}
              `}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 sm:mb-0">
                    {event.date}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    Event #{idx + 1}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">{event.title}</h3>
                <SmartText 
                  text={event.description}
                  characters={characters}
                  locations={locations}
                  onLinkClick={onLinkClick}
                  className="text-slate-600 text-sm leading-relaxed mb-4"
                />
                
                <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-50 text-sm text-slate-500">
                  {event.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                      {(() => {
                         const exactLoc = locations.find(l => l.name.toLowerCase() === event.location.trim().toLowerCase());
                         if (exactLoc) {
                             return (
                               <button 
                                 onClick={() => onLinkClick('location', exactLoc.id)}
                                 className="text-primary hover:underline font-medium text-left hover:text-blue-700 transition-colors"
                               >
                                 {event.location}
                               </button>
                             );
                         }
                         return (
                            <SmartText 
                                text={event.location}
                                characters={characters}
                                locations={locations}
                                onLinkClick={onLinkClick}
                            />
                         );
                      })()}
                    </div>
                  )}
                  {event.charactersInvolved?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400 flex-shrink-0" />
                      <SmartText 
                        text={event.charactersInvolved.join(', ')}
                        characters={characters}
                        locations={locations}
                        onLinkClick={onLinkClick}
                        className="truncate max-w-[200px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length > 0 && (
            <div className="flex justify-center mt-8 pb-20">
                <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
                    <Plus size={16} className="mr-2" /> Add Another Event
                </Button>
            </div>
        )}
      </div>

      {/* Creation Modal */}
      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">Add New Event</h3>
                  <button onClick={() => setIsAdding(false)}><X size={20} className="text-slate-400" /></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date / Time</label>
                     <input 
                        className="w-full border rounded p-2 text-sm" 
                        placeholder="e.g. Year 2045, or 'The next morning'"
                        value={newEvent.date} 
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                        autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                     <input 
                        className="w-full border rounded p-2 text-sm" 
                        value={newEvent.title} 
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                     <input 
                        className="w-full border rounded p-2 text-sm" 
                        value={newEvent.location} 
                        onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                     <textarea 
                        className="w-full border rounded p-2 text-sm h-32" 
                        value={newEvent.description} 
                        onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                     />
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                  <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newEvent.title || !newEvent.date}>Add Event</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};