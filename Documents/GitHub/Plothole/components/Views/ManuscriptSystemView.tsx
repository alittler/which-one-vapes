
import React from 'react';
import { ViewType, ProjectData, Chapter, Note, Location, Character } from '../../types';
import { ManuscriptView } from './ManuscriptView';
import { DataProcessorView } from './DataProcessorView';
import { SourceReaderView } from './SourceReaderView';
import { TableView } from './TableView';
import { FileText, Wand2, BookOpen, Table as TableIcon } from 'lucide-react';

interface ManuscriptSystemViewProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  data: ProjectData;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onAddNote: (note: Note) => void;
  onAddLocation: (location: Location) => void;
  onAddCharacter: (character: Character) => void;
}

export const ManuscriptSystemView: React.FC<ManuscriptSystemViewProps> = ({
  currentView,
  onChangeView,
  data,
  onUpdateChapters,
  onAddNote,
  onAddLocation,
  onAddCharacter
}) => {
  const tabs = [
    { id: ViewType.MANUSCRIPT, label: 'Chapters', icon: FileText },
    { id: ViewType.PROCESSOR, label: 'Processor', icon: Wand2 },
    { id: ViewType.SOURCE_READER, label: 'Source Reader', icon: BookOpen },
    { id: ViewType.TABLE, label: 'Raw Data', icon: TableIcon },
  ];

  const renderContent = () => {
    switch (currentView) {
      case ViewType.PROCESSOR:
        return <DataProcessorView onAddNote={onAddNote} onAddLocation={onAddLocation} onAddCharacter={onAddCharacter} initialText={data.latestManuscriptText} />;
      case ViewType.SOURCE_READER:
        return <SourceReaderView text={data.latestManuscriptText} />;
      case ViewType.TABLE:
        return <TableView events={data.timeline} locations={data.locations} />;
      default:
        return <ManuscriptView chapters={data.chapters || []} onUpdateChapters={onUpdateChapters} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
         <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
               <FileText className="text-indigo-500" size={24} />
               Manuscript Hub
            </h2>
         </div>

         <div className="px-6 flex items-end space-x-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
               const isActive = currentView === tab.id;
               return (
               <button
                  key={tab.id}
                  onClick={() => onChangeView(tab.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${isActive ? `border-primary text-primary bg-primary/5` : `border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`}`}
               >
                  <tab.icon size={12} />
                  {tab.label}
               </button>
               );
            })}
         </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
         {renderContent()}
      </div>
    </div>
  );
};
