
import React, { useRef, useState } from 'react';
import { ViewType, Location, Character, ProjectData, LoreEntry, Artifact, Language } from '../../types';
import { MapView } from './MapView';
import { LocationView } from './LocationView';
import { EncyclopediaView } from './EncyclopediaView';
import { InventoryView } from './InventoryView';
import { DictionaryView } from './DictionaryView';
import { GalleryView } from './GalleryView';
import { Globe, Plus, X, Upload, Compass, Image as ImageIcon, Map as MapIcon, MapPin, Book, Package, Languages, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorldSystemViewProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  data: ProjectData;
  onUpdateLocation: (loc: Location) => void;
  onAddLocation: (loc: Location) => void;
  onUpdateRootMap: (url: string) => void;
  onUpdateRootMapData: (scale: number, unit: string) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onUpdateMapOrder: (order: string[]) => void;
  currentMapParentId: string | null;
  onMapChange: (id: string | null) => void;
  onUpdateProject: (data: Partial<ProjectData>) => void;
  // Codex Props
  onAddArtifact: (item: Artifact) => void;
  onUpdateArtifact: (item: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
  onAddLore: (entry: LoreEntry) => void;
  onDeleteLore: (id: string) => void;
}

export const WorldSystemView: React.FC<WorldSystemViewProps> = ({
  currentView,
  onChangeView,
  data,
  onUpdateLocation,
  onAddLocation,
  onUpdateRootMap,
  onUpdateRootMapData,
  onLinkClick,
  currentMapParentId,
  onMapChange,
  onAddArtifact,
  onUpdateArtifact,
  onDeleteArtifact,
  onAddLore,
  onDeleteLore,
  onUpdateProject
}) => {
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [mapTypeChoice, setMapTypeChoice] = useState<'real' | 'fictional' | null>(null);
  const [newMapName, setNewMapName] = useState('');
  const [fictionalMapUrl, setFictionalMapUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mapLocations = data.locations.filter(l => l.mapImage || l.isRealWorld);
  const displayMaps = ['root', ...mapLocations.map(l => l.id)];

  const tabs = [
    { id: ViewType.MAP, label: 'Cartography', icon: MapIcon },
    { id: ViewType.LOCATIONS, label: 'Records', icon: MapPin },
    { id: ViewType.ENCYCLOPEDIA, label: 'Wiki', icon: FileText },
    { id: ViewType.INVENTORY, label: 'Inventory', icon: Package },
    { id: ViewType.DICTIONARY, label: 'Lexicon', icon: Languages },
    { id: ViewType.GALLERY, label: 'Gallery', icon: ImageIcon },
  ];

  const handleCreateNewMap = () => {
      if (!newMapName.trim()) return;
      const newLoc: Location = {
          id: crypto.randomUUID(),
          name: newMapName,
          type: 'Region',
          description: 'A newly mapped region.',
          parentId: currentMapParentId || undefined,
          isRealWorld: mapTypeChoice === 'real',
          mapImage: mapTypeChoice === 'fictional' ? fictionalMapUrl : undefined,
          source: 'manual'
      };
      onAddLocation(newLoc);
      onMapChange(newLoc.id);
      onChangeView(ViewType.MAP);
      setIsCreatingMap(false);
      setMapTypeChoice(null);
      setFictionalMapUrl('');
      setNewMapName('');
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewType.LOCATIONS:
        return <LocationView locations={data.locations} characters={data.characters} onLinkClick={onLinkClick} onNavigateToMap={(id) => { onChangeView(ViewType.MAP); onMapChange(id || null); }} onUpdateLocation={onUpdateLocation} />;
      case ViewType.ENCYCLOPEDIA:
        return <EncyclopediaView lore={data.lore || []} onAddLore={onAddLore} onDeleteLore={onDeleteLore} />;
      case ViewType.INVENTORY:
        return <InventoryView artifacts={data.artifacts || []} characters={data.characters} onAddArtifact={onAddArtifact} onUpdateArtifact={onUpdateArtifact} onDeleteArtifact={onDeleteArtifact} />;
      case ViewType.DICTIONARY:
        return <DictionaryView languages={data.languages || []} onUpdateLanguages={(l) => onUpdateProject({ languages: l })} />;
      case ViewType.GALLERY:
        return <GalleryView data={data} />;
      default:
        return (
          <MapView 
            locations={data.locations} 
            characters={data.characters} 
            rootMapImage={data.rootMapImage} 
            rootMapScale={data.mapScale} 
            rootMapUnit={data.mapUnit} 
            onUpdateRootMap={onUpdateRootMap} 
            onUpdateRootMapData={onUpdateRootMapData} 
            onUpdateLocation={onUpdateLocation} 
            onAddLocation={onAddLocation} 
            onLinkClick={onLinkClick} 
            currentMapParentId={currentMapParentId} 
            setCurrentMapParentId={onMapChange} 
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
         <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
               <Globe className="text-cyan-500" size={24} />
               World Hub
            </h2>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsCreatingMap(true)}>
                    <Plus size={16} className="mr-2" /> New Map
                </Button>
            </div>
         </div>

         <div className="px-6 flex items-end space-x-1 overflow-x-auto no-scrollbar">
           {tabs.map(tab => {
             const isActive = currentView === tab.id;
             return (
               <button
                  key={tab.id}
                  onClick={() => onChangeView(tab.id)}
                  className={`px-4 py-2 text-[10px] font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-widest flex items-center gap-2 ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                  <tab.icon size={12} />
                  {tab.label}
               </button>
             );
           })}
           
           {currentView === ViewType.MAP && (
             <>
               <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2 self-center" />
               {displayMaps.map((mapId) => {
                  const isRoot = mapId === 'root';
                  const loc = isRoot ? null : data.locations.find(l => l.id === mapId);
                  const name = isRoot ? 'Global' : loc?.name || 'Sub-Map';
                  const isActiveMap = (isRoot && currentMapParentId === null) || currentMapParentId === mapId;
                  return (
                      <button
                          key={mapId}
                          onClick={() => onMapChange(isRoot ? null : mapId)}
                          className={`px-4 py-2 text-[9px] font-bold transition-all whitespace-nowrap uppercase tracking-tighter ${isActiveMap ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                          {name}
                      </button>
                  );
               })}
             </>
           )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-950">
        {renderContent()}
      </div>

      {isCreatingMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-md shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-white flex items-center gap-3">
                          <MapIcon size={24} className="text-primary" />
                          Define Map Layer
                      </h3>
                      <button onClick={() => setIsCreatingMap(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={28} /></button>
                  </div>

                  {!mapTypeChoice ? (
                      <div className="space-y-3">
                          <button onClick={() => setMapTypeChoice('real')} className="w-full flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 rounded-md transition-all text-left">
                              <Compass size={28} className="text-primary"/>
                              <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100">Real-World Map</div>
                                  <div className="text-xs text-slate-500">Based on standard cartography data.</div>
                              </div>
                          </button>
                          <button onClick={() => setMapTypeChoice('fictional')} className="w-full flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 rounded-md transition-all text-left">
                              <ImageIcon size={28} className="text-primary"/>
                              <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100">Illustrated</div>
                                  <div className="text-xs text-slate-500">Upload custom fantasy or building imagery.</div>
                              </div>
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Region Label</label>
                              <input className="w-full border dark:border-slate-700 rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:text-white shadow-inner" placeholder="e.g. The Lowlands" value={newMapName} onChange={e => setNewMapName(e.target.value)} autoFocus />
                          </div>
                          {mapTypeChoice === 'fictional' && (
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Map Source</label>
                                  {fictionalMapUrl ? (
                                      <div className="relative aspect-video rounded-md overflow-hidden border-2 border-primary shadow-lg">
                                          <img src={fictionalMapUrl} className="w-full h-full object-cover" alt="Preview" />
                                          <button onClick={() => setFictionalMapUrl('')} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
                                      </div>
                                  ) : (
                                      <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-md flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all bg-slate-50 dark:bg-slate-900">
                                          <Upload size={32} className="mb-2" />
                                          <span className="text-xs font-bold">Select Imagery</span>
                                      </button>
                                  )}
                                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                          const r = new FileReader();
                                          r.onload = (ev) => setFictionalMapUrl(ev.target?.result as string);
                                          r.readAsDataURL(file);
                                      }
                                  }} />
                              </div>
                          )}
                          <div className="flex gap-3 pt-2">
                              <Button variant="ghost" onClick={() => setMapTypeChoice(null)} className="flex-1 py-3 font-bold">Back</Button>
                              <Button onClick={handleCreateNewMap} disabled={!newMapName.trim()} className="flex-1 py-3 font-bold">Initialize Layer</Button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
