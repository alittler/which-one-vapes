
import React, { useState, useRef } from 'react';
import { Location, Character, Inspiration } from '../../types';
import { SmartText } from '../ui/SmartText';
import { 
  MapPin, Users, Dna, Crown, ChevronRight, Layout, Navigation, Compass, 
  Lightbulb, Image as ImageIcon, Link as LinkIcon, StickyNote, Plus, X, Trash2, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LocationViewProps {
  locations: Location[];
  characters: Character[];
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onNavigateToMap: (locationId?: string) => void;
  onUpdateLocation: (location: Location) => void;
}

export const LocationView: React.FC<LocationViewProps> = ({ 
  locations, 
  characters,
  onLinkClick,
  onNavigateToMap,
  onUpdateLocation
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  
  // Inspiration Input State
  const [showAddInspiration, setShowAddInspiration] = useState<boolean>(false);
  const [addType, setAddType] = useState<'link' | 'note' | 'image' | null>(null);
  const [newInputContent, setNewInputContent] = useState('');
  const [newInputTitle, setNewInputTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLoc = locations.find(l => l.id === selectedLocId);
  
  const getResidents = (locId: string) => characters.filter(c => c.associatedLocationId === locId);
  const getSubLocations = (locId: string) => locations.filter(l => l.parentId === locId);
  
  const getDemographics = (residents: Character[]) => {
    const species = Array.from(new Set(residents.map(r => r.species || 'Unknown').filter(Boolean)));
    const families = Array.from(new Set(residents.map(r => r.family || 'Unknown').filter(Boolean)));
    return { species, families };
  };

  const handleAddInspiration = () => {
    if (!selectedLoc || !addType) return;
    
    // Validate
    if (addType !== 'image' && !newInputContent.trim()) return;

    const newInspiration: Inspiration = {
      id: crypto.randomUUID(),
      type: addType,
      content: newInputContent,
      title: newInputTitle,
      timestamp: Date.now()
    };

    const updatedLoc = {
      ...selectedLoc,
      inspirations: [...(selectedLoc.inspirations || []), newInspiration]
    };

    onUpdateLocation(updatedLoc);
    
    // Reset
    setNewInputContent('');
    setNewInputTitle('');
    setAddType(null);
    setShowAddInspiration(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedLoc) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        
        const newInspiration: Inspiration = {
          id: crypto.randomUUID(),
          type: 'image',
          content: result,
          title: file.name,
          timestamp: Date.now()
        };

        const updatedLoc = {
          ...selectedLoc,
          inspirations: [...(selectedLoc.inspirations || []), newInspiration]
        };

        onUpdateLocation(updatedLoc);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteInspiration = (inspId: string) => {
    if (!selectedLoc) return;
    const updatedLoc = {
      ...selectedLoc,
      inspirations: selectedLoc.inspirations?.filter(i => i.id !== inspId) || []
    };
    onUpdateLocation(updatedLoc);
  };

  if (locations.length === 0) {
    return <div className="p-8 text-center text-slate-500 italic">No locations found.</div>;
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full ${selectedLoc ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
           <h2 className="font-serif font-bold text-xl text-slate-800">Locations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
           {locations.map(loc => {
             const residentCount = getResidents(loc.id).length;
             return (
               <div 
                 key={loc.id}
                 onClick={() => setSelectedLocId(loc.id)}
                 className={`
                   p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors
                   ${selectedLocId === loc.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}
                 `}
               >
                 <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-medium ${selectedLocId === loc.id ? 'text-primary' : 'text-slate-800'}`}>{loc.name}</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{loc.type}</span>
                 </div>
                 <p className="text-xs text-slate-500 line-clamp-2 mb-2">{loc.description}</p>
                 <div className="flex items-center text-xs text-slate-400 gap-3">
                    {residentCount > 0 && (
                      <span className="flex items-center"><Users size={12} className="mr-1"/> {residentCount}</span>
                    )}
                    {loc.parentId && (
                      <span className="flex items-center"><Navigation size={12} className="mr-1"/> Inside {locations.find(p => p.id === loc.parentId)?.name}</span>
                    )}
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Main Detail View */}
      <div className={`flex-1 overflow-y-auto ${!selectedLoc ? 'hidden md:flex items-center justify-center' : 'block'}`}>
        {!selectedLoc ? (
           <div className="text-center text-slate-400">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a location to view details</p>
           </div>
        ) : (
           <div className="p-6 md:p-10 max-w-4xl mx-auto">
              <div className="mb-6 flex items-center gap-2 md:hidden">
                 <button onClick={() => setSelectedLocId(null)} className="text-slate-500 hover:text-slate-800 font-medium flex items-center">
                    <ChevronRight className="rotate-180 mr-1" size={16} /> Back
                 </button>
              </div>

              <div className="flex justify-between items-start mb-6">
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h1 className="text-3xl font-serif font-bold text-slate-900">{selectedLoc.name}</h1>
                       <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{selectedLoc.type}</span>
                    </div>
                    {selectedLoc.parentId && (
                       <div className="flex items-center text-sm text-slate-500">
                          <Navigation size={14} className="mr-1.5" />
                          Located in: 
                          <button 
                             onClick={() => setSelectedLocId(selectedLoc.parentId || null)}
                             className="ml-1 text-primary hover:underline font-medium"
                          >
                             {locations.find(p => p.id === selectedLoc.parentId)?.name}
                          </button>
                       </div>
                    )}
                 </div>
                 <Button onClick={() => onNavigateToMap(selectedLoc.id)}>
                    <Compass size={18} className="mr-2" />
                    View on Map
                 </Button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                 <SmartText 
                    text={selectedLoc.description} 
                    characters={characters}
                    locations={locations}
                    onLinkClick={onLinkClick}
                    className="text-slate-700 leading-relaxed"
                 />
                 
                 {(selectedLoc.mapScale && selectedLoc.mapUnit) && (
                   <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
                      <Layout size={12} />
                      Map Scale: {selectedLoc.mapScale} {selectedLoc.mapUnit} wide
                   </div>
                 )}
              </div>

              {/* Inspirations Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                     <Lightbulb size={20} className="mr-2 text-amber-500" />
                     Inspirations & Mood Board
                  </h3>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => { setAddType('link'); setShowAddInspiration(true); }}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded"
                        title="Add Link"
                     >
                        <LinkIcon size={18} />
                     </button>
                     <button 
                        onClick={() => { setAddType('note'); setShowAddInspiration(true); }}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded"
                        title="Add Note"
                     >
                        <StickyNote size={18} />
                     </button>
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded"
                        title="Add Image"
                     >
                        <ImageIcon size={18} />
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                     />
                  </div>
                </div>

                {/* Add Inspiration Modal/Form */}
                {showAddInspiration && addType && (
                   <div className="bg-slate-100 p-4 rounded-lg mb-4 border border-slate-200 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold uppercase text-slate-500">Add {addType}</span>
                         <button onClick={() => { setShowAddInspiration(false); setAddType(null); }}><X size={16} className="text-slate-400" /></button>
                      </div>
                      
                      {addType === 'link' && (
                         <>
                            <input 
                               className="w-full mb-2 p-2 rounded border text-sm" 
                               placeholder="Title (optional)" 
                               value={newInputTitle}
                               onChange={e => setNewInputTitle(e.target.value)}
                            />
                            <input 
                               className="w-full mb-2 p-2 rounded border text-sm" 
                               placeholder="https://..." 
                               value={newInputContent}
                               onChange={e => setNewInputContent(e.target.value)}
                               autoFocus
                            />
                         </>
                      )}
                      
                      {addType === 'note' && (
                         <textarea 
                            className="w-full mb-2 p-2 rounded border text-sm h-24" 
                            placeholder="Jot down a thought..." 
                            value={newInputContent}
                            onChange={e => setNewInputContent(e.target.value)}
                            autoFocus
                         />
                      )}

                      <div className="flex justify-end gap-2 mt-2">
                         <Button size="sm" variant="ghost" onClick={() => { setShowAddInspiration(false); setAddType(null); }}>Cancel</Button>
                         <Button size="sm" onClick={handleAddInspiration}>Add</Button>
                      </div>
                   </div>
                )}

                {/* Inspiration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedLoc.inspirations?.map(insp => (
                     <div key={insp.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all relative">
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleDeleteInspiration(insp.id); }}
                           className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                           <Trash2 size={14} />
                        </button>

                        {/* Image Type */}
                        {insp.type === 'image' && (
                           <div className="aspect-video bg-slate-100 relative">
                              <img src={insp.content} className="w-full h-full object-cover" alt="Inspiration" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                 <p className="text-white text-xs truncate">{insp.title || 'Image Inspiration'}</p>
                              </div>
                           </div>
                        )}

                        {/* Link Type */}
                        {insp.type === 'link' && (
                           <a href={insp.content} target="_blank" rel="noopener noreferrer" className="block p-4 h-full hover:bg-slate-50">
                              <div className="flex items-start gap-3">
                                 <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <LinkIcon size={20} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{insp.title || 'External Link'}</h4>
                                    <p className="text-xs text-slate-500 truncate mt-1">{insp.content}</p>
                                    <div className="mt-2 text-xs text-blue-600 flex items-center">
                                       Open Link <ExternalLink size={10} className="ml-1" />
                                    </div>
                                 </div>
                              </div>
                           </a>
                        )}

                        {/* Note Type */}
                        {insp.type === 'note' && (
                           <div className="p-4 bg-yellow-50/50 h-full">
                              <div className="flex items-center gap-2 mb-2 text-yellow-600/70 text-xs font-bold uppercase">
                                 <StickyNote size={12} /> Note
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">{insp.content}</p>
                           </div>
                        )}
                     </div>
                  ))}
                  {(!selectedLoc.inspirations || selectedLoc.inspirations.length === 0) && (
                     <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                        <p className="text-slate-400 text-sm">No inspirations added yet. Add images, links, or notes.</p>
                     </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 {/* Residents */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                       <Users size={16} className="mr-2" /> Residents & Characters
                       <span className="ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{getResidents(selectedLoc.id).length}</span>
                    </h3>
                    <div className="space-y-3">
                       {getResidents(selectedLoc.id).length === 0 ? (
                          <p className="text-slate-400 text-sm italic">No known residents.</p>
                       ) : (
                          getResidents(selectedLoc.id).map(char => (
                             <div 
                               key={char.id} 
                               className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                               onClick={() => onLinkClick('character', char.id)}
                             >
                                <img 
                                   src={char.imageUrl || `https://picsum.photos/seed/${char.name}/64/64`}
                                   alt={char.name}
                                   className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                   <div className="font-bold text-slate-700 text-sm group-hover:text-primary transition-colors">{char.name}</div>
                                   <div className="text-xs text-slate-500">{char.role}</div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 {/* Sub-locations */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                       <MapPin size={16} className="mr-2" /> Sub-Locations
                    </h3>
                    <div className="space-y-2">
                       {getSubLocations(selectedLoc.id).length === 0 ? (
                          <p className="text-slate-400 text-sm italic">No sub-locations defined.</p>
                       ) : (
                          getSubLocations(selectedLoc.id).map(sub => (
                             <div 
                                key={sub.id} 
                                onClick={() => setSelectedLocId(sub.id)}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                             >
                                <span className="font-medium text-slate-700 text-sm">{sub.name}</span>
                                <ChevronRight size={14} className="text-slate-400" />
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>

              {/* Demographics */}
              {getResidents(selectedLoc.id).length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Demographics</h3>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <div className="flex items-center text-xs text-slate-500 font-bold mb-2">
                             <Dna size={12} className="mr-1.5" /> DOMINANT SPECIES
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {getDemographics(getResidents(selectedLoc.id)).species.map(s => (
                                <span key={s} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100">{s}</span>
                             ))}
                          </div>
                       </div>
                       <div>
                          <div className="flex items-center text-xs text-slate-500 font-bold mb-2">
                             <Crown size={12} className="mr-1.5" /> PROMINENT FAMILIES
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {getDemographics(getResidents(selectedLoc.id)).families.map(f => (
                                <span key={f} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">{f}</span>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};
