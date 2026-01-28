
import React, { useState, useRef, useEffect } from 'react';
import { Character, Location } from '../../types';
import { User, MapPin, ArrowRight, X } from 'lucide-react';

interface SmartTextProps {
  text: string;
  characters: Character[];
  locations: Location[];
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  className?: string;
}

interface EntityChipProps {
  text: string;
  entity: { name: string; id: string; type: 'character' | 'location' };
  character?: Character;
  location?: Location;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
}

const EntityChip: React.FC<EntityChipProps> = ({ text, entity, character, location, onLinkClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isLocation = entity.type === 'location';
  
  // Styling based on type
  const colorClass = isLocation 
    ? "text-emerald-700 bg-emerald-50/80 border-emerald-200" 
    : "text-blue-700 bg-blue-50/80 border-blue-200";
    
  const hoverClass = isLocation
    ? "hover:bg-emerald-100 hover:border-emerald-300"
    : "hover:bg-blue-100 hover:border-blue-300";

  // Data resolution
  const imageSrc = character?.imageUrl || location?.mapImage;
  const subtitle = character ? character.role : location?.type;
  const description = character ? character.description : location?.description;

  return (
    <span className="relative inline-block mx-0.5 align-middle">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          group inline-flex items-center px-1.5 py-0.5 rounded-md border text-sm font-semibold transition-all cursor-pointer leading-tight
          ${colorClass} ${hoverClass} ${isOpen ? 'ring-2 ring-offset-1 ring-primary/20' : ''}
        `}
      >
        <span className="opacity-70 mr-0.5">{isLocation ? '📍' : '@'}</span>
        {text.startsWith('@') ? text.substring(1) : text}
      </button>

      {/* Popover */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-0 overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image/Pattern */}
          <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 relative">
             {imageSrc ? (
                <img src={imageSrc} className="w-full h-full object-cover opacity-50" alt="Header" />
             ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                   {isLocation ? <MapPin size={32} /> : <User size={32} />}
                </div>
             )}
             <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-1 right-1 p-1 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
             >
                <X size={12} />
             </button>
          </div>

          <div className="px-4 pb-4 -mt-8 relative">
             {/* Avatar */}
             <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden mb-2 flex items-center justify-center">
                {imageSrc ? (
                   <img src={imageSrc} className="w-full h-full object-cover" alt={entity.name} />
                ) : (
                   <div className={`w-full h-full flex items-center justify-center ${isLocation ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'}`}>
                      {isLocation ? <MapPin size={24} /> : <User size={24} />}
                   </div>
                )}
             </div>

             {/* Content */}
             <div>
                <h4 className="font-bold text-slate-800 text-lg leading-tight">{entity.name}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{subtitle || 'Unknown'}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                   {description || 'No description available.'}
                </p>
                
                <button
                   onClick={(e) => {
                      e.stopPropagation();
                      onLinkClick(entity.type, entity.id);
                      setIsOpen(false);
                   }}
                   className="w-full py-2 bg-slate-900 hover:bg-primary text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                   View Details <ArrowRight size={12} />
                </button>
             </div>
          </div>
          
          {/* Little Triangle Pointer */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
        </div>
      )}
    </span>
  );
};

export const SmartText: React.FC<SmartTextProps> = ({ 
  text, 
  characters, 
  locations, 
  onLinkClick,
  className = "" 
}) => {
  if (!text) return null;

  // Build a comprehensive list of all searchable terms (names + aliases)
  const entities: { name: string; id: string; type: 'character' | 'location' }[] = [];

  // Add Characters and their Aliases
  characters.forEach(c => {
    if (c.name && c.name.trim()) {
      entities.push({ name: c.name, id: c.id, type: 'character' });
    }
    if (c.aliases && c.aliases.length > 0) {
      c.aliases.forEach(alias => {
        if (alias && alias.trim()) {
          entities.push({ name: alias, id: c.id, type: 'character' });
        }
      });
    }
  });

  // Add Locations
  locations.forEach(l => {
    if (l.name && l.name.trim()) {
      entities.push({ name: l.name, id: l.id, type: 'location' });
    }
  });

  // Sort by length (descending) so longer names match first
  entities.sort((a, b) => b.name.length - a.name.length);

  // If no entities, return text as is
  if (entities.length === 0) {
    return <div className={className}>{text}</div>;
  }

  // Escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Build regex:
  // Pattern: /((?:@)?\b(?:Name1|Name2|...)\b)/gi
  const pattern = new RegExp(`((?:@)?\\b(?:${entities.map(e => escapeRegExp(e.name)).join('|')})\\b)`, 'gi');

  const parts = text.split(pattern);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        // Clean up @ for lookup
        const cleanPart = part.startsWith('@') ? part.substring(1) : part;
        
        // Check if this part matches an entity
        const match = entities.find(e => e.name.toLowerCase() === cleanPart.toLowerCase());

        if (match) {
           // Find actual data object
           const character = match.type === 'character' ? characters.find(c => c.id === match.id) : undefined;
           const location = match.type === 'location' ? locations.find(l => l.id === match.id) : undefined;

           return (
              <EntityChip 
                 key={index}
                 text={part}
                 entity={match}
                 character={character}
                 location={location}
                 onLinkClick={onLinkClick}
              />
           );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};
