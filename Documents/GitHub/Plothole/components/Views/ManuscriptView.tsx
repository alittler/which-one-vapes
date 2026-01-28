
import React, { useState, useEffect } from 'react';
import { Chapter } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Trash2, GripVertical, FileText, CheckCircle2, Circle } from 'lucide-react';

interface ManuscriptViewProps {
  chapters: Chapter[];
  onUpdateChapters: (chapters: Chapter[]) => void;
}

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({ 
  chapters, 
  onUpdateChapters 
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapters.length > 0 ? chapters[0].id : null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Derive active chapter object
  const activeChapter = chapters.find(c => c.id === selectedChapterId);

  // Ensure default sort
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const handleAddChapter = () => {
    // Fix: added scenes and wordCount properties to satisfy consolidated Chapter interface.
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: '',
      order: chapters.length,
      status: 'Draft',
      lastModified: Date.now(),
      scenes: [],
      wordCount: 0
    };
    onUpdateChapters([...chapters, newChapter]);
    setSelectedChapterId(newChapter.id);
  };

  const handleUpdateActiveChapter = (field: keyof Chapter, value: any) => {
    if (!activeChapter) return;
    const updated = { ...activeChapter, [field]: value, lastModified: Date.now() };
    const others = chapters.filter(c => c.id !== activeChapter.id);
    onUpdateChapters([...others, updated]);
  };

  const handleDeleteChapter = (id: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    const filtered = chapters.filter(c => c.id !== id);
    onUpdateChapters(filtered);
    if (selectedChapterId === id) {
        setSelectedChapterId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      
      {/* Chapter Sidebar */}
      <div className={`
         flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col
         ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}
      `}>
         <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Table of Contents</h3>
            <button onClick={handleAddChapter} className="text-primary hover:bg-primary/10 p-1 rounded transition-colors">
               <Plus size={18} />
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedChapters.map((chapter) => (
               <div 
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`
                     group flex items-center p-2 rounded-lg cursor-pointer text-sm transition-colors
                     ${selectedChapterId === chapter.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}
                  `}
               >
                  <GripVertical size={14} className="text-slate-300 mr-2 cursor-move opacity-0 group-hover:opacity-100" />
                  <div className="flex-1 truncate">
                     {chapter.title || 'Untitled Chapter'}
                  </div>
                  {chapter.status === 'Final' ? (
                     <CheckCircle2 size={14} className="text-green-500 ml-2" />
                  ) : (
                     <Circle size={14} className="text-slate-200 ml-2" />
                  )}
               </div>
            ))}
            {chapters.length === 0 && (
               <div className="text-center p-8 text-slate-400 italic text-xs">
                  No chapters yet.<br/>Click + to start writing.
               </div>
            )}
         </div>
         <div className="p-3 border-t border-slate-200 text-xs text-slate-400 text-center">
            Total Words: {chapters.reduce((acc, c) => acc + c.content.split(/\s+/).filter(w => w.length > 0).length, 0)}
         </div>
      </div>

      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col h-full relative">
         {/* Toggle Sidebar Button (Mobile/Desktop) */}
         <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute left-4 top-4 z-20 p-2 bg-white/50 hover:bg-white text-slate-400 hover:text-slate-700 rounded-full border border-slate-200 shadow-sm transition-colors"
         >
            <FileText size={18} />
         </button>

         {activeChapter ? (
            <div className="flex-1 overflow-y-auto bg-slate-50">
               <div className="max-w-3xl mx-auto min-h-full bg-white shadow-sm border-x border-slate-200 py-16 px-8 md:px-12">
                  
                  {/* Chapter Header */}
                  <div className="mb-8 group relative">
                     <input 
                        value={activeChapter.title}
                        onChange={(e) => handleUpdateActiveChapter('title', e.target.value)}
                        className="w-full text-4xl font-serif font-bold text-slate-900 border-none focus:ring-0 placeholder-slate-300 bg-transparent p-0"
                        placeholder="Chapter Title"
                     />
                     <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <select 
                           value={activeChapter.status}
                           onChange={(e) => handleUpdateActiveChapter('status', e.target.value)}
                           className="text-xs border border-slate-200 rounded p-1 bg-white"
                        >
                           <option value="Draft">Draft</option>
                           <option value="Revised">Revised</option>
                           <option value="Final">Final</option>
                        </select>
                        <button onClick={() => handleDeleteChapter(activeChapter.id)} className="text-red-400 hover:text-red-600 p-1">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>

                  {/* Editor */}
                  <textarea 
                     value={activeChapter.content}
                     onChange={(e) => handleUpdateActiveChapter('content', e.target.value)}
                     placeholder="Start writing your masterpiece..."
                     className="w-full h-[calc(100vh-300px)] resize-none border-none focus:ring-0 text-lg leading-relaxed text-slate-800 font-serif placeholder-slate-300 bg-transparent"
                     style={{ minHeight: '60vh' }}
                  />
                  
                  <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                     <span>Last saved: {new Date(activeChapter.lastModified).toLocaleTimeString()}</span>
                     <span>{activeChapter.content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                  </div>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} className="opacity-20" />
               </div>
               <h2 className="text-xl font-bold text-slate-600 mb-2">Select a Chapter</h2>
               <p className="max-w-xs text-center mb-6">Select a chapter from the sidebar or create a new one to begin writing.</p>
               <Button onClick={handleAddChapter}>Create First Chapter</Button>
            </div>
         )}
      </div>
    </div>
  );
};
