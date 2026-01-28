
import React from 'react';
import { ViewType, ProjectData, CalendarSystem, TimelineEvent } from '../../types';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import { BoardView } from './BoardView';
import { PlotAnalysisView } from './PlotAnalysisView';
import { MatrixView } from './MatrixView';
import { Clock, Calendar, KanbanSquare, LineChart, Grid2X2 } from 'lucide-react';

interface PlotSystemViewProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  data: ProjectData;
  onUpdateCalendar: (cal: CalendarSystem) => void;
  onSetActiveCalendar: (id: string) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onAddTimelineEvent: (event: TimelineEvent) => void;
  onUpdateTimelineEvent: (event: TimelineEvent) => void;
  onAnalyzePlot: () => void;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

export const PlotSystemView: React.FC<PlotSystemViewProps> = ({
  currentView,
  onChangeView,
  data,
  onUpdateCalendar,
  onSetActiveCalendar,
  onLinkClick,
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onAnalyzePlot,
  onUpdateProject
}) => {
  
  const tabs = [
    { id: ViewType.TIMELINE, label: 'Timeline', icon: Clock },
    { id: ViewType.MATRIX, label: 'Matrix', icon: Grid2X2 },
    { id: ViewType.CALENDAR, label: 'Calendar', icon: Calendar },
    { id: ViewType.BOARD, label: 'Story Board', icon: KanbanSquare },
    { id: ViewType.PLOT_ANALYSIS, label: 'Analytical Arc', icon: LineChart },
  ].filter(tab => !data.hiddenViews?.includes(tab.id));

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
         <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
               <Clock className="text-rose-500" size={24} />
               Continuity Hub
            </h2>
         </div>

         <div className="px-6 flex items-end space-x-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
               const isActive = currentView === tab.id;
               return (
               <button
                  key={tab.id}
                  onClick={() => onChangeView(tab.id)}
                  className={`
                     px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2
                     ${isActive 
                        ? `border-primary text-primary bg-primary/5` 
                        : `border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`
                     }
                  `}
               >
                  <tab.icon size={14} />
                  {tab.label}
               </button>
               );
            })}
         </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
        <div className={`absolute inset-0 overflow-y-auto ${currentView === ViewType.TIMELINE ? 'z-10' : 'z-0 hidden'}`}>
           <TimelineView 
              events={data.timeline} 
              characters={data.characters}
              locations={data.locations}
              onLinkClick={onLinkClick}
              onAddEvent={onAddTimelineEvent}
              onUpdateEvent={onUpdateTimelineEvent}
           />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.MATRIX ? 'z-10' : 'z-0 hidden'}`}>
           <MatrixView 
              events={data.timeline} 
              plotlines={data.plotlines || []}
              cells={data.matrixCells || []}
              onUpdateProject={onUpdateProject}
           />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.CALENDAR ? 'z-10' : 'z-0 hidden'}`}>
           <CalendarView 
              events={data.timeline} 
              characters={data.characters} 
              locations={data.locations}
              calendars={data.calendars}
              activeCalendarId={data.activeCalendarId}
              onUpdateCalendar={onUpdateCalendar}
              onSetActiveCalendar={onSetActiveCalendar}
              onLinkClick={onLinkClick}
           />
        </div>
        <div className={`absolute inset-0 ${currentView === ViewType.BOARD ? 'z-10' : 'z-0 hidden'}`}>
           <BoardView 
              events={data.timeline} 
              characters={data.characters} 
              locations={data.locations}
              onLinkClick={onLinkClick}
           />
        </div>
        <div className={`absolute inset-0 overflow-y-auto ${currentView === ViewType.PLOT_ANALYSIS ? 'z-10' : 'z-0 hidden'}`}>
           <PlotAnalysisView 
              beats={data.plotBeats || []} 
              sentiment={data.sentimentArc || []}
              plotHoles={data.plotHoles || []}
              onRunAnalysis={onAnalyzePlot}
           />
        </div>
      </div>
    </div>
  );
};
