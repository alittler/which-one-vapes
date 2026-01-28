
import React, { useState, useRef, useEffect } from 'react';
import { Location, Character } from '../../types';
import { Button } from '../ui/Button';
import { SmartText } from '../ui/SmartText';
import { 
  MapPin, ZoomIn, ZoomOut, Move, Navigation, 
  X, Image as ImageIcon, Plus, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Edit2, Save, Search, ChevronUp as UpIcon
} from 'lucide-react';

interface MapViewProps {
  locations: Location[];
  characters: Character[];
  rootMapImage?: string;
  rootMapScale?: number;
  rootMapUnit?: string;
  onUpdateRootMap?: (url: string) => void;
  onUpdateLocation: (location: Location) => void;
  onAddLocation: (location: Location) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onUpdateRootMapData?: (scale: number, unit: string) => void;
  currentMapParentId: string | null;
  setCurrentMapParentId: (id: string | null) => void;
}

declare const L: any; 

export const MapView: React.FC<MapViewProps> = ({ 
  locations, 
  characters, 
  rootMapImage,
  rootMapScale,
  rootMapUnit,
  onUpdateLocation,
  onAddLocation,
  onLinkClick,
  currentMapParentId,
  setCurrentMapParentId
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(0.1);
  
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [tempPinCoords, setTempPinCoords] = useState<{x: number, y: number} | null>(null);
  const [creatingLoc, setCreatingLoc] = useState<{x: number, y: number, lat?: number, lng?: number} | null>(null);
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState('Landmark');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tempMarkerRef = useRef<any>(null);

  const currentMapLocation = locations.find(l => l.id === currentMapParentId);
  const isRealWorld = !!currentMapLocation?.isRealWorld;
  const currentLocations = locations.filter(l => (currentMapParentId === null ? !l.parentId : l.parentId === currentMapParentId));

  useEffect(() => {
    if (isRealWorld && mapContainerRef.current) {
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current).setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapInstanceRef.current);
            mapInstanceRef.current.on('click', (e: any) => { setCreatingLoc({ x: 0, y: 0, lat: e.latlng.lat, lng: e.latlng.lng }); setNewLocName(''); });
        }
    } else if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }
  }, [isRealWorld, currentMapParentId]);

  useEffect(() => {
      if (isRealWorld && mapInstanceRef.current) {
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];
          currentLocations.forEach(loc => {
              if (loc.lat !== undefined && loc.lng !== undefined) {
                  const marker = L.marker([loc.lat, loc.lng]).addTo(mapInstanceRef.current);
                  marker.on('click', () => setSelectedPinId(loc.id));
                  markersRef.current.push(marker);
              }
          });
      }
  }, [isRealWorld, currentLocations]);

  let mapSrc = currentMapLocation?.mapImage || (!currentMapLocation ? rootMapImage : "");

  const handleWheel = (e: React.WheelEvent) => {
    if (isRealWorld || !mapSrc) return; 
    e.preventDefault();
    const newScale = Math.min(Math.max(minScale, scale * (1 + (-e.deltaY * 0.001))), 20); 
    setScale(newScale);
  };

  const pan = (dx: number, dy: number) => { if (!isRealWorld) setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy })); };
  const handleGoUp = () => { if (currentMapLocation) { setCurrentMapParentId(currentMapLocation.parentId || null); setScale(1); setOffset({x:0, y:0}); } };

  return (
    <div className="flex h-full bg-slate-900 relative overflow-hidden">
      
      {/* CONSOLIDATED HUD - Standard Rounded-md shapes */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-3 pointer-events-none w-72">
          {(currentMapParentId || isRealWorld) && (
              <button onClick={handleGoUp} className="pointer-events-auto w-fit bg-white p-2 rounded-md shadow-md text-slate-700 hover:text-primary flex items-center gap-2 transition-all active:scale-95 border border-slate-200">
                  <UpIcon size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Return Home</span>
              </button>
          )}

          {isRealWorld && (
              <form onSubmit={(e) => e.preventDefault()} className="pointer-events-auto flex bg-white rounded-md shadow-md overflow-hidden border border-slate-200 w-full">
                  <input className="px-4 py-2 text-sm outline-none w-full bg-transparent" placeholder="Lat, Lng Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <button className="bg-slate-50 px-4 text-slate-600 border-l border-slate-200"><Search size={18} /></button>
              </form>
          )}

          {!isRealWorld && mapSrc && (
            <div className="pointer-events-auto bg-white rounded-md shadow-md border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                <div className="p-2 bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mapped Objects</div>
                {currentLocations.map(l => (
                  <div key={l.id} onClick={() => setSelectedPinId(l.id)} className={`p-2 px-3 text-xs font-medium cursor-pointer transition-colors ${selectedPinId === l.id ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                      {l.name}
                  </div>
                ))}
            </div>
          )}
      </div>

      <div className="flex-1 relative overflow-hidden bg-slate-800">
          {isRealWorld ? <div ref={mapContainerRef} className="w-full h-full" /> : (
            <div className="w-full h-full" onWheel={handleWheel} onClick={() => setSelectedPinId(null)}>
                <img src={mapSrc} className="w-full h-full object-contain pointer-events-none select-none opacity-90" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }} />
                {currentLocations.map(loc => (
                  <div key={loc.id} style={{ left: `${loc.x}%`, top: `${loc.y}%`, position: 'absolute', transform: 'translate(-50%, -100%)' }}>
                     <MapPin size={24} className={selectedPinId === loc.id ? 'text-primary' : 'text-white'} fill={selectedPinId === loc.id ? 'currentColor' : 'none'} onClick={(e) => { e.stopPropagation(); setSelectedPinId(loc.id); }} />
                  </div>
                ))}
            </div>
          )}
      </div>

      {/* LEFT SIDE CONTROLS - Standard SaaS style */}
      {!isRealWorld && mapSrc && (
          <div className="absolute bottom-6 left-6 z-[400] flex flex-col gap-3 interactive-el">
             <div className="bg-white rounded-md p-1 shadow-md border border-slate-200 flex flex-col gap-1">
                <button className="p-2 hover:bg-slate-100 rounded text-slate-500" onClick={() => pan(0, 50)}><ArrowUp size={16} /></button>
                <div className="flex gap-1">
                   <button className="p-2 hover:bg-slate-100 rounded text-slate-500" onClick={() => pan(50, 0)}><ArrowLeft size={16} /></button>
                   <button className="p-2 hover:bg-slate-100 rounded text-slate-500" onClick={() => pan(-50, 0)}><ArrowRight size={16} /></button>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded text-slate-500" onClick={() => pan(0, -50)}><ArrowDown size={16} /></button>
             </div>
             <div className="flex flex-col gap-1 bg-white rounded-md p-1 shadow-md border border-slate-200">
                <button onClick={() => setScale(s => s * 1.2)} className="p-2 text-slate-500 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
                <button onClick={() => setScale(s => s / 1.2)} className="p-2 text-slate-500 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
             </div>
          </div>
      )}

      {/* Selected Entity Details Panel */}
      {selectedPinId && (
        <div className="absolute bottom-0 right-0 top-0 w-80 bg-white border-l border-slate-200 p-6 z-[500] shadow-xl animate-in slide-in-from-right">
           <div className="flex justify-between items-start mb-6">
               <h2 className="text-2xl font-serif font-bold text-slate-900">{locations.find(l => l.id === selectedPinId)?.name}</h2>
               <button onClick={() => setSelectedPinId(null)}><X size={20} className="text-slate-400" /></button>
           </div>
           
           {(() => {
               const loc = locations.find(l => l.id === selectedPinId);
               if (!loc) return null;
               const hasSubMap = !!loc.mapImage || !!loc.isRealWorld;
               return (
                 <div className="space-y-6">
                    <p className="text-slate-600 text-sm leading-relaxed">{loc.description}</p>
                    <div className="flex flex-col gap-2">
                       {hasSubMap && (
                          <Button className="w-full" onClick={() => { setCurrentMapParentId(loc.id); setSelectedPinId(null); setScale(1); }}>
                              <Search size={16} className="mr-2" /> Enter Local Map
                          </Button>
                       )}
                       <Button variant="secondary" onClick={() => onLinkClick('location', loc.id)}>Open Files</Button>
                    </div>
                 </div>
               );
           })()}
        </div>
      )}
    </div>
  );
};
