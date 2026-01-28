import React, { useState, useMemo } from 'react';
import { TimelineEvent, Character, Location, CalendarSystem, CalendarMonth, CalendarEra } from '../../types';
import { SmartText } from '../ui/SmartText';
import { Calendar as CalendarIcon, MapPin, Settings, Plus, X, Save, Trash2, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface CalendarViewProps {
  events?: TimelineEvent[];
  characters?: Character[];
  locations?: Location[];
  calendars?: CalendarSystem[];
  activeCalendarId?: string;
  onUpdateCalendar: (calendar: CalendarSystem) => void;
  onSetActiveCalendar: (id: string) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
}

const PRESETS = {
  GREGORIAN: {
    name: "Gregorian",
    weekDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months: [
      { name: "January", days: 31 }, { name: "February", days: 28 }, { name: "March", days: 31 },
      { name: "April", days: 30 }, { name: "May", days: 31 }, { name: "June", days: 30 },
      { name: "July", days: 31 }, { name: "August", days: 31 }, { name: "September", days: 30 },
      { name: "October", days: 31 }, { name: "November", days: 30 }, { name: "December", days: 31 }
    ]
  },
  ROMAN: {
    name: "Roman (Rep.)",
    weekDays: ["Dies Solis", "Dies Lunae", "Dies Martis", "Dies Mercurii", "Dies Iovis", "Dies Veneris", "Dies Saturni"],
    months: [
      { name: "Martius", days: 31 }, { name: "Aprilis", days: 29 }, { name: "Maius", days: 31 }, { name: "Iunius", days: 29 },
      { name: "Quintilis", days: 31 }, { name: "Sextilis", days: 29 }, { name: "September", days: 29 }, { name: "October", days: 31 },
      { name: "November", days: 29 }, { name: "December", days: 29 }, { name: "Ianuarius", days: 29 }, { name: "Februarius", days: 28 }
    ]
  },
  IFC: {
    name: "Intl. Fixed",
    weekDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months: [
      { name: "January", days: 28 }, { name: "February", days: 28 }, { name: "March", days: 28 },
      { name: "April", days: 28 }, { name: "May", days: 28 }, { name: "June", days: 28 },
      { name: "Sol", days: 28 }, { name: "July", days: 28 }, { name: "August", days: 28 },
      { name: "September", days: 28 }, { name: "October", days: 28 }, { name: "November", days: 28 }, { name: "December", days: 28 }
    ]
  }
};

const DEFAULT_CAL: CalendarSystem = {
  id: 'default-cal',
  name: 'Standard Calendar',
  weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  months: [{ id: 'm1', name: 'January', days: 31 }],
  eras: [{ id: 'e1', name: 'Common Era', abbreviation: 'CE', startYear: 0 }]
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  events = [],
  characters = [],
  locations = [],
  calendars = [DEFAULT_CAL],
  activeCalendarId,
  onUpdateCalendar,
  onSetActiveCalendar,
  onLinkClick
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCal, setEditingCal] = useState<CalendarSystem | null>(null);

  const activeCalendar = calendars.find(c => c.id === activeCalendarId) || calendars[0] || DEFAULT_CAL;

  const eventsByYear = useMemo(() => {
    const years: Record<string, TimelineEvent[]> = {};
    const allYears = new Set<string>();

    events.forEach(event => {
      let year = 'Unknown';
      const yearMatch = event.date.match(/Year\s+(\d+)|(\d{4})/i);
      if (yearMatch) {
        year = yearMatch[1] || yearMatch[2];
      }
      allYears.add(year);
      if (!years[year]) years[year] = [];
      years[year].push(event);
    });

    const sortedYears = Array.from(allYears).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return parseInt(a) - parseInt(b);
    });

    return { years, sortedYears };
  }, [events]);

  if (selectedYear === 'All' && eventsByYear.sortedYears.length > 0) {
     setSelectedYear(eventsByYear.sortedYears[0]);
  }

  const handleEditClick = () => {
    setEditingCal({ ...activeCalendar });
    setIsEditing(true);
  };

  const handleSaveSettings = () => {
    if (editingCal) {
      onUpdateCalendar(editingCal);
      setIsEditing(false);
    }
  };

  const handleApplyPreset = (key: keyof typeof PRESETS) => {
    if (!editingCal) return;
    const preset = PRESETS[key];
    setEditingCal({
      ...editingCal,
      weekDays: [...preset.weekDays],
      months: preset.months.map(m => ({ id: crypto.randomUUID(), ...m }))
    });
  };

  const updateMonth = (idx: number, field: keyof CalendarMonth, value: string | number) => {
    if (!editingCal) return;
    const newMonths = [...editingCal.months];
    newMonths[idx] = { ...newMonths[idx], [field]: value };
    setEditingCal({ ...editingCal, months: newMonths });
  };

  const addMonth = () => {
    if (!editingCal) return;
    setEditingCal({
      ...editingCal,
      months: [...editingCal.months, { id: crypto.randomUUID(), name: 'New Month', days: 30 }]
    });
  };

  const removeMonth = (idx: number) => {
    if (!editingCal) return;
    setEditingCal({
      ...editingCal,
      months: editingCal.months.filter((_, i) => i !== idx)
    });
  };

  const getEventsForMonth = (month: CalendarMonth, yearEvents: TimelineEvent[]) => {
    if (!yearEvents) return [];
    return yearEvents.filter(e => {
       return e.date.toLowerCase().includes(month.name.toLowerCase());
    });
  };

  const getUnassignedEvents = (yearEvents: TimelineEvent[]) => {
    if (!yearEvents) return [];
    return yearEvents.filter(e => {
       return !activeCalendar.months.some(m => e.date.toLowerCase().includes(m.name.toLowerCase()));
    });
  };

  if (isEditing && editingCal) {
    return (
      <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
           <h2 className="font-bold text-lg text-slate-800">Calendar Settings</h2>
           <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings}>
                 <Save size={16} className="mr-2" /> Save Changes
              </Button>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
           <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Calendar Name</label>
                    <input 
                       className="w-full border rounded p-2"
                       value={editingCal.name}
                       onChange={e => setEditingCal({...editingCal, name: e.target.value})}
                    />
                 </div>
                 <div className="mb-4">
                     <label className="block text-sm font-bold text-slate-700 mb-2">Presets</label>
                     <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" size="sm" onClick={() => handleApplyPreset('GREGORIAN')}>Load Gregorian</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleApplyPreset('ROMAN')}>Load Roman</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleApplyPreset('IFC')}>Load Intl. Fixed</Button>
                     </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Weekdays</label>
                    <input 
                       className="w-full border rounded p-2 text-sm"
                       value={editingCal.weekDays.join(', ')}
                       onChange={e => setEditingCal({...editingCal, weekDays: e.target.value.split(',').map(s => s.trim())})}
                    />
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Months</h3>
                    <Button size="sm" variant="ghost" onClick={addMonth}><Plus size={16} className="mr-1"/> Add Month</Button>
                 </div>
                 <div className="space-y-2">
                    {editingCal.months.map((month, idx) => (
                       <div key={month.id} className="flex gap-2 items-center">
                          <input 
                             className="flex-1 border rounded p-2 text-sm"
                             value={month.name}
                             onChange={e => updateMonth(idx, 'name', e.target.value)}
                             placeholder="Month Name"
                          />
                          <input 
                             type="number"
                             className="w-20 border rounded p-2 text-sm"
                             value={month.days}
                             onChange={e => updateMonth(idx, 'days', parseInt(e.target.value))}
                          />
                          <button onClick={() => removeMonth(idx)} className="text-slate-400 hover:text-red-500 p-2">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const currentYearEvents = eventsByYear.years[selectedYear] || [];
  const unassignedEvents = getUnassignedEvents(currentYearEvents);

  return (
    <div className="flex h-full bg-slate-50 flex-col">
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between flex-shrink-0 shadow-sm z-10 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="font-serif font-bold text-xl text-slate-800 flex items-center">
                <CalendarIcon className="mr-2 text-primary" size={24} />
                Calendar
            </h2>
            <div className="relative group">
               <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                  {activeCalendar.name}
                  <Settings size={14} className="opacity-50" />
               </button>
               <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-50 p-1">
                  {calendars.map(c => (
                     <button
                        key={c.id}
                        onClick={() => onSetActiveCalendar(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center ${activeCalendarId === c.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                     >
                        {c.name}
                        {activeCalendarId === c.id && <Check size={14} />}
                     </button>
                  ))}
               </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleEditClick}><Settings size={18} /></Button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
           {eventsByYear.sortedYears.map(year => (
             <button
               key={year}
               onClick={() => setSelectedYear(year)}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedYear === year ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
             >
               {activeCalendar.eras?.[0]?.abbreviation || ''} {year}
             </button>
           ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
         {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 flex-col">
               <CalendarIcon size={48} className="mb-4 opacity-20" />
               <p>No dated events found.</p>
            </div>
         ) : (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {activeCalendar.months.map(month => {
                     const monthEvents = getEventsForMonth(month, currentYearEvents);
                     return (
                        <div key={month.id} className={`bg-white rounded-xl border ${monthEvents.length > 0 ? 'border-primary/20 shadow-md ring-1 ring-primary/5' : 'border-slate-200 shadow-sm'} overflow-hidden flex flex-col min-h-[160px]`}>
                           <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                              <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm truncate">{month.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${monthEvents.length > 0 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                 {monthEvents.length}
                              </span>
                           </div>
                           <div className="p-3 space-y-3 flex-1 bg-slate-50/30">
                              {monthEvents.map(event => (
                                 <div key={event.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{event.title}</h4>
                                    <SmartText text={event.description} characters={characters} locations={locations} onLinkClick={onLinkClick} className="text-xs text-slate-500 line-clamp-2" />
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>
               {unassignedEvents.length > 0 && (
                  <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
                     <h3 className="font-bold text-slate-600 mb-4 flex items-center">Unassigned Events for {selectedYear}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unassignedEvents.map(event => (
                           <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                               <h4 className="font-bold text-slate-800 text-sm mb-2">{event.title}</h4>
                               <p className="text-xs text-slate-500">{event.description}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};