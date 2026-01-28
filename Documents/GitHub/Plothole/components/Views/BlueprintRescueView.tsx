
import React, { useState } from 'react';
import { ProjectData } from '../../types';
import { Button } from '../ui/Button';
import { AlertCircle, ArrowRight, CheckCircle, Database, FileWarning, Search, Info } from 'lucide-react';

interface BlueprintRescueViewProps {
  rawData: any;
  onCommit: (migratedData: ProjectData) => void;
  onCancel: () => void;
}

export const BlueprintRescueView: React.FC<BlueprintRescueViewProps> = ({ 
  rawData, 
  onCommit, 
  onCancel 
}) => {
  // Migration logic
  const projectInfo = rawData.projectData || rawData;
  const categoriesFound = Object.keys(projectInfo);

  const handleRescue = () => {
    // Perform standard migration + mapping for common legacy field names
    const migrated: ProjectData = {
        id: projectInfo.id || crypto.randomUUID(),
        title: projectInfo.title || projectInfo.name || 'Rescued Project',
        author: projectInfo.author || '',
        summary: projectInfo.summary || projectInfo.description || '',
        lastModified: Date.now(),
        // Map "people" or "cast" to characters
        characters: projectInfo.characters || projectInfo.people || projectInfo.cast || [],
        // Map "places" or "world" to locations
        locations: projectInfo.locations || projectInfo.places || projectInfo.world || [],
        // Map "events" to timeline
        timeline: projectInfo.timeline || projectInfo.events || projectInfo.history || [],
        notes: projectInfo.notes || [],
        relationships: projectInfo.relationships || [],
        themes: projectInfo.themes || [],
        calendars: projectInfo.calendars || [],
        artifacts: projectInfo.artifacts || projectInfo.items || [],
        lore: projectInfo.lore || projectInfo.definitions || []
    };
    onCommit(migrated);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-full">
            <FileWarning size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Blueprint Import Rescue</h2>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">We detected inconsistencies in the uploaded project file.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <Search size={14} /> File Inspection
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border dark:border-slate-800 font-mono text-sm space-y-2">
                 <div className="flex justify-between border-b dark:border-slate-800 pb-2">
                    <span className="text-slate-400">Detected Title:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{projectInfo.title || projectInfo.name || 'Unknown'}</span>
                 </div>
                 <div className="flex justify-between border-b dark:border-slate-800 pb-2">
                    <span className="text-slate-400">Structure Keys:</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {categoriesFound.map(cat => (
                            <span key={cat} className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded text-[9px] font-bold text-slate-500 uppercase">{cat}</span>
                        ))}
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-6 flex gap-4">
              <div className="text-indigo-600 dark:text-indigo-400 shrink-0"><Database size={24}/></div>
              <div>
                 <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Intelligent Reconstruction</h4>
                 <p className="text-sm text-indigo-800/70 dark:text-indigo-400/80 leading-relaxed">
                    Plothole will attempt to map the legacy data into the current schema. Missing fields will be initialized with defaults. 
                    Any data labeled as "People" or "Places" will be automatically converted to "Characters" and "Locations".
                 </p>
              </div>
           </section>

           <div className="flex items-start gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
              <Info size={16} className="text-slate-400 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed italic">
                 Note: If significant data is missing (like IDs or required timestamps), the app will generate new unique identifiers to ensure system integrity.
              </p>
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
           <Button variant="ghost" onClick={onCancel}>Abort Import</Button>
           <Button onClick={handleRescue} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 border-none">
              <ArrowRight size={18} className="mr-2" /> Commit & Rescue Data
           </Button>
        </div>
      </div>
    </div>
  );
};
