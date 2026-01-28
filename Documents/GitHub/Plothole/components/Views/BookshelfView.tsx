
import React, { useState, useEffect, useRef } from 'react';
import { ProjectMetadata, User } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Book, Trash2, Clock, Users, MapPin, X, Upload, FileText, Zap, LayoutDashboard, NotebookPen, AlertTriangle, Check } from 'lucide-react';

interface BookshelfViewProps {
  projects: ProjectMetadata[];
  activeProjectId: string;
  currentUser: User;
  onSelectProject: (id: string) => Promise<any>;
  onCreateProject: (title: string, author: string, useSample: boolean) => Promise<void>;
  onUploadProject: (file: File) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject?: (id: string, data: Partial<ProjectMetadata>) => void;
  isAnalyzing?: boolean;
  onOpenDashboard: () => void;
}

export const BookshelfView: React.FC<BookshelfViewProps> = ({ 
  projects, 
  activeProjectId,
  currentUser,
  onSelectProject, 
  onCreateProject, 
  onUploadProject,
  onDeleteProject,
  isAnalyzing,
  onOpenDashboard
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [newProjectMeta, setNewProjectMeta] = useState({ title: '', author: currentUser.name, useSample: false });
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreating(false);
        setDeletingProjectId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleOpenDashboard = async (id: string) => {
      if (deletingProjectId === id) return;
      setLoadingProjectId(id);
      try {
          await onSelectProject(id);
          onOpenDashboard();
      } catch (err) {
          console.error("Failed to load project", err);
      } finally {
          setLoadingProjectId(null);
      }
  };

  const handleOpenNotebook = async (id: string) => {
      if (deletingProjectId === id) return;
      setLoadingProjectId(id);
      try {
          await onSelectProject(id);
      } catch (err) {
          console.error("Failed to load project", err);
      } finally {
          setLoadingProjectId(null);
      }
  };

  const confirmDelete = (id: string) => {
      onDeleteProject(id);
      setDeletingProjectId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUploadProject(file);
      e.target.value = ''; 
  };

  const handleSampleToggle = (checked: boolean) => {
    setNewProjectMeta(prev => ({
        ...prev, 
        useSample: checked,
        title: checked && (!prev.title || prev.title === 'Untitled Project') ? 'The Chronicles of Oakhaven' : prev.title
    }));
  };

  const submitNewProject = async (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!newProjectMeta.title.trim()) return;
     
     setIsInitializing(true);
     try {
        await onCreateProject(newProjectMeta.title, newProjectMeta.author, newProjectMeta.useSample);
        setIsCreating(false);
        setNewProjectMeta({ title: '', author: currentUser.name, useSample: false });
     } catch (err) {
        console.error("Project init failed", err);
     } finally {
        setIsInitializing(false);
     }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">My Library</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your story worlds and manuscripts.</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-3">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.zip,.json" onChange={handleFileChange} />
                        <Button onClick={() => fileInputRef.current?.click()} size="lg" isLoading={isAnalyzing} className="shadow-lg shadow-primary/20 rounded-full px-8">
                            <Upload size={20} className="mr-2" /> Upload Manuscript
                        </Button>
                        <Button onClick={() => setIsCreating(true)} size="lg" variant="secondary" className="shadow-lg rounded-full px-8 dark:bg-slate-800 dark:text-slate-200">
                            <Plus size={20} className="mr-2" /> New Novel
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-12 lg:gap-16 pb-20">
                {projects.map(project => {
                    const isActive = activeProjectId === project.id;
                    const isLoading = loadingProjectId === project.id;
                    const isDeleting = deletingProjectId === project.id;
                    
                    return (
                    <div 
                        key={project.id}
                        className={`
                        relative aspect-[3/4] bg-white dark:bg-slate-900 rounded-r-[2.5rem] rounded-l-lg shadow-xl transition-all duration-500 group select-none max-w-[450px] mx-auto w-full max-h-[75vh]
                        ${isActive ? 'ring-4 ring-primary ring-offset-4' : 'hover:shadow-2xl hover:-translate-y-3'}
                        ${isLoading ? 'opacity-70 grayscale' : ''}
                        `}
                    >
                        {/* Book Spine */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-10 bg-gradient-to-r from-slate-300 to-slate-100 dark:from-slate-700 dark:to-slate-800 z-20 rounded-l-lg border-r border-slate-300 dark:border-slate-700 shadow-inner"></div>

                        {/* Content Area - Clickable */}
                        <div 
                            onClick={() => handleOpenDashboard(project.id)}
                            className="absolute inset-0 left-8 md:left-10 bg-slate-200 dark:bg-slate-800 rounded-r-[2.5rem] overflow-hidden shadow-sm cursor-pointer z-10"
                        >
                            {project.coverImage ? (
                                <img src={project.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center p-12 text-center">
                                    <Book size={80} className="text-white/10 mb-8" />
                                    <h3 className="text-white font-serif font-bold text-4xl leading-tight line-clamp-3 px-4">{project.title}</h3>
                                </div>
                            )}

                            {/* Detailed Info HUD */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-10 pt-32 z-10">
                                <h3 className="text-white font-bold font-serif text-3xl leading-tight line-clamp-2 drop-shadow-2xl mb-4 group-hover:text-primary transition-colors">{project.title}</h3>
                                <div className="flex items-center gap-8 text-xs text-white/60 font-black uppercase tracking-[0.2em]">
                                   <span className="flex items-center gap-2.5"><Users size={16} className="text-indigo-400"/> {project.characterCount}</span>
                                   <span className="flex items-center gap-2.5"><MapPin size={16} className="text-emerald-400"/> {project.locationCount}</span>
                                   <span className="ml-auto flex items-center gap-2.5 opacity-40"><Clock size={16}/> {new Date(project.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Control Bar - High Z-index to block card click */}
                        <div className="absolute inset-x-0 top-0 left-8 md:left-10 p-6 flex justify-between items-start z-30 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingProjectId(project.id); }}
                                className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-3xl shadow-xl transition-all hover:scale-110 active:scale-95 z-40"
                                title="Delete Project"
                             >
                                <Trash2 size={24} />
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenNotebook(project.id); }}
                                className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl shadow-xl transition-all hover:scale-110 active:scale-95 z-40"
                                title="Open Notebook"
                             >
                                <NotebookPen size={24} />
                             </button>
                        </div>

                        {/* Inline Delete Confirmation Overlay */}
                        {isDeleting && (
                            <div className="absolute inset-0 left-8 md:left-10 bg-slate-900/95 backdrop-blur-sm z-[100] rounded-r-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/10">
                                    <AlertTriangle size={32} />
                                </div>
                                <h4 className="text-white font-bold text-xl mb-2">Delete Permanently?</h4>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">This will wipe all characters, maps, and manuscripts for <span className="text-white font-bold">"{project.title}"</span>. This cannot be undone.</p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <Button onClick={() => confirmDelete(project.id)} variant="danger" className="w-full rounded-2xl py-4 font-bold shadow-lg shadow-red-900/40">
                                        <Trash2 size={18} className="mr-2" /> Yes, Erase Everything
                                    </Button>
                                    <Button onClick={() => setDeletingProjectId(null)} variant="ghost" className="w-full text-slate-300 hover:text-white py-4 font-bold">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    );
                })}

                {/* Big Upload Card */}
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-r-[2.5rem] rounded-l-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all group max-w-[450px] mx-auto w-full max-h-[75vh]"
                >
                    <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center mb-8 transition-all duration-500 shadow-sm group-hover:scale-110">
                        <Upload size={56} />
                    </div>
                    <span className="font-serif font-bold text-2xl">Upload Novel</span>
                </button>
            </div>
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                  <form onSubmit={submitNewProject} className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">New World Blueprint</h3>
                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={28} /></button>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Title</label>
                        <input className="w-full border dark:border-slate-700 rounded-2xl px-5 py-4 text-lg outline-none focus:ring-4 focus:ring-primary/10 shadow-inner bg-slate-50 dark:bg-slate-800 dark:text-white transition-all" placeholder="The Silent Archives" value={newProjectMeta.title} onChange={e => setNewProjectMeta({...newProjectMeta, title: e.target.value})} autoFocus required />
                    </div>

                    <label className="flex items-center gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 cursor-pointer group hover:bg-indigo-100/50 transition-colors">
                        <input type="checkbox" className="w-6 h-6 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500" checked={newProjectMeta.useSample} onChange={e => handleSampleToggle(e.target.checked)} />
                        <div>
                            <div className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Seed with Sample World</div>
                            <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400">Inject characters like Arthur Penhaligon & locations.</p>
                        </div>
                    </label>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button type="submit" disabled={!newProjectMeta.title.trim() || isInitializing} isLoading={isInitializing} size="lg" className="w-full rounded-2xl py-5 text-lg font-bold shadow-xl shadow-primary/20">Initialize World</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="w-full text-slate-500 font-bold">Nevermind</Button>
                    </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
