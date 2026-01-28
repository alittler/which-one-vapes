
import React, { useState, useRef, useEffect } from 'react';
import { Note, Character, Location } from '../../types';
import { Button } from '../ui/Button';
import { SmartText } from '../ui/SmartText';
import { Wand2, User, ListPlus, Trash2, Layers, Sparkles, X, NotebookPen, Loader2, CheckCircle2 } from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  characters: Character[];
  locations: Location[];
  onAddNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
  onAddDoubleProcessedNote: (text: string) => Promise<void>;
  isProcessing: boolean;
  activeTasks: string[];
}

export const NotesView: React.FC<NotesViewProps> = ({ 
  notes, 
  onAddNote, 
  onDeleteNote,
  characters = [], 
  locations = [],
  onLinkClick,
  onAddDoubleProcessedNote,
  isProcessing,
  activeTasks
}) => {
  const [input, setInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingStage, setProcessingStage] = useState<'none' | 'expanding' | 'extracting'>('none');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (isProcessing) {
        // Simple heuristic to cycle stages for visual feedback since the API is handled in App.tsx
        setProcessingStage('expanding');
        const timer = setTimeout(() => setProcessingStage('extracting'), 3000);
        return () => clearTimeout(timer);
    } else {
        setProcessingStage('none');
    }
  }, [isProcessing]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart;
    setCursorPos(cursor);
    
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9\s]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const matches = (characters || []).filter(c => 
        c.name.toLowerCase().includes(query)
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (charName: string) => {
    if (!textareaRef.current) return;
    const textBeforeCursor = input.slice(0, cursorPos);
    const textAfterCursor = input.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
        const prefix = textBeforeCursor.slice(0, lastAtIndex);
        const newValue = `${prefix}@${charName} ${textAfterCursor}`;
        setInput(newValue);
        setShowSuggestions(false);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = lastAtIndex + charName.length + 2; 
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    const currentInput = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onAddDoubleProcessedNote(currentInput);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Mobile-Friendly Header */}
      <div className="w-full max-w-2xl mx-auto px-4 py-4 md:py-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
             <NotebookPen size={24} className="text-primary"/> Notebook
           </h2>
           <div className="flex gap-2">
              <button onClick={() => setIsImporting(true)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"><ListPlus size={20}/></button>
              <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`p-2 transition-colors rounded-xl shadow-sm border ${isSelectionMode ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}><Layers size={20}/></button>
           </div>
        </div>
        
        {!isSelectionMode && (
          <div className="relative group animate-in slide-in-from-top-4 duration-300">
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                placeholder="Jot down a scene, a trait, or a fragment... (@ for characters)"
                className="w-full min-h-[100px] p-5 pr-14 focus:outline-none dark:text-white resize-none bg-transparent text-base md:text-lg font-medium leading-relaxed placeholder-slate-300"
                style={{ minHeight: '100px' }}
              />
              
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={handleSubmit} 
                  disabled={!input.trim() || isProcessing}
                  className={`w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all ${isProcessing ? 'animate-pulse opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:bg-indigo-700'}`}
                >
                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Wand2 size={24} />}
                </button>
              </div>

              {isProcessing && (
                <div className="absolute top-4 left-5 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-white/90 dark:bg-slate-900/90 py-1 px-3 rounded-full border border-primary/20 backdrop-blur-sm shadow-sm animate-in fade-in duration-300">
                   <Sparkles size={12} className="animate-pulse" />
                   {processingStage === 'expanding' ? 'Stage 1: Expanding Thoughts' : 'Stage 2: Architecting Structures'}
                </div>
              )}
            </div>

            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {suggestions.map(char => (
                        <button key={char.id} onClick={() => insertMention(char.name)} className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-4 transition-colors border-b dark:border-slate-700 last:border-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {char.imageUrl ? <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" /> : <User size={18} className="text-primary" />}
                            </div>
                            <div>
                                <div className="text-sm font-black dark:text-white tracking-tight">{char.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{char.role}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {notes.length === 0 && !isProcessing && (
            <div className="py-24 text-center text-slate-300 dark:text-slate-700 flex flex-col items-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                <Sparkles size={40} className="opacity-20 animate-pulse" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-xs">Waiting for the spark</p>
            </div>
          )}
          
          {notes.map((note) => {
            const isSelected = selectedIds.has(note.id);
            return (
              <div 
                 key={note.id} 
                 onClick={() => isSelectionMode && setSelectedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(note.id)) next.delete(note.id); else next.add(note.id);
                    return next;
                 })}
                 className={`bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border transition-all duration-300 relative group ${isSelectionMode ? 'cursor-pointer' : 'border-slate-100 dark:border-slate-800'} ${isSelected ? 'ring-4 ring-primary ring-offset-4 border-primary bg-primary/5' : 'hover:shadow-md'}`}
              >
                {!isSelectionMode && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 size={20} />
                  </button>
                )}
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">{tag}</span>
                    ))}
                    {note.expandedContent && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50">
                        <CheckCircle2 size={12}/> AI Double Processed
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{new Date(note.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="mb-6">
                  <p className="text-slate-800 dark:text-slate-200 text-lg md:text-xl leading-relaxed font-serif italic">
                    <SmartText text={note.content} characters={characters} locations={locations} onLinkClick={onLinkClick} />
                  </p>
                </div>

                {note.expandedContent && (
                  <div className="mt-8 space-y-6">
                    <div className="relative p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group/expand overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 text-[10px] font-black text-indigo-200 dark:text-indigo-900 uppercase tracking-widest pointer-events-none">Expansion</div>
                       <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Sparkles size={12}/> Stage 1: Narrative Engine</h4>
                       <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{note.expandedContent}</p>
                    </div>
                    {note.metaSummary && (
                      <div className="p-6 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                         <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">Stage 2: Architectural Data</h4>
                         <div className="text-sm text-emerald-900/80 dark:text-emerald-300 font-bold whitespace-pre-wrap leading-relaxed">{note.metaSummary}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
