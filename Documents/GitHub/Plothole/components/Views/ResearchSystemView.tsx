
import React from 'react';
import { ViewType, ProjectData, Note } from '../../types';
import { NotesView } from './NotesView';
import { NotebookPen } from 'lucide-react';

interface ResearchSystemViewProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  data: ProjectData;
  onAddNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onAddDoubleProcessedNote: (text: string) => Promise<void>;
  activeTasks: string[];
}

export const ResearchSystemView: React.FC<ResearchSystemViewProps> = ({
  currentView,
  data,
  onAddNote,
  onDeleteNote,
  onLinkClick,
  onAddDoubleProcessedNote,
  activeTasks
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
           <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <NotebookPen className="text-emerald-500" size={24} />
              Research & Notes
           </h2>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
        <div className="absolute inset-0 z-10 overflow-y-auto">
           <NotesView 
              notes={data.notes} 
              onAddNote={onAddNote} 
              onDeleteNote={onDeleteNote}
              characters={data.characters}
              locations={data.locations}
              onLinkClick={onLinkClick}
              onAddDoubleProcessedNote={onAddDoubleProcessedNote}
              isProcessing={activeTasks.some(t => t.startsWith('double-process'))}
           />
        </div>
      </div>
    </div>
  );
};
