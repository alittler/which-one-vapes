
import React, { useState } from 'react';
import { TimelineEvent, Plotline, MatrixCell, ProjectData } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Grid2X2, Sparkles, X, Edit2, LayoutGrid, Check } from 'lucide-react';
import { analyzePlotMatrix } from '../../services/geminiService';

interface MatrixViewProps {
  events: TimelineEvent[];
  plotlines: Plotline[];
  cells: MatrixCell[];
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ 
  events, 
  plotlines, 
  cells, 
  onUpdateProject 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingCell, setEditingCell] = useState<{eventId: string, plotlineId: string} | null>(null);
  const [cellInput, setCellInput] = useState('');

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const handleAutoCategorize = async () => {
    setIsAnalyzing(true);
    try {
        const result = await analyzePlotMatrix(events);
        onUpdateProject({
            plotlines: result.plotlines,
            matrixCells: result.cells
        });
    } catch (e) {
        alert("Matrix analysis failed.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddPlotline = () => {
    const title = prompt("New Plotline Name (e.g. Romance Arc, Mystery Thread):");
    if (title) {
        const newPlotline: Plotline = {
            id: crypto.randomUUID(),
            title,
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };
        onUpdateProject({ plotlines: [...plotlines, newPlotline] });
    }
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    
    const nextCells = cells.filter(c => !(c.eventId === editingCell.eventId && c.plotlineId === editingCell.plotlineId));
    if (cellInput.trim()) {
        nextCells.push({ ...editingCell, content: cellInput });
    }
    
    onUpdateProject({ matrixCells: nextCells });
    setEditingCell(null);
    setCellInput('');
  };

  const getCellContent = (eventId: string, plotlineId: string) => {
    return cells.find(c => c.eventId === eventId && c.plotlineId === plotlineId)?.content || '';
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
         <div>
            <h3 className="text-white font-bold flex items-center gap-2">
               <Grid2X2 size={18} className="text-indigo-400"/>
               Narrative Matrix
            </h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Plottr-style Subplot Tracking</p>
         </div>
         <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={handleAutoCategorize} isLoading={isAnalyzing}>
               <Sparkles size={16} className="mr-2" />
               AI Categorize
            </Button>
            <Button size="sm" onClick={handleAddPlotline}>
               <Plus size={16} className="mr-2" />
               Add Plotline
            </Button>
         </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-950">
        <div className="inline-block min-w-full">
            <table className="border-collapse table-fixed">
                <thead>
                    <tr>
                        <th className="w-48 sticky left-0 z-30 bg-slate-900 border border-slate-800 p-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                           Plotlines ↓
                        </th>
                        {sortedEvents.map(event => (
                            <th key={event.id} className="w-64 bg-slate-900 border border-slate-800 p-4 text-left group">
                                <div className="text-[10px] text-indigo-400 font-bold mb-1 truncate">{event.date}</div>
                                <div className="text-white text-sm font-bold truncate">{event.title}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {plotlines.map(plotline => (
                        <tr key={plotline.id}>
                            <td className="sticky left-0 z-20 bg-slate-900 border border-slate-800 p-4 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 rounded-full" style={{ background: plotline.color }} />
                                    <span className="text-white font-bold text-sm truncate">{plotline.title}</span>
                                </div>
                            </td>
                            {sortedEvents.map(event => {
                                const content = getCellContent(event.id, plotline.id);
                                const isEditing = editingCell?.eventId === event.id && editingCell?.plotlineId === plotline.id;
                                
                                return (
                                    <td 
                                        key={`${event.id}-${plotline.id}`} 
                                        className={`border border-slate-800 p-3 align-top transition-colors cursor-pointer relative group ${content ? 'bg-slate-900/40' : 'hover:bg-slate-900/60'}`}
                                        onClick={() => {
                                            setEditingCell({ eventId: event.id, plotlineId: plotline.id });
                                            setCellInput(content);
                                        }}
                                    >
                                        {content ? (
                                            <div className="text-xs text-slate-300 leading-relaxed italic line-clamp-4">
                                                {content}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-700 opacity-0 group-hover:opacity-100 uppercase font-bold text-center py-4">
                                                Add Development
                                            </div>
                                        )}
                                        
                                        {isEditing && (
                                            <div className="absolute inset-0 z-50 bg-slate-800 p-2 shadow-2xl flex flex-col border-2 border-indigo-500 animate-in fade-in zoom-in-95">
                                                <textarea 
                                                    autoFocus
                                                    className="flex-1 bg-transparent text-white text-xs outline-none resize-none border-none p-1 font-sans"
                                                    value={cellInput}
                                                    onChange={e => setCellInput(e.target.value)}
                                                    placeholder="Describe the subplot progression..."
                                                    onKeyDown={e => { if(e.key === 'Enter' && e.ctrlKey) handleSaveCell(); }}
                                                />
                                                <div className="flex justify-end gap-1 pt-1 mt-auto">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingCell(null); }} className="p-1 hover:bg-slate-700 rounded"><X size={12} className="text-slate-400"/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleSaveCell(); }} className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded"><Check size={12} className="text-white"/></button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {plotlines.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-slate-600">
                    <LayoutGrid size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold">No plotlines defined.</p>
                    <p className="text-xs">Use AI Categorize or click 'Add Plotline' to begin mapping.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
