
import React, { useState } from 'react';
import { LoreEntry, LoreCategory } from '../../types';
import { Button } from '../ui/Button';
import { Book, Search, Plus, X, Tag, Trash2, Shield, Flame, UserCircle, Globe, Languages, Scroll, Users } from 'lucide-react';

interface EncyclopediaViewProps {
  lore: LoreEntry[];
  onAddLore: (entry: LoreEntry) => void;
  onDeleteLore: (id: string) => void;
}

export const EncyclopediaView: React.FC<EncyclopediaViewProps> = ({
  lore,
  onAddLore,
  onDeleteLore
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LoreEntry>>({ term: '', category: 'General', definition: '' });

  const categories: LoreCategory[] = ['General', 'Faction', 'Religion', 'Magic', 'Species', 'Language', 'Tradition', 'Culture'];

  const filtered = lore.filter(l => 
    l.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (cat: LoreCategory) => {
    switch(cat) {
        case 'Faction': return <Shield size={14}/>;
        case 'Magic': return <Flame size={14}/>;
        case 'Species': return <UserCircle size={14}/>;
        case 'Culture': return <Globe size={14}/>;
        case 'Language': return <Languages size={14}/>;
        case 'Tradition': return <Scroll size={14}/>;
        case 'Religion': return <Users size={14}/>;
        default: return <Tag size={14}/>;
    }
  };

  const getCategoryColor = (cat: LoreCategory) => {
    switch(cat) {
        case 'Faction': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'Magic': return 'bg-purple-50 text-purple-700 border-purple-100';
        case 'Species': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'Religion': return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'Tradition': return 'bg-rose-50 text-rose-700 border-rose-100';
        default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const handleCreate = () => {
    if (newEntry.term) {
      onAddLore({
        id: crypto.randomUUID(),
        term: newEntry.term,
        category: (newEntry.category as LoreCategory) || 'General',
        definition: newEntry.definition || '',
        source: 'manual'
      });
      setIsAdding(false);
      setNewEntry({ term: '', category: 'General', definition: '' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center">
              <Book className="mr-3 text-indigo-500" size={28} />
              World Encyclopedia
            </h2>
            <p className="text-slate-500 text-sm mt-1">Glossary of terms, magic, history, and lore.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="Search definitions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAdding(true)}>
              <Plus size={16} className="mr-2" /> Add Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {lore.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Book size={64} className="mb-4 opacity-20" />
            <p>Encyclopedia is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
            {filtered.map(entry => (
              <div key={entry.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group relative">
                <button 
                  onClick={() => onDeleteLore(entry.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{entry.term}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getCategoryColor(entry.category)}`}>
                    {getCategoryIcon(entry.category)}
                    {entry.category}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {entry.definition}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Add Lore Entry</h3>
              <button onClick={() => setIsAdding(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Term / Name</label>
                <input 
                  className="w-full border rounded p-2.5" 
                  value={newEntry.term} 
                  onChange={e => setNewEntry({...newEntry, term: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <select 
                  className="w-full border rounded p-2.5 bg-white"
                  value={newEntry.category}
                  onChange={e => setNewEntry({...newEntry, category: e.target.value as LoreCategory})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Definition</label>
                <textarea 
                  className="w-full border rounded p-2.5 h-32" 
                  value={newEntry.definition} 
                  onChange={e => setNewEntry({...newEntry, definition: e.target.value})}
                  placeholder="The core of your worldbuilding article..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newEntry.term}>Save Entry</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
