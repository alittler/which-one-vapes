
import React, { useState, useMemo } from 'react';
import { ProjectData, Note } from '../../types';
import { 
  FileText, Clock, Users, MapPin, Calendar, Book, Info, Download, 
  ImageIcon, Sparkles, Tag, GitCommit, Eye, Zap, Layers, ChevronRight,
  History, Activity, Quote, Wand2, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DashboardViewProps {
  projectData: ProjectData;
  globalNotes: Note[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateManuscript: (file: File) => void;
  onRescanManuscript: (file: File) => void;
  onExportManuscript: () => void;
  onImportManuscript: (file: File) => void;
  onLoadSample: () => void;
  isAnalyzing: boolean;
  error: string | null;
  onUpdateMetadata: (title: string, author: string, portraitStyle?: string) => void;
  onExport: () => void;
  onAnalyzeText: (text: string) => void;
  onRestoreHistory: (historyId: string) => void;
  onGenerateCover: () => Promise<void>;
  isGeneratingCover?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  projectData, 
  onExportManuscript,
  isAnalyzing,
  onUpdateMetadata,
  onAnalyzeText,
  onGenerateCover,
  isGeneratingCover
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(projectData.title);
  const [author, setAuthor] = useState(projectData.author || '');

  const stats = useMemo(() => {
    const text = projectData.latestManuscriptText || "";
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return { 
      words, 
      chars: projectData.characters.length,
      locs: projectData.locations.length,
      events: projectData.timeline.length,
      lore: projectData.lore?.length || 0,
      themes: projectData.themes.length,
      lastMod: projectData.lastModified
    };
  }, [projectData]);

  const handleSave = () => {
    onUpdateMetadata(title, author);
    setIsEditing(false);
  };

  const fingerprint = useMemo(() => {
    return projectData.id.slice(0, 8).toUpperCase();
  }, [projectData.id]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-32">
      <div className="h-80 md:h-[450px] w-full relative bg-slate-900 overflow-hidden">
        {projectData.coverImage ? (
           <img src={projectData.coverImage} className="w-full h-full object-cover opacity-80" alt="Book Cover" />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]">
              <ImageIcon size={64} className="opacity-20 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Visualizer Offline</p>
              {projectData.summary && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-4 text-white hover:bg-white/10" 
                  onClick={onGenerateCover}
                  isLoading={isGeneratingCover}
                >
                  <Sparkles size={16} className="mr-2" /> Generate Poetic Cover
                </Button>
              )}
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg">Story World</span>
                 <span className="text-white/40 text-[10px] font-mono bg-black/20 px-2 py-1 rounded">ID: {fingerprint}</span>
              </div>
              {isEditing ? (
                <div className="flex flex-col gap-4 max-w-xl bg-slate-900/90 backdrop-blur-md p-6 rounded-md border border-white/10 shadow-2xl animate-in zoom-in-95">
                   <input value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent border-b border-white/20 text-white text-4xl font-serif font-bold outline-none focus:border-primary transition-colors" placeholder="Story Title" />
                   <input value={author} onChange={e => setAuthor(e.target.value)} className="bg-transparent border-b border-white/20 text-white text-xl outline-none focus:border-primary transition-colors" placeholder="Author Name" />
                   <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSave}>Apply Changes</Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsEditing(false)}>Cancel</Button>
                   </div>
                </div>
              ) : (
                <div className="group cursor-pointer max-w-3xl" onClick={() => setIsEditing(true)}>
                   <h1 className="text-4xl md:text-7xl font-serif font-bold text-white drop-shadow-2xl mb-2 flex items-center gap-4">
                      {projectData.title}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Wand2 size={24} className="text-white/40" /></span>
                   </h1>
                   <p className="text-indigo-200 text-xl md:text-2xl font-medium tracking-wide drop-shadow-md italic">{projectData.author || 'Architect Unknown'}</p>
                </div>
              )}
           </div>
           
           <div className="flex flex-col gap-4 items-end">
              {projectData.coverImage && (
                <Button 
                   size="sm" 
                   variant="ghost" 
                   className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                   onClick={onGenerateCover}
                   isLoading={isGeneratingCover}
                >
                   <RefreshCw size={14} className={`mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} /> Re-visualize
                </Button>
              )}
              <div className="flex items-center gap-6 text-white/60 text-[11px] font-black uppercase tracking-[0.2em] bg-black/20 backdrop-blur-sm p-3 rounded-md">
                 <span className="flex items-center gap-2"><FileText size={16} className="text-primary"/> {stats.words.toLocaleString()} Words</span>
                 <span className="flex items-center gap-2"><Clock size={16} className="text-primary"/> {new Date(stats.lastMod).toLocaleDateString()}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-3 space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Core Cast', val: stats.chars, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                 { label: 'Geography', val: stats.locs, icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                 { label: 'Beat Events', val: stats.events, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                 { label: 'Lore Objects', val: stats.lore, icon: Book, color: 'text-amber-500', bg: 'bg-amber-500/10' }
               ].map(s => (
                 <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                    <div className={`${s.bg} ${s.color} p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                       <s.icon size={28} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{s.val}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-full">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                    <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
                       <Quote size={14} className="text-primary" /> Executive Abstract
                    </h3>
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-serif italic">
                       {projectData.summary || "Story summary is currently empty. Run a manuscript scan to extract high-level plot data and thematic arcs."}
                    </p>
                    
                    {projectData.themes.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Central Thematic Pillars</h4>
                         <div className="flex flex-wrap gap-2">
                            {projectData.themes.map(t => (
                               <span key={t} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md text-[11px] font-bold border border-indigo-100 dark:border-indigo-900">{t}</span>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
                       <Users size={14} className="text-purple-500" /> Cast Highlights
                    </h3>
                    <div className="space-y-4">
                       {projectData.characters.slice(0, 3).map(c => (
                          <div key={c.id} className="flex items-center gap-4 group">
                             <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover" /> : <Users className="m-auto text-slate-400" size={20} />}
                             </div>
                             <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-primary transition-colors">{c.name}</div>
                                <div className="text-xs text-slate-500 truncate">{c.role}</div>
                             </div>
                             <ChevronRight size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                       ))}
                       {projectData.characters.length > 3 && (
                          <p className="text-[10px] text-slate-400 text-center pt-2 font-bold uppercase tracking-widest">+ {projectData.characters.length - 3} Additional Entities Registry</p>
                       )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
                       <Activity size={14} className="text-rose-500" /> Narrative Pulse
                    </h3>
                    <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                       {projectData.timeline.slice(0, 3).map(e => (
                          <div key={e.id} className="relative pl-6">
                             <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-rose-400 z-10" />
                             <div className="text-[10px] font-black text-rose-500 uppercase mb-0.5">{e.date}</div>
                             <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{e.title}</div>
                          </div>
                       ))}
                       {projectData.timeline.length === 0 && (
                          <div className="text-center py-4 text-slate-400 text-xs italic">Chronological timeline currently silent.</div>
                       )}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Layers size={18} className="text-primary" /> Data Management
               </h3>
               <div className="space-y-3">
                  <Button onClick={onExportManuscript} variant="secondary" className="w-full justify-start py-3 rounded-lg">
                     <Download size={16} className="mr-3 text-primary" /> Raw Source Download
                  </Button>
                  <Button onClick={() => onAnalyzeText(projectData.latestManuscriptText || '')} variant="secondary" className="w-full justify-start py-3 rounded-lg" isLoading={isAnalyzing}>
                     <RefreshCw size={16} className={`mr-3 text-primary ${isAnalyzing ? 'animate-spin' : ''}`} /> Semantic Rescan
                  </Button>
                  <p className="text-[10px] text-slate-400 leading-relaxed px-1">Archive the system in Settings for a full project backup including Manuscript Vault history.</p>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <History size={18} className="text-primary" /> Version Vault
               </h3>
               <div className="space-y-2">
                  {projectData.manuscriptHistory?.slice(0, 5).map(h => (
                     <button key={h.id} className="w-full text-left p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{new Date(h.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{h.filename}</div>
                     </button>
                  ))}
                  {!projectData.manuscriptHistory?.length && <p className="text-xs text-slate-400 italic">No upload history.</p>}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
