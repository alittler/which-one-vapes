
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, ViewType, ToolboxLink, AppPrompts } from '../../types';
import { ShieldCheck, Save, Users, Archive, Database, History, Activity, Cpu, ChevronDown, Wand2, FileJson, FolderTree, FileText, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminViewProps {
  data: ProjectData | null;
  globalResources: ToolboxLink[];
  appPrompts: AppPrompts;
  onSavePrompts: (prompts: AppPrompts) => Promise<void>;
  onAddGlobalResource: (link: ToolboxLink) => Promise<void>;
  onDeleteGlobalResource: (id: string) => Promise<void>;
  onToggleViewVisibility: (view: ViewType) => void;
  onUpdateProject?: (data: Partial<ProjectData>) => void;
  onFullArchive: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  data, 
  appPrompts,
  onSavePrompts,
  onUpdateProject,
  onFullArchive
}) => {
  const [localPrompts, setLocalPrompts] = useState<AppPrompts>(appPrompts);
  const [activePromptKey, setActivePromptKey] = useState<keyof AppPrompts>('GENERAL_AND_CHARACTERS');
  const [isSavingPrompts, setIsSavingPrompts] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalPrompts(appPrompts);
    setHasUnsavedChanges(false);
  }, [appPrompts]);

  const handlePromptChange = (key: keyof AppPrompts, value: string) => {
    setLocalPrompts({ ...localPrompts, [key]: value });
    setHasUnsavedChanges(true);
  };

  const saveAllPrompts = async () => {
    setIsSavingPrompts(true);
    try { await onSavePrompts(localPrompts); setHasUnsavedChanges(false); } catch (e) { alert("Failed to save prompts."); } finally { setIsSavingPrompts(false); }
  };

  const promptKeys = useMemo(() => Object.keys(localPrompts) as Array<keyof AppPrompts>, [localPrompts]);

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-shrink-0 flex justify-between items-center">
        <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center">
           <ShieldCheck className="mr-2 text-primary" size={24} />
           System Architect
        </h2>
        <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onFullArchive}>
                <Archive size={16} className="mr-2" /> System Archive
            </Button>
            {hasUnsavedChanges && (
                <Button size="sm" onClick={saveAllPrompts} isLoading={isSavingPrompts}>
                    <Save size={16} className="mr-2" /> Commit Engines
                </Button>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-6 space-y-8 max-w-6xl mx-auto pb-32">
        
        {/* SYSTEM HEALTH & STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                 <Activity size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Active Entities</span>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">
                 {data ? (data.characters.length + data.locations.length + (data.lore?.length || 0)) : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Cross-project index count</div>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-4">
                 <Cpu size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Engine Load</span>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">
                 {promptKeys.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Active AI Logic Layers</div>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                 <Database size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Storage Mode</span>
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-white">IndexedDB</div>
              <div className="text-xs text-slate-500 mt-1">Local Browser Persistence</div>
           </div>
        </section>

        {/* AI ENGINE CONTROL */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6 space-y-6 shadow-sm">
           <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                 <Wand2 className="text-primary" size={20}/> 
                 <h3 className="font-bold dark:text-slate-100 uppercase tracking-widest">Engine Control</h3>
              </div>
              <div className="relative group w-64">
                <select 
                    value={activePromptKey} 
                    onChange={(e) => setActivePromptKey(e.target.value as keyof AppPrompts)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                    {promptKeys.map(key => (
                        <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Instruction Set</span>
                 <span className="text-[9px] font-mono text-slate-400 italic">Key: {activePromptKey}</span>
              </div>
              <textarea 
                  className="w-full h-[250px] border dark:border-slate-700 rounded-xl p-5 text-sm font-mono bg-slate-50 dark:bg-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={localPrompts[activePromptKey]}
                  onChange={(e) => handlePromptChange(activePromptKey, e.target.value)}
                  placeholder="Enter system instructions for this engine module..."
              />
           </div>
        </section>

        {/* UNIFIED ARCHIVE MANIFEST */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6 space-y-6 shadow-sm">
           <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2">
              <History className="text-primary" size={18}/>
              <h3 className="font-bold text-sm dark:text-slate-100 uppercase tracking-widest">Unified Archive Manifest</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Archive className="text-emerald-500" size={16} />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">System Blueprint (.zip)</h4>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                       <FolderTree size={12} /> Root/
                    </div>
                    <div className="ml-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                       <FileJson size={12} /> full_system_restore.json <span className="text-[9px] opacity-60 font-normal">(Global Notes + Project Meta)</span>
                    </div>
                    <div className="ml-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                       <FolderTree size={12} /> Projects/
                    </div>
                    <div className="ml-8 flex items-center gap-2 text-indigo-500 font-bold">
                       <FolderTree size={12} /> [Project_Title]/
                    </div>
                    <div className="ml-12 flex items-center gap-2 text-indigo-400/80">
                       <FileJson size={10} /> Project_Data.json
                    </div>
                    <div className="ml-12 flex items-center gap-2 text-indigo-400/80">
                       <FolderTree size={10} /> Manuscripts/
                    </div>
                    <div className="ml-16 flex items-center gap-2 text-slate-500 italic">
                       <FileJson size={10} /> Vault_Manifest.json
                    </div>
                    <div className="ml-16 flex items-center gap-2 text-slate-400">
                       <FileText size={10} /> 1_YYYY-MM-DD_Hash.txt
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Processing Thresholds</h4>
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Full Character Threshold</span>
                        <input 
                            type="number" 
                            className="w-16 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded px-2 py-1 text-xs font-bold"
                            value={data?.characterLimit || 6}
                            onChange={e => onUpdateProject?.({ characterLimit: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                    <div className="flex gap-3">
                       <Check size={16} className="text-emerald-500 flex-shrink-0" />
                       <p className="text-[10px] text-slate-500 leading-relaxed italic">The Manuscript Vault maintains 5 history snapshots. Oldest versions are pruned during system archive to maintain performance.</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};
