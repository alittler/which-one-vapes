
import React, { useState } from 'react';
import { Artifact, Character } from '../../types';
import { Button } from '../ui/Button';
import { Package, User, Plus, X, Search, Trash2 } from 'lucide-react';

interface InventoryViewProps {
  artifacts: Artifact[];
  characters: Character[];
  onAddArtifact: (item: Artifact) => void;
  onUpdateArtifact: (item: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  artifacts,
  characters,
  onAddArtifact,
  onUpdateArtifact,
  onDeleteArtifact
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Artifact>>({ name: '', type: 'Item', description: '', significance: '' });

  const filtered = artifacts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (newItem.name) {
      onAddArtifact({
        id: crypto.randomUUID(),
        name: newItem.name,
        type: newItem.type || 'Item',
        description: newItem.description || '',
        significance: newItem.significance || '',
        possessorId: newItem.possessorId,
        source: 'manual'
      });
      setIsAdding(false);
      setNewItem({ name: '', type: 'Item', description: '', significance: '' });
    }
  };

  const getOwnerName = (id?: string) => {
    if (!id) return null;
    return characters.find(c => c.id === id)?.name || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center">
            <Package className="mr-3 text-amber-500" size={28} />
            Artifacts & Inventory
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track key items, weapons, and heirlooms.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus size={16} className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {artifacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Package size={64} className="mb-4 opacity-20" />
            <p>No artifacts logged yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group relative">
                <button 
                  onClick={() => onDeleteArtifact(item.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{item.type}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                  
                  {item.significance && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500 italic">
                      <span className="font-bold not-italic text-slate-400 block mb-1">Significance</span>
                      {item.significance}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-500">
                      <User size={14} className="mr-1.5 text-slate-400" />
                      {getOwnerName(item.possessorId) ? (
                        <span className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">{getOwnerName(item.possessorId)}</span>
                      ) : (
                        <span className="italic opacity-70">Unclaimed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Register New Artifact</h3>
              <button onClick={() => setIsAdding(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                <input 
                  className="w-full border rounded p-2.5" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <input 
                    className="w-full border rounded p-2.5" 
                    value={newItem.type} 
                    onChange={e => setNewItem({...newItem, type: e.target.value})} 
                    placeholder="e.g. Weapon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Owner</label>
                  <select 
                    className="w-full border rounded p-2.5 bg-white"
                    value={newItem.possessorId || ''}
                    onChange={e => setNewItem({...newItem, possessorId: e.target.value})}
                  >
                    <option value="">-- None --</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  className="w-full border rounded p-2.5 h-20" 
                  value={newItem.description} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plot Significance</label>
                <textarea 
                  className="w-full border rounded p-2.5 h-16" 
                  value={newItem.significance} 
                  onChange={e => setNewItem({...newItem, significance: e.target.value})}
                  placeholder="Why is this item important?"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newItem.name}>Save Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
