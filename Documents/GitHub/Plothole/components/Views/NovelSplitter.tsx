
import React, { useState, useRef, useMemo } from 'react';
import { Act, Chapter, Scene, ManuscriptStructure } from '../../types';
import { Button } from '../ui/Button';
import { 
  Scissors, Upload, FileText, Download, Sparkles, Wand2, RefreshCw, 
  ChevronRight, ChevronDown, Trash2, Plus, ArrowUpRight, ArrowDownLeft,
  X, ListOrdered, Save
} from 'lucide-react';
import { detectManuscriptStructure, getEvocativeTitles } from '../../services/geminiService';
import JSZip from 'jszip';

export const NovelSplitter: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [structure, setStructure] = useState<ManuscriptStructure | null>(null);
  const [activeView, setActiveView] = useState<'ingest' | 'editor'>('ingest');
  const [history, setHistory] = useState<ManuscriptStructure[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PARSING LOGIC ---
  const splitManuscript = (text: string, actPat: string, chapPat: string, scenePat: string): ManuscriptStructure => {
    const acts: Act[] = [];
    
    const actRegex = new RegExp(actPat, 'm');
    const chapRegex = new RegExp(chapPat, 'm');
    const sceneRegex = new RegExp(scenePat, 'm');

    // Pass 1: Acts
    const rawActs = text.split(actRegex);
    const actTitles = text.match(new RegExp(actPat, 'mg')) || ["Manuscript"];

    rawActs.forEach((actText, actIdx) => {
        if (!actText.trim() && actIdx === 0) return;
        
        const act: Act = { id: crypto.randomUUID(), title: actTitles[actIdx-1] || "Prologue", chapters: [], wordCount: 0 };
        
        // Pass 2: Chapters
        const rawChaps = actText.split(chapRegex);
        const chapTitles = actText.match(new RegExp(chapPat, 'mg')) || [];

        rawChaps.forEach((chapText, chapIdx) => {
            if (!chapText.trim() && chapIdx === 0 && rawChaps.length > 1) return;
            // Fix: added missing properties to satisfy consolidated Chapter interface.
            const chap: Chapter = { 
              id: crypto.randomUUID(), 
              title: chapTitles[chapIdx-1] || "Untitled Chapter", 
              scenes: [], 
              wordCount: 0,
              content: '',
              order: chapIdx,
              status: 'Draft',
              lastModified: Date.now()
            };
            
            // Pass 3: Scenes
            const rawScenes = chapText.split(sceneRegex);
            rawScenes.forEach((sceneText, sIdx) => {
                if (!sceneText.trim()) return;
                const wordCount = sceneText.trim().split(/\s+/).length;
                chap.scenes.push({
                    id: crypto.randomUUID(),
                    title: `Scene ${chap.scenes.length + 1}`,
                    content: sceneText.trim(),
                    wordCount
                });
            });

            chap.wordCount = chap.scenes.reduce((acc, s) => acc + s.wordCount, 0);
            if (chap.scenes.length > 0) act.chapters.push(chap);
        });

        act.wordCount = act.chapters.reduce((acc, c) => acc + c.wordCount, 0);
        if (act.chapters.length > 0) acts.push(act);
    });

    return {
        acts,
        totalWords: acts.reduce((acc, a) => acc + a.wordCount, 0),
        config: { actPattern: actPat, chapterPattern: chapPat, scenePattern: scenePat }
    };
  };

  const handleIngest = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
        const patterns = await detectManuscriptStructure(rawText);
        const newStructure = splitManuscript(rawText, patterns.actPattern, patterns.chapterPattern, patterns.scenePattern);
        setStructure(newStructure);
        setActiveView('editor');
    } catch (e) {
        alert("Pattern detection failed. Using defaults.");
        const def = splitManuscript(rawText, "^Part\\s+[0-9]+", "^Chapter\\s+[0-9]+", "^\\*\\*\\*");
        setStructure(def);
        setActiveView('editor');
    } finally {
        setIsProcessing(false);
    }
  };

  const pushHistory = (newStruct: ManuscriptStructure) => {
    setHistory(prev => [...prev, structure!]);
    setStructure(newStruct);
  };

  const handleMagicRename = async () => {
    if (!structure) return;
    setIsProcessing(true);
    try {
        const allScenes = structure.acts.flatMap(a => a.chapters.flatMap(c => c.scenes));
        // Process in chunks of 5
        for (let i = 0; i < allScenes.length; i += 5) {
            const chunk = allScenes.slice(i, i + 5);
            const titles = await getEvocativeTitles(chunk);
            
            setStructure(prev => {
                if (!prev) return null;
                const next = { ...prev };
                titles.forEach(t => {
                    next.acts.forEach(a => a.chapters.forEach(c => c.scenes.forEach(s => {
                        if (s.id === t.id) s.title = t.title;
                    })));
                });
                return next;
            });
        }
    } catch (e) {
        alert("Magic rename failed.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!structure) return;
    const zip = new JSZip();
    const hexId = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    // 1. Project Index
    const projectXml = `<?xml version="1.0" encoding="utf-8"?>
<novelWriterProject version="2.1">
  <project hexId="${hexId}" name="NovelSplitter Export" author="Plothole" />
  <content>
    <item type="folder" name="Manuscript" id="root">
      ${structure.acts.map(a => `
      <item type="folder" name="${a.title}" id="${a.id}">
        ${a.chapters.map(c => `
        <item type="folder" name="${c.title}" id="${c.id}">
          ${c.scenes.map(s => `<item type="scene" name="${s.title}" id="${s.id}" />`).join('')}
        </item>`).join('')}
      </item>`).join('')}
    </item>
  </content>
</novelWriterProject>`;

    zip.file("nwproject.xml", projectXml);
    zip.file(`${hexId}.nwx`, projectXml);
    
    // 2. Content Files
    const contentFolder = zip.folder("content");
    structure.acts.forEach(a => a.chapters.forEach(c => c.scenes.forEach(s => {
        contentFolder?.file(`${s.id}.nwm`, s.content);
    })));

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `novelWriter_Project_${Date.now()}.zip`;
    link.click();
  };

  const renumberChapters = () => {
    if (!structure) return;
    let count = 1;
    const next = { ...structure };
    next.acts.forEach(a => a.chapters.forEach(c => {
        c.title = `Chapter ${count++}`;
    }));
    pushHistory(next);
  };

  if (activeView === 'editor' && structure) {
    return (
        <div className="flex h-full bg-slate-900 overflow-hidden font-sans">
            {/* Sidebar Controls */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900 flex-shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Scissors size={20}/></div>
                        <h2 className="text-white font-black uppercase tracking-tighter text-xl">Splitter</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Act Regex</label>
                            <input value={structure.config.actPattern} onChange={e => setStructure({...structure, config: {...structure.config, actPattern: e.target.value}})} className="w-full bg-slate-800 border-none rounded-lg p-3 text-xs font-mono text-indigo-300" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Chapter Regex</label>
                            <input value={structure.config.chapterPattern} onChange={e => setStructure({...structure, config: {...structure.config, chapterPattern: e.target.value}})} className="w-full bg-slate-800 border-none rounded-lg p-3 text-xs font-mono text-indigo-300" />
                        </div>
                        <Button className="w-full rounded-xl py-3" onClick={() => pushHistory(splitManuscript(rawText, structure.config.actPattern, structure.config.chapterPattern, structure.config.scenePattern))}>
                            <RefreshCw size={14} className="mr-2"/> Re-parse Manuscript
                        </Button>
                    </div>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-3">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Structural Tools</h4>
                   <Button variant="secondary" className="w-full justify-start gap-3 bg-slate-800 text-slate-300 hover:bg-slate-700 border-none" onClick={handleMagicRename} isLoading={isProcessing}>
                       <Wand2 size={16} className="text-indigo-400"/> Magic Rename
                   </Button>
                   <Button variant="secondary" className="w-full justify-start gap-3 bg-slate-800 text-slate-300 hover:bg-slate-700 border-none" onClick={renumberChapters}>
                       <ListOrdered size={16} className="text-indigo-400"/> Renumber Chaps
                   </Button>
                   <Button variant="secondary" className="w-full justify-start gap-3 bg-slate-800 text-slate-300 hover:bg-slate-700 border-none" onClick={() => setActiveView('ingest')}>
                       <X size={16} className="text-red-400"/> Discard & Reset
                   </Button>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-950/50">
                    <Button onClick={handleExport} className="w-full py-4 text-lg rounded-2xl shadow-xl shadow-indigo-600/20">
                        <Download size={20} className="mr-2" /> Export (.zip)
                    </Button>
                </div>
            </div>

            {/* Tree Editor */}
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Project Skeleton</h1>
                            <div className="flex gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <span>{structure.totalWords.toLocaleString()} Words</span>
                                <span>{structure.acts.reduce((acc,a) => acc + a.chapters.length, 0)} Chapters</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {structure.acts.map((act) => (
                            <div key={act.id} className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-px flex-1 bg-slate-800" />
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">{act.title}</h3>
                                    <div className="h-px flex-1 bg-slate-800" />
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    {act.chapters.map(chap => (
                                        <div key={chap.id} className="bg-slate-800/30 border border-slate-800 rounded-3xl overflow-hidden group">
                                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                                <h4 className="font-bold text-slate-200">{chap.title}</h4>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{chap.wordCount.toLocaleString()} W</span>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {chap.scenes.map(scene => (
                                                    <div key={scene.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:border-indigo-500/50 transition-colors">
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-300 text-sm truncate">{scene.title}</div>
                                                            <div className="text-[10px] text-slate-500 uppercase truncate mt-0.5">{scene.content.substring(0, 60)}...</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="p-2 text-slate-600 hover:text-indigo-400" title="Promote to Chapter"><ArrowUpRight size={14}/></button>
                                                            <button className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-950 flex flex-col font-sans">
        <div className="p-6 md:p-12 max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/10">
                    <Scissors size={40} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-3">NovelSplitter</h2>
                <p className="text-slate-500 max-w-lg mx-auto">Upload a single-file manuscript draft. We'll use AI to identify your chapter markers and restructure it for professional writing software.</p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="relative flex-1 group">
                    <textarea 
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        placeholder="Paste your entire manuscript here, or drag a .txt or .md file..."
                        className="w-full h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 text-sm font-mono dark:bg-slate-900 dark:text-slate-300 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                    />
                    
                    <div className="absolute top-6 right-6">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white dark:bg-slate-800 shadow-xl p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all text-indigo-500"
                        >
                            <Upload size={24} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) setRawText(await file.text());
                        }} />
                    </div>

                    {!rawText && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                             <div className="text-center">
                                <FileText size={48} className="mx-auto mb-4 text-slate-300"/>
                                <span className="font-bold text-slate-400 text-xs uppercase tracking-[0.3em]">Standby for Ingestion</span>
                             </div>
                        </div>
                    )}
                </div>

                <div className="pt-8 flex flex-col items-center">
                    <Button 
                        size="lg" 
                        onClick={handleIngest} 
                        disabled={!rawText.trim() || isProcessing}
                        isLoading={isProcessing}
                        className="rounded-full px-12 py-7 text-xl shadow-2xl shadow-indigo-500/30"
                    >
                        <Sparkles size={24} className="mr-3" /> Analyze Structure
                    </Button>
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by Gemini 3 Flash Preview</p>
                </div>
            </div>
        </div>
    </div>
  );
};
