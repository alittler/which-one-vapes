
import React, { useState, useEffect, useRef } from 'react';
import { Note, Location, Character } from '../../types';
import { processRawNotes } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Wand2, Save, X, MapPin, Link as LinkIcon, StickyNote, User, Lightbulb, FileText, Upload, AlignLeft } from 'lucide-react';

interface DataProcessorViewProps {
  onAddNote: (note: Note) => void;
  onAddLocation: (location: Location) => void;
  onAddCharacter: (character: Character) => void;
  initialText?: string;
}

export const DataProcessorView: React.FC<DataProcessorViewProps> = ({ 
  onAddNote, 
  onAddLocation,
  onAddCharacter,
  initialText = ''
}) => {
  const [input, setInput] = useState(initialText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{content: string, category: string, tags: string[], analysis: string}[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText) setInput(initialText);
  }, [initialText]);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const cleanText = (text: string) => {
    // 1. Remove script and style tags and their content
    let cleaned = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
    
    // 2. Strip remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, "");
    
    // 3. Decode common entities (basic)
    cleaned = cleaned.replace(/&nbsp;/g, " ")
                     .replace(/&amp;/g, "&")
                     .replace(/&lt;/g, "<")
                     .replace(/&gt;/g, ">")
                     .replace(/&quot;/g, '"');

    // 4. Collapse multiple whitespace
    return cleaned.replace(/\n\s*\n/g, '\n\n').trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                let text = ev.target?.result as string;
                // Use DOMParser for robust HTML extraction if explicit HTML file
                if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html') {
                    try {
                        const doc = new DOMParser().parseFromString(text, 'text/html');
                        text = doc.body.textContent || doc.body.innerText || "";
                    } catch (err) {
                        console.warn("Failed to parse HTML, using raw text", err);
                    }
                }
                // Run cleaner
                const cleaned = cleanText(text);
                resolve(cleaned);
            };
            reader.readAsText(file);
        });
    };

    try {
        const contents = await Promise.all(Array.from(files).map(readFile));
        const combinedText = contents.join('\n\n--------------------------------------------------\n\n');
        
        setInput(prev => {
            const separator = prev && prev.trim().length > 0 ? '\n\n--------------------------------------------------\n\n' : '';
            return prev + separator + combinedText;
        });
    } catch (error) {
        console.error("Error reading files", error);
        alert("Failed to read some files.");
    }
    
    // Reset input so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    
    // Clean input to remove accidental website code copy-pastes
    const processedInput = cleanText(input);
    
    // Update input view with cleaned text if it changed significantly
    if (Math.abs(processedInput.length - input.length) > 50) {
        setInput(processedInput);
    }

    // 1. Auto-save the raw text as a source file
    const sourceId = crypto.randomUUID();
    onAddNote({
        id: sourceId,
        content: processedInput,
        tags: ['#source-text'],
        timestamp: Date.now(),
        aiAnalysis: 'Raw source text automatically saved during processing.'
    });

    try {
      const processed = await processRawNotes(processedInput);
      setResults(processed);
    } catch (e) {
      alert("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = () => {
    if (!results) return;
    
    results.forEach(item => {
        handleSaveItem(item);
    });
    
    // Clear after save
    setResults(null);
    setInput('');
    alert("All extracted items saved to project.");
  };

  const handleSaveItem = (item: {content: string, category: string, tags: string[], analysis: string}, typeOverride?: 'Character' | 'Location' | 'Note') => {
      const cat = typeOverride ? typeOverride.toLowerCase() : item.category.toLowerCase();
      
      // Auto-create Location if category matches
      if (cat.includes('location') && item.content.length < 50) {
          onAddLocation({
              id: crypto.randomUUID(),
              name: item.content,
              type: 'Region', // Default
              description: item.analysis || 'Imported via Data Processor',
              source: 'ai'
          });
      } else if (cat.includes('character') && item.content.length < 50) {
          onAddCharacter({
              id: crypto.randomUUID(),
              name: item.content,
              role: 'Unknown',
              description: item.analysis || 'Imported via Data Processor',
              traits: [],
              source: 'ai'
          } as Character);
      } else {
          // Default to Note for everything else (Story, URL, Concept, General)
          const tags = Array.from(new Set([
              ...item.tags, 
              `#${cat.replace(/\s+/g, '')}`
          ]));
          
          if (cat.includes('concept')) {
              tags.push('#concept');
          }

          onAddNote({
              id: crypto.randomUUID(),
              content: item.content,
              tags: tags,
              aiAnalysis: item.analysis,
              timestamp: Date.now()
          });
      }
  };

  const removeItem = (index: number) => {
      if (!results) return;
      const newResults = [...results];
      newResults.splice(index, 1);
      setResults(newResults.length > 0 ? newResults : null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-6 border-b border-slate-200 bg-white shadow-sm">
         <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center">
                    <Wand2 className="mr-3 text-indigo-500" size={28} />
                    Data Processor
                </h2>
                <p className="text-slate-500 text-sm mt-1">Paste text or upload files. HTML/Code will be stripped automatically.</p>
            </div>
            {!results && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <Upload size={16} />
                    Import Files
                </button>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
         {!results ? (
            <div className="h-full flex flex-col">
                <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.html,.htm,.json" 
                    onChange={handleFileUpload} 
                />
                <textarea 
                    className="flex-1 w-full border border-slate-300 rounded-xl p-6 text-base leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none shadow-sm font-mono text-sm"
                    placeholder="Paste brainstorming sessions, chat logs, or rough drafts here..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
                           <AlignLeft size={12} className="mr-1.5" />
                           {countWords(input)} words
                        </span>
                        <span className="italic">
                           <FileText size={12} className="inline mr-1"/>
                           Auto-saves as #source-text
                        </span>
                    </div>
                    
                    <Button 
                        size="lg" 
                        onClick={handleProcess} 
                        disabled={!input.trim()} 
                        isLoading={isProcessing}
                        className="shadow-lg"
                    >
                        <Wand2 size={20} className="mr-2" /> Process Text
                    </Button>
                </div>
            </div>
         ) : (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="text-indigo-900 font-bold">
                        Found {results.length} items
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setResults(null)}>Discard</Button>
                        <Button onClick={handleSaveAll}><Save size={16} className="mr-2" /> Save All to Project</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((item, idx) => {
                        const cat = item.category.toLowerCase();
                        let Icon = StickyNote;
                        let colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
                        
                        if (cat.includes('location')) { Icon = MapPin; colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
                        if (cat.includes('url') || cat.includes('link')) { Icon = LinkIcon; colorClass = "bg-blue-50 text-blue-700 border-blue-200"; }
                        if (cat.includes('character')) { Icon = User; colorClass = "bg-purple-50 text-purple-700 border-purple-200"; }
                        if (cat.includes('concept')) { Icon = Lightbulb; colorClass = "bg-amber-50 text-amber-700 border-amber-200"; }

                        return (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative group hover:shadow-md transition-shadow flex flex-col">
                                <button 
                                    onClick={() => removeItem(idx)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase mb-3 border self-start ${colorClass}`}>
                                    <Icon size={12} className="mr-1.5" /> {item.category}
                                </div>
                                <p className="text-slate-800 text-sm font-medium mb-3 whitespace-pre-wrap flex-1">{item.content}</p>
                                {item.analysis && (
                                    <div className="text-xs text-slate-500 italic border-t border-slate-100 pt-2 mb-3">
                                        {item.analysis}
                                    </div>
                                )}
                                
                                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
                                    <button 
                                        onClick={() => { handleSaveItem(item); removeItem(idx); }}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
                                        title="Save as detected type"
                                    >
                                        <Save size={12} /> Save
                                    </button>
                                    <button 
                                        onClick={() => { handleSaveItem(item, 'Character'); removeItem(idx); }}
                                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded"
                                        title="Save as Character"
                                    >
                                        <User size={14} />
                                    </button>
                                    <button 
                                        onClick={() => { handleSaveItem(item, 'Location'); removeItem(idx); }}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded"
                                        title="Save as Location"
                                    >
                                        <MapPin size={14} />
                                    </button>
                                    <button 
                                        onClick={() => { handleSaveItem(item, 'Note'); removeItem(idx); }}
                                        className="p-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded"
                                        title="Save as Note"
                                    >
                                        <StickyNote size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
         )}
      </div>
    </div>
  );
};
