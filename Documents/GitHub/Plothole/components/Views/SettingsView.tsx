
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Sliders, Mail, Zap, Archive, Palette, Monitor, Layout, MessageSquare, Sparkles } from 'lucide-react';
import { ProjectData, Note, User, ViewType } from '../../types';
import { exportFullArchive } from '../../services/storageService';

interface SettingsViewProps {
  projectData: ProjectData | null;
  globalNotes?: Note[];
  onImportProject: (data: ProjectData) => Promise<void>;
  onFactoryReset: () => Promise<void>;
  currentUser: User;
  onUpdateUser: (user: Partial<User>) => void;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

const THEME_COLORS = [
  { name: 'Blue', value: '59 130 246', class: 'bg-blue-500' },
  { name: 'Purple', value: '147 51 234', class: 'bg-purple-600' },
  { name: 'Green', value: '16 185 129', class: 'bg-emerald-500' },
  { name: 'Rose', value: '244 63 94', class: 'bg-rose-500' },
  { name: 'Gold', value: '245 158 11', class: 'bg-amber-500' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  globalNotes = [],
  onFactoryReset,
  currentUser,
  onUpdateUser,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  const prefs = currentUser.preferences || {};

  const updatePreference = (key: string, value: any) => {
    onUpdateUser({ preferences: { ...prefs, [key]: value } });
  };

  const handleExportFull = async () => {
    setIsExporting(true);
    try {
      await exportFullArchive(globalNotes);
    } catch (e) { alert("Full backup failed."); } finally { setIsExporting(false); }
  };

  const handleEmailBackup = async () => {
    const email = currentUser.backupEmail || currentUser.email;
    alert(`Generating Unified Archive... Please attach the downloaded file to an email to ${email}.`);
    handleExportFull();
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2 dark:text-slate-100"><Sliders size={20}/> System Preferences</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
         
         {/* APPEARANCE */}
         <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2"><Palette className="text-primary" size={20}/> <h3 className="font-bold dark:text-slate-100">Appearance</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Accent Color</label>
                  <div className="flex gap-2">
                     {THEME_COLORS.map(c => (
                        <button key={c.value} onClick={() => onUpdateUser({themeColor: c.value})} className={`w-8 h-8 rounded-full ${c.class} ${currentUser.themeColor === c.value ? 'ring-4 ring-slate-200 dark:ring-slate-700' : ''}`} />
                     ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Interface Mode</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     {['light', 'dark'].map(m => (
                        <button key={m} onClick={() => updatePreference('themeMode', m)} className={`flex-1 py-1 text-xs font-bold rounded uppercase ${prefs.themeMode === m ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}>{m}</button>
                     ))}
                  </div>
               </div>
               <div className="md:col-span-2 pt-4 border-t dark:border-slate-800">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800 group hover:border-indigo-200 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-all ${prefs.colorfulIcons ? 'bg-white dark:bg-slate-700 shadow-lg text-2xl' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                           {prefs.colorfulIcons ? '🎨' : <Sparkles size={24} />}
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-100">Colorful High-Def Icons</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Use vibrant, full-color visual emblems instead of standard outlines.</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => updatePreference('colorfulIcons', !prefs.colorfulIcons)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${prefs.colorfulIcons ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.colorfulIcons ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
               </div>
            </div>
         </section>

         {/* ENGINE PREFERENCES */}
         <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2"><MessageSquare className="text-indigo-500" size={20}/> <h3 className="font-bold dark:text-slate-100">AI Personality</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Verbosity Level</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     {[
                        { id: 'concise', label: 'Brief' },
                        { id: 'detailed', label: 'Flowery' }
                     ].map(v => (
                        <button key={v.id} onClick={() => updatePreference('aiVerbosity', v.id)} className={`flex-1 py-1 text-xs font-bold rounded uppercase ${prefs.aiVerbosity === v.id ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}>{v.label}</button>
                     ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Landing Page</label>
                  <select 
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 dark:text-white"
                    value={prefs.landingPage || ViewType.NOTES}
                    onChange={(e) => updatePreference('landingPage', e.target.value)}
                  >
                     <option value={ViewType.NOTES}>Global Notebook</option>
                     <option value={ViewType.BOOKSHELF}>Story Library</option>
                  </select>
               </div>
            </div>
         </section>

         {/* BACKUP */}
         <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2"><Zap className="text-amber-500" size={20}/> <h3 className="font-bold dark:text-slate-100">Unified System Archive</h3></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Download every project and your global notebook in a single, portable backup archive.</p>
            <div className="flex flex-col gap-4">
               <Button onClick={handleExportFull} isLoading={isExporting} size="lg" className="w-full">
                  <Archive size={20} className="mr-2" /> Download Full System Archive (ZIP)
               </Button>
               <div className="pt-4 border-t dark:border-slate-800 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Archive Contact Email</label>
                     <input className="w-full border dark:border-slate-700 rounded p-2 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="your@email.com" value={currentUser.backupEmail || ''} onChange={e => onUpdateUser({backupEmail: e.target.value})} />
                  </div>
                  <Button onClick={handleEmailBackup} variant="secondary" className="w-full"><Mail size={16} className="mr-2"/> Prepare Email Attachment</Button>
               </div>
            </div>
         </section>

         {/* DANGER ZONE */}
         <section className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border border-red-100 dark:border-red-900/50">
            <div className="flex justify-between items-center">
               <div><h4 className="font-bold text-red-700 dark:text-red-400">Factory Purge</h4><p className="text-xs text-red-600 dark:text-red-500">Delete all local projects, notes, and manuscript records.</p></div>
               <Button variant="danger" size="sm" onClick={async () => { if(resetConfirm) await onFactoryReset(); else {setResetConfirm(true); setTimeout(()=>setResetConfirm(false),3000);}}}>{resetConfirm ? "Confirm Purge" : "Wipe All Data"}</Button>
            </div>
         </section>
      </div>
    </div>
  );
};
