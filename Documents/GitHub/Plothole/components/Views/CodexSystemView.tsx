
import React, { useState } from 'react';
import { ViewType, ProjectData, Artifact, LoreEntry, Note, Character, Location } from '../../types';
import { InventoryView } from './InventoryView';
import { EncyclopediaView } from './EncyclopediaView';
import { GalleryView } from './GalleryView';
import { DataProcessorView } from './DataProcessorView';
import { SourceReaderView } from './SourceReaderView';
import { TableView } from './TableView';
import { Package, Book, Image as ImageIcon, Wand2, FileText, Table as TableIcon } from 'lucide-react';

interface CodexSystemViewProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  data: ProjectData;
  onAddArtifact: (item: Artifact) => void;
  onUpdateArtifact: (item: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
  onAddLore: (entry: LoreEntry) => void;
  onDeleteLore: (id: string) => void;
  onAddNote: (note: Note) => void;
  onAddLocation: (location: Location) => void;
  onAddCharacter: (character: Character) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  processorInitialText?: string;
}

export const CodexSystemView: React.FC<CodexSystemViewProps> = ({
  currentView,
  onChangeView,
  data,
  onAddArtifact,
  onUpdateArtifact,
  onDeleteArtifact,
  onAddLore,
  onDeleteLore,
  onAddNote,
  onAddLocation,
  onAddCharacter,
  onLinkClick,
  processorInitialText
}) => {
  
  const tabs = [
    { id: ViewType.ENCYCLOPEDIA, label: 'Encyclopedia', icon: Book },
    { id: ViewType.INVENTORY, label: 'Artifacts', icon: Package },
    { id: ViewType.TABLE, label: 'Raw Data', icon: TableIcon },
    { id: ViewType.SOURCE_READER, label: 'Sources', icon: FileText },
    { id: ViewType.GALLERY, label: 'Gallery', icon: ImageIcon },
    { id: ViewType.PROCESSOR, label: 'Processor', icon: Wand2 }
  ].filter(tab => !data.hiddenViews?.includes(tab.id));

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
         <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
               <Book className="text-amber-500" size={24} />
               Project Codex
            </h2>
         </div>

         <div className="px-6 flex items-end space-x-2 overflow-x-auto no-scrollbar pb-3">
            {tabs.map(tab => {
               const isActive = currentView === tab.id;
               return (
               <button
                  key={tab.id}
                  onClick={() => onChangeView(tab.id)}
                  className={`
                     px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                     ${isActive 
                        ? `bg-primary text-white shadow-md shadow-primary/20` 
                        : `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700`
                     }
                  `}
               >
                  <tab.icon size={16} />
                  {tab.label}
               </button>
               );
            })}
         </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
        <div className={`absolute inset-0 ${currentView === ViewType.INVENTORY ? 'z-10' : 'z-0 hidden'}`}>
            <InventoryView 
                artifacts={data.artifacts || []}
                characters={data.characters}
                onAddArtifact={onAddArtifact}
                onUpdateArtifact={onUpdateArtifact}
                onDeleteArtifact={onDeleteArtifact}
            />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.ENCYCLOPEDIA ? 'z-10' : 'z-0 hidden'}`}>
            <EncyclopediaView lore={data.lore || []} onAddLore={onAddLore} onDeleteLore={onDeleteLore} />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.TABLE ? 'z-10' : 'z-0 hidden'}`}>
            <TableView events={data.timeline} locations={data.locations} />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.SOURCE_READER ? 'z-10' : 'z-0 hidden'}`}>
            <SourceReaderView text={data.latestManuscriptText} />
        </div>
        <div className={`absolute inset-0 overflow-y-auto ${currentView === ViewType.GALLERY ? 'z-10' : 'z-0 hidden'}`}>
            <GalleryView data={data} />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.PROCESSOR ? 'z-10' : 'z-0 hidden'}`}>
            <DataProcessorView onAddNote={onAddNote} onAddLocation={onAddLocation} onAddCharacter={onAddCharacter} initialText={processorInitialText} />
        </div>
      </div>
    </div>
  );
};
