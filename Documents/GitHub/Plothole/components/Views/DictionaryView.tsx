
import React, { useState } from 'react';
import { Language, LexiconEntry, ProjectData } from '../../types';
import { Button } from '../ui/Button';
import { 
  Languages, 
  Plus, 
  Trash2, 
  Wand2, 
  Save, 
  X, 
  Settings2, 
  BookMarked, 
  Search,
  ChevronRight,
  Info,
  History
} from 'lucide-react';
import { generateConlangWord } from '../../services/geminiService';

interface DictionaryViewProps {
  languages: Language[];
  onUpdateLanguages: (languages: Language[]) => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  languages,
  onUpdateLanguages
}) => {
  const [selectedLangId, setSelectedLangId] = useState<string | null>(languages.length > 0 ? languages[0].id : null);
  const [isAddingLang, setIsAddingLang] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const [newLangName, setNewLangName] = useState('');
  const [newWord, setNewWord] = useState({ original: '', translation: '', partOfSpeech: 'Noun' });

  const activeLang = languages.find(l => l.id === selectedLangId);

  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    const newLang: Language = {
      id: crypto.randomUUID(),
      name: newLangName,
      description: '',
      lexicon: []
    };
    onUpdateLanguages([...languages, newLang]);
    setSelectedLangId(newLang.id);
    setNewLangName('');
    setIsAddingLang(false);
  };

  const handleDeleteLanguage = (id: string) => {
    if (!confirm("Delete this language and all its words?")) return;
    const filtered = languages.filter(l => l.id !== id);
    onUpdateLanguages(filtered);
    if (selectedLangId === id) setSelectedLangId(filtered[0]?.id || null);
  };

  const handleUpdateActiveLang = (updates: Partial<Language>) => {
    if (!activeLang) return;
    const updated = { ...activeLang, ...updates };
    onUpdateLanguages(languages.map(l => l.id === activeLang.id ? updated : l));
  };

  const handleAddWord = () => {
    if (!activeLang || !newWord.original.trim()) return;
    const entry: LexiconEntry = {
      id: crypto.randomUUID(),
      original: newWord.original.trim(),
      translation: newWord.translation.trim(),
      partOfSpeech: newWord.partOfSpeech
    };
    handleUpdateActiveLang({ lexicon: [...activeLang.lexicon, entry] });
    setNewWord({ original: '', translation: '', partOfSpeech: 'Noun' });
  };

  const handleAiTranslate = async (wordId: string) => {
    if (!activeLang) return;
    const word = activeLang.lexicon.find(w => w.id === wordId);
    if (!word) return;

    setIsGenerating(wordId);
    try {
      const result = await generateConlangWord(activeLang, word.original);
      const updatedLexicon = activeLang.lexicon.map(w => 
        w.id === wordId ? { ...w, translation: result.translation, notes: result.etymology } : w
      );
      handleUpdateActiveLang({ lexicon: updatedLexicon });
    } catch (e) {
      alert("AI Translation failed.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDeleteWord = (wordId: string) => {
    if (!activeLang) return;
    handleUpdateActiveLang({ lexicon: activeLang.lexicon.filter(w => w.id !== wordId) });
  };

  const filteredLexicon = activeLang?.lexicon.filter(w => 
    w.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.translation.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar - Languages List */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-xs">Languages</h3>
          <button onClick={() => setIsAddingLang(true)} className="text-primary hover:bg-primary/10 p-1 rounded">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {languages.map(lang => (
            <div 
              key={lang.id}
              onClick={() => setSelectedLangId(lang.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedLangId === lang.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Languages size={14} className="opacity-50" />
                <span className="truncate">{lang.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteLanguage(lang.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {isAddingLang && (
            <div className="p-2 space-y-2 animate-in slide-in-from-top-1">
              <input 
                autoFocus
                className="w-full text-sm border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded px-2 py-1"
                placeholder="Language Name..."
                value={newLangName}
                onChange={e => setNewLangName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLanguage()}
              />
              <div className="flex gap-1">
                <Button size="sm" className="flex-1" onClick={handleAddLanguage}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingLang(false)}><X size={14}/></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeLang ? (
          <>
            {/* Lang Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">{activeLang.name}</h2>
                <button 
                  onClick={() => setIsEditingMeta(!isEditingMeta)}
                  className={`p-2 rounded-lg transition-colors ${isEditingMeta ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Settings2 size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 w-48 md:w-64 dark:text-white"
                      placeholder="Search lexicon..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
               {isEditingMeta && (
                  <div className="p-6 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-6 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phonology / Sounds</label>
                           <textarea 
                              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="e.g. Sibilant heavy, no 'r' sounds, strictly CV syllables..."
                              value={activeLang.phonology || ''}
                              onChange={e => handleUpdateActiveLang({ phonology: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">AI Construction Rules</label>
                           <textarea 
                              className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="e.g. Inspired by Old Norse, sounds aggressive, uses 'sh' for all plural markers..."
                              value={activeLang.aiParameters || ''}
                              onChange={e => handleUpdateActiveLang({ aiParameters: e.target.value })}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description / Vibe</label>
                        <textarea 
                           className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm h-16 outline-none focus:ring-2 focus:ring-primary/20"
                           placeholder="Historical context or general vibe..."
                           value={activeLang.description || ''}
                           onChange={e => handleUpdateActiveLang({ description: e.target.value })}
                        />
                     </div>
                  </div>
               )}

               {/* Lexicon Management */}
               <div className="p-6 max-w-5xl mx-auto space-y-8">
                  {/* Add Word Box */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <BookMarked size={14}/> Add to Lexicon
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                       <input 
                          className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm"
                          placeholder="Original (English)"
                          value={newWord.original}
                          onChange={e => setNewWord({...newWord, original: e.target.value})}
                       />
                       <input 
                          className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm"
                          placeholder="Translation (Optional)"
                          value={newWord.translation}
                          onChange={e => setNewWord({...newWord, translation: e.target.value})}
                       />
                       <select 
                          className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800"
                          value={newWord.partOfSpeech}
                          onChange={e => setNewWord({...newWord, partOfSpeech: e.target.value})}
                       >
                          <option>Noun</option>
                          <option>Verb</option>
                          <option>Adjective</option>
                          <option>Adverb</option>
                          <option>Proper Noun</option>
                       </select>
                       <Button onClick={handleAddWord} disabled={!newWord.original.trim()}>
                          <Plus size={16} className="mr-2" /> Add Word
                       </Button>
                    </div>
                  </div>

                  {/* Word List */}
                  <div className="space-y-3 pb-32">
                     {filteredLexicon.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 border-2 border-dashed dark:border-slate-800 rounded-2xl">
                           <Languages size={48} className="mx-auto mb-4 opacity-10" />
                           <p>No words in the lexicon matching your search.</p>
                        </div>
                     ) : (
                        filteredLexicon.map((word) => (
                           <div key={word.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-md transition-all">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Original</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{word.original}</div>
                                 </div>
                                 <div className="relative group/trans">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex justify-between">
                                       Translation
                                       {isGenerating === word.id && <span className="text-primary animate-pulse">Generating...</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className={`font-serif text-lg ${word.translation ? 'text-primary' : 'text-slate-300 italic text-sm'}`}>
                                          {word.translation || 'Pending translation...'}
                                       </div>
                                       {!word.translation && (
                                          <button 
                                             onClick={() => handleAiTranslate(word.id)}
                                             className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                                             title="AI Construct Word"
                                          >
                                             <Wand2 size={14} />
                                          </button>
                                       )}
                                    </div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Part of Speech</div>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold border dark:border-slate-700">{word.partOfSpeech}</span>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                 {word.notes && (
                                    <div className="group/note relative">
                                       <button className="p-2 text-slate-400 hover:text-amber-500"><Info size={18}/></button>
                                       <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-xl shadow-2xl opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity z-50">
                                          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1"><History size={10}/> Etymology / Notes</div>
                                          {word.notes}
                                       </div>
                                    </div>
                                 )}
                                 <button onClick={() => handleDeleteWord(word.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={18}/>
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center mb-8">
               <Languages size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Conlang Dictionary</h2>
            <p className="max-w-md mb-8 text-slate-500 dark:text-slate-400">Create custom languages for your world. Define phonology rules and use AI to construct consistent vocabularies based on your linguistic parameters.</p>
            <Button size="lg" onClick={() => setIsAddingLang(true)}>
               <Plus size={18} className="mr-2" /> Create First Language
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
