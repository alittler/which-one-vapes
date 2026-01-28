
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ToolboxLink } from '../../types';
import { Button } from '../ui/Button';
import { 
  Wrench, Plus, X, ExternalLink, Trash2, Globe, Sparkles, RefreshCw, 
  Compass, Map, Cloud, User, Ruler, ChevronRight, Calculator, Info,
  Book, Search, Star, Wand2, Table as TableIcon, Download, Upload, Shuffle, Eye,
  Languages, AlignLeft, FileText, Check, Scissors
} from 'lucide-react';
import { analyzeUrlForToolbox, analyzeConlangPhonology } from '../../services/geminiService';
import { NovelSplitter } from './NovelSplitter';

interface ToolboxViewProps {
  bakedResources: ToolboxLink[];
  onAddResource: (link: ToolboxLink) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
}

const DEFAULT_LINKS: ToolboxLink[] = [
  { id: 'def-1', label: 'OneLook Reverse Dictionary', url: 'https://www.onelook.com/reverse-dictionary.shtml', category: 'Words', description: 'Find the perfect word by describing the concept.' },
  { id: 'def-2', label: 'TV Tropes', url: 'https://tvtropes.org/', category: 'Research', description: 'A wiki of storytelling devices and clichés.' }
];

// --- QUESTCALC DATA ---
const TRAVEL_DATA = {
    onFoot: {
        name: 'On Foot',
        icon: '🚶',
        types: {
            individual: { name: 'Individual', speed: 30 },
            smallGroup: { name: 'Small Group (2-10)', speed: 24 },
            largeGroup: { name: 'Large Group (11-100)', speed: 18 },
            army: { name: 'Army', speed: 12 },
        },
        paces: {
            normal: { name: 'Normal Pace', modifier: 1.0 },
            pushed: { name: 'Pushed (Forced March)', modifier: 1.25 },
            heavy: { name: 'Heavily Encumbered', modifier: 0.75 },
        }
    },
    mounted: {
        name: 'Mounted & Vehicles',
        icon: '🐎',
        types: {
            ridingHorse: { name: 'Riding Horse', speed: 40 },
            warhorse: { name: 'Warhorse', speed: 30 },
            draftHorse: { name: 'Draft Horse / Wagon', speed: 20 },
            oxCart: { name: 'Ox Cart', speed: 15 },
        },
        paces: {
            normal: { name: 'Normal Pace', modifier: 1.0 },
            pushed: { name: 'Pushed (Forced March)', modifier: 1.25 },
            heavy: { name: 'Heavy Load', modifier: 0.8 },
        }
    },
    ship: {
        name: 'Ship',
        icon: '🚢',
        types: {
            longship: { name: 'Longship (Coastal)', speed: 80 },
            cog: { name: 'Cog (Merchant)', speed: 50 },
            carrack: { name: 'Carrack (Ocean)', speed: 60 },
            galley: { name: 'Galley (Rowed)', speed: 40 },
        },
        paces: {
            favorable: { name: 'Favorable Winds', modifier: 1.5 },
            normal: { name: 'Normal / Rowing', modifier: 1.0 },
            unfavorable: { name: 'Unfavorable Winds', modifier: 0.6 },
        }
    },
    other: {
        name: 'Other Animals',
        icon: '🐪',
        types: {
            camel: { name: 'Camel', speed: 25 },
        },
        paces: {
            normal: { name: 'Normal Pace', modifier: 1.0 },
            pushed: { name: 'Pushed', modifier: 1.2 },
            heavy: { name: 'Heavy Load', modifier: 0.7 },
        }
    }
};

const MODIFIERS = {
    terrain: {
        road: { name: 'Road/Track', modifier: 1.0 },
        plains: { name: 'Open Plains', modifier: 0.9 },
        forest: { name: 'Forest', modifier: 0.7 },
        hills: { name: 'Hills', modifier: 0.75 },
        mountains: { name: 'Mountains', modifier: 0.5 },
        swamp: { name: 'Swamp', modifier: 0.5 },
        desert: { name: 'Desert', modifier: 0.8 },
    },
    weather: {
        clear: { name: 'Clear Skies', modifier: 1.0 },
        rain: { name: 'Rain', modifier: 0.85 },
        storm: { name: 'Storm', modifier: 0.6 },
    }
};

const QuestCalc: React.FC = () => {
    const [distance, setDistance] = useState(100);
    const [units, setUnits] = useState<'miles' | 'km' | 'leagues'>('miles');
    const [mode, setMode] = useState<keyof typeof TRAVEL_DATA>('onFoot');
    const [type, setType] = useState('individual');
    const [pace, setPace] = useState('normal');
    const [terrain, setTerrain] = useState('road');
    const [weather, setWeather] = useState('clear');
    const [results, setResults] = useState<{days: number, speed: number} | null>(null);

    const modeData = TRAVEL_DATA[mode];

    const calculate = () => {
        let miles = distance;
        if (units === 'leagues') miles = distance * 3;
        else if (units === 'km') miles = distance * 0.621371;

        const baseSpeed = (modeData.types as any)[type]?.speed || 30;
        const paceMod = (modeData.paces as any)[pace]?.modifier || 1.0;
        const terrainMod = (MODIFIERS.terrain as any)[terrain]?.modifier || 1.0;
        const weatherMod = (MODIFIERS.weather as any)[weather]?.modifier || 1.0;
        
        const finalTerrainMod = mode === 'ship' ? 1.0 : terrainMod;
        const adjustedSpeed = baseSpeed * paceMod * finalTerrainMod * weatherMod;
        const days = miles / adjustedSpeed;

        setResults({ days, speed: adjustedSpeed });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto">
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-3 uppercase font-serif">
                        <Compass className="text-indigo-500" size={32} />
                        QuestCalc
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Spatiotemporal Logistics for Narrative Journeys</p>
                </div>
                <Button onClick={calculate} className="rounded-full px-8 py-6 text-lg shadow-xl shadow-primary/20">
                    Run Calculation
                </Button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Map size={14} /> 01. Spatial Parameters
                        </h4>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={distance} 
                                onChange={e => setDistance(parseFloat(e.target.value) || 0)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white shadow-inner"
                            />
                            <select 
                                value={units} 
                                onChange={e => setUnits(e.target.value as any)}
                                className="bg-slate-200 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm font-black uppercase dark:text-white outline-none"
                            >
                                <option value="miles">Miles</option>
                                <option value="km">Kilometers</option>
                                <option value="leagues">Leagues</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <User size={14} /> 02. Traveler Configuration
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <select 
                                value={mode} 
                                onChange={e => {
                                    const newMode = e.target.value as keyof typeof TRAVEL_DATA;
                                    setMode(newMode);
                                    setType(Object.keys(TRAVEL_DATA[newMode].types)[0]);
                                    setPace(Object.keys(TRAVEL_DATA[newMode].paces)[0]);
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                            >
                                {Object.entries(TRAVEL_DATA).map(([k, v]) => (
                                    <option key={k} value={k}>{(v as any).icon} {(v as any).name}</option>
                                ))}
                            </select>
                            <select 
                                value={type} 
                                onChange={e => setType(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                            >
                                {Object.entries(modeData.types).map(([k, v]) => (
                                    <option key={k} value={k}>{(v as any).name}</option>
                                ))}
                            </select>
                            <select 
                                value={pace} 
                                onChange={e => setPace(e.target.value)}
                                className="col-span-2 w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                            >
                                {Object.entries(modeData.paces).map(([k, v]) => (
                                    <option key={k} value={k}>{(v as any).name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Cloud size={14} /> 03. Environmental Modifiers
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Terrain Type</label>
                                <select 
                                    value={terrain} 
                                    onChange={e => setTerrain(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                                >
                                    {Object.entries(MODIFIERS.terrain).map(([k, v]) => (
                                        <option key={k} value={k}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Atmospheric Weather</label>
                                <select 
                                    value={weather} 
                                    onChange={e => setWeather(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                                >
                                    {Object.entries(MODIFIERS.weather).map(([k, v]) => (
                                        <option key={k} value={k}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {results ? (
                        <div className="bg-indigo-600 rounded-[1.5rem] p-6 text-white shadow-2xl shadow-indigo-600/30 animate-in slide-in-from-right duration-500">
                             <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Estimated Arrival</h5>
                             <div className="text-4xl font-black mb-1">{Math.round(results.days * 10) / 10} Days</div>
                             <div className="text-xs font-medium opacity-80 flex items-center gap-1.5">
                                <RefreshCw size={12} className="animate-spin-slow" />
                                Speed: ~{Math.round(results.speed)} mi/day
                             </div>
                             <div className="mt-4 pt-4 border-t border-white/20 text-[10px] leading-relaxed italic opacity-70">
                                {results.days > 1 
                                    ? `Requires ${Math.floor(results.days)} camps under ${weather} conditions.`
                                    : 'A day trip, returning by nightfall if unhindered.'
                                }
                             </div>
                        </div>
                    ) : (
                        <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-center items-center justify-center text-slate-400 text-xs italic p-8 text-center leading-relaxed">
                            Configure parameters and execute to visualize travel timeline.
                        </div>
                    )}
                </div>
            </div>
            <div className="px-8 pb-8 flex justify-center">
                <a href="https://forum.legendfire.com/thread/211/travelling-speeds" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
                    Data Credit: LegendFire Forums <ExternalLink size={8} />
                </a>
            </div>
        </div>
    );
};

// --- SPELLBOOK TRANSLATOR ---
interface Spell {
    id: string;
    name: string;
    magicka: string;
    school: string;
    ipa: string;
    isFavorite: boolean;
}

const SpellbookTranslator: React.FC = () => {
    const [spells, setSpells] = useState<Spell[]>([]);
    const [view, setView] = useState<'cards' | 'audit'>('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [schoolFilter, setSchoolFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name' | 'magicka'>('name');
    const [isFavoritesOnly, setIsFavoritesOnly] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const schools = useMemo(() => Array.from(new Set(spells.map(s => s.school))).sort(), [spells]);

    const filteredSpells = useMemo(() => {
        let result = spells.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                s.magicka.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSchool = schoolFilter === 'all' || s.school === schoolFilter;
            const matchesFav = !isFavoritesOnly || s.isFavorite;
            return matchesSearch && matchesSchool && matchesFav;
        });

        result.sort((a, b) => {
            if (sortBy === 'magicka') return a.magicka.localeCompare(b.magicka);
            return a.name.localeCompare(b.name);
        });

        return result;
    }, [spells, searchTerm, schoolFilter, sortBy, isFavoritesOnly]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const csvText = ev.target?.result as string;
            const lines = csvText.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) return;

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const idxs = {
                name: header.indexOf('spell name'),
                magicka: header.indexOf('magicka'),
                school: header.indexOf('school'),
                ipa: header.indexOf('ipa')
            };

            const parsed = lines.slice(1).map(line => {
                const parts = line.split(',').map(p => p.trim().replace(/^['"]|['"]$/g, ''));
                return {
                    id: crypto.randomUUID(),
                    name: parts[idxs.name] || 'Unknown Spell',
                    magicka: parts[idxs.magicka] || '0',
                    school: parts[idxs.school] || 'General',
                    ipa: parts[idxs.ipa] || 'N/A',
                    isFavorite: false
                };
            }).filter(s => s.name !== 'Unknown Spell');

            setSpells(parsed);
        };
        reader.readAsText(file);
    };

    const toggleFavorite = (id: string) => {
        setSpells(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
    };

    const deleteSpell = (id: string) => {
        setSpells(prev => prev.filter(s => s.id !== id));
    };

    const updateSpell = (id: string, updates: Partial<Spell>) => {
        setSpells(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto">
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-3 uppercase font-serif">
                            <Book className="text-amber-500" size={32} />
                            Spellbook Translator
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Linguistic auditing for magical incantations.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="rounded-full px-6">
                            <Upload size={16} className="mr-2" /> Import CSV
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                        <Button onClick={() => setView(view === 'cards' ? 'audit' : 'cards')} variant="primary" className="rounded-full px-6">
                           {view === 'cards' ? <><TableIcon size={16} className="mr-2"/> Audit Data</> : <><Eye size={16} className="mr-2"/> View Cards</>}
                        </Button>
                    </div>
                </div>

                {spells.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" 
                                placeholder="Search spells..." 
                            />
                        </div>
                        <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none">
                            <option value="all">All Schools</option>
                            {schools.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none">
                            <option value="name">Sort: Name</option>
                            <option value="magicka">Sort: Magicka</option>
                        </select>
                        <button onClick={() => setIsFavoritesOnly(!isFavoritesOnly)} className={`p-2 rounded-xl transition-all ${isFavoritesOnly ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'text-slate-400'}`}>
                           <Star size={20} fill={isFavoritesOnly ? "currentColor" : "none"} />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-8">
                {spells.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 text-amber-500 animate-float">
                            <Wand2 size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-700 dark:text-slate-300">Spellbook Empty</h4>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs">Upload a CSV with headers: <br/><code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] mt-2 inline-block font-mono">Spell Name, Magicka, School, IPA</code></p>
                    </div>
                ) : (
                    view === 'cards' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSpells.map(spell => (
                                <div key={spell.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <button onClick={() => toggleFavorite(spell.id)} className={`transition-colors ${spell.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                                            <Star size={22} fill={spell.isFavorite ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-serif mb-4 leading-tight pr-8">{spell.name}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Magicka</span>
                                            <span className="text-slate-700 dark:text-slate-300">{spell.magicka}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400">School</span>
                                            <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">{spell.school}</span>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">IPA Pronunciation</div>
                                            <a 
                                                href={`https://ipa-reader.com/?text=${encodeURIComponent(spell.ipa)}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-indigo-500 hover:underline flex items-center gap-1.5"
                                            >
                                                {spell.ipa} <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="p-4 border-b dark:border-slate-700">Spell Name</th>
                                        <th className="p-4 border-b dark:border-slate-700">Magicka</th>
                                        <th className="p-4 border-b dark:border-slate-700">School</th>
                                        <th className="p-4 border-b dark:border-slate-700">IPA</th>
                                        <th className="p-4 border-b dark:border-slate-700 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm dark:text-slate-200">
                                    {filteredSpells.map(spell => (
                                        <tr key={spell.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-4 border-b dark:border-slate-800 font-bold">
                                                <input value={spell.name} onChange={e => updateSpell(spell.id, { name: e.target.value })} className="bg-transparent border-none w-full p-0 outline-none focus:text-primary" />
                                            </td>
                                            <td className="p-4 border-b dark:border-slate-800">
                                                <input value={spell.magicka} onChange={e => updateSpell(spell.id, { magicka: e.target.value })} className="bg-transparent border-none w-full p-0 outline-none focus:text-primary font-mono" />
                                            </td>
                                            <td className="p-4 border-b dark:border-slate-800">
                                                <input value={spell.school} onChange={e => updateSpell(spell.id, { school: e.target.value })} className="bg-transparent border-none w-full p-0 outline-none focus:text-primary" />
                                            </td>
                                            <td className="p-4 border-b dark:border-slate-800">
                                                <input value={spell.ipa} onChange={e => updateSpell(spell.id, { ipa: e.target.value })} className="bg-transparent border-none w-full p-0 outline-none focus:text-primary italic" />
                                            </td>
                                            <td className="p-4 border-b dark:border-slate-800 text-center">
                                                <button onClick={() => deleteSpell(spell.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
            
            {spells.length > 0 && (
                <div className="p-8 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-center gap-4">
                    <Button variant="secondary" onClick={() => setSpells(prev => [...prev, { id: crypto.randomUUID(), name: 'New Spell', magicka: '10', school: 'General', ipa: '...', isFavorite: false }])} className="rounded-full px-6">
                       <Plus size={16} className="mr-2" /> Add Record
                    </Button>
                    <Button variant="secondary" onClick={() => {
                        const random = spells[Math.floor(Math.random() * spells.length)];
                        setSearchTerm(random.name);
                        setView('cards');
                    }} className="rounded-full px-6">
                        <Shuffle size={16} className="mr-2" /> Scry Random
                    </Button>
                    <Button variant="danger" onClick={() => confirm('Purge Spellbook?') && setSpells([])} className="rounded-full px-6 opacity-60 hover:opacity-100">
                        <Trash2 size={16} className="mr-2" /> Clear All
                    </Button>
                </div>
            )}
        </div>
    );
};

// --- PHONOLOGY IPA GENERATOR ---
const ConlangIpaGenerator: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [parsedRows, setParsedRows] = useState<string[][]>([]);
    const [colMapping, setColMapping] = useState({ word: 0, def: 1 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCsvLine = (text: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
            else { current += char; }
        }
        result.push(current.trim());
        return result;
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split(/\r\n|\n/).filter(l => l.trim());
            if (lines.length < 1) return;
            const headers = parseCsvLine(lines[0]);
            const rows = lines.slice(1).map(l => parseCsvLine(l));
            setCsvHeaders(headers);
            setParsedRows(rows);
            setColMapping({ word: 0, def: Math.min(1, headers.length - 1) });
        };
        reader.readAsText(file);
    };

    const applyCsvData = () => {
        const text = parsedRows.map(row => `${row[colMapping.word]}: ${row[colMapping.def]}`).join('\n');
        setInputText(text);
        setCsvHeaders([]);
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        setIsProcessing(true);
        try {
            const analysis = await analyzeConlangPhonology(inputText);
            setResult(analysis);
        } catch (e) {
            alert("Pattern extraction failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto">
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-3 uppercase font-serif">
                        <Languages className="text-indigo-500" size={32} />
                        Phonology Lab
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Extracting IPA Rules from Fictional Lexicons</p>
                </div>
                <Button onClick={handleAnalyze} isLoading={isProcessing} disabled={!inputText.trim()} className="rounded-full px-8 py-6 text-lg shadow-xl shadow-primary/20">
                    Deduce Rules
                </Button>
            </div>

            <div className="p-8 space-y-8">
                {csvHeaders.length > 0 ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Map Dictionary Columns</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Word Column</label>
                                <select value={colMapping.word} onChange={e => setColMapping({...colMapping, word: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold">
                                    {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Definition Column</label>
                                <select value={colMapping.def} onChange={e => setColMapping({...colMapping, def: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold">
                                    {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button className="flex-1 rounded-xl" onClick={applyCsvData}>Inject Data</Button>
                            <Button variant="ghost" onClick={() => setCsvHeaders([])}>Discard CSV</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Dictionary Corpus</label>
                             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                                <Upload size={12}/> Bulk Import CSV
                             </button>
                             <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFile} />
                        </div>
                        <textarea 
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="vren: to see&#10;glabok: mountain&#10;zith: shadow..."
                            className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 text-sm font-mono focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none dark:text-white"
                        />
                    </div>
                )}

                {result && (
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl relative">
                        <button onClick={() => setResult(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X size={20}/></button>
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                           <Sparkles size={14}/> Extracted Phonological Profile
                        </h4>
                        <div className="prose prose-invert max-w-none prose-sm font-sans leading-relaxed whitespace-pre-wrap text-slate-300">
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ToolboxView: React.FC<ToolboxViewProps> = ({ bakedResources, onAddResource, onDeleteResource }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'tools'>('resources');
  const [activeTool, setActiveTool] = useState<'questcalc' | 'spellbook' | 'conlang' | 'splitter' | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLink, setNewLink] = useState<Partial<ToolboxLink>>({ label: '', url: '', category: 'General', description: '' });
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const allLinks = [
    ...DEFAULT_LINKS,
    ...bakedResources
  ];

  const handleAddLink = async () => {
    if (newLink.label && newLink.url) {
      const link: ToolboxLink = {
        id: crypto.randomUUID(),
        label: newLink.label,
        url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`,
        category: newLink.category || 'General',
        description: newLink.description || ''
      };
      await onAddResource(link);
      setIsAddingLink(false);
      setNewLink({ label: '', url: '', category: 'General', description: '' });
    }
  };

  const handleAutoFill = async () => {
    if (!newLink.url) return;
    setIsAiProcessing(true);
    try {
      const analysis = await analyzeUrlForToolbox(newLink.url);
      setNewLink({
        ...newLink,
        label: analysis.label,
        category: analysis.category,
        description: analysis.description || ''
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (activeTool === 'splitter') {
      return (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col">
              <div className="h-14 border-b dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
                  <span className="font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manuscript Deconstruction Engine</span>
                  <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-hidden">
                  <NovelSplitter />
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-shrink-0">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="font-black text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-3 uppercase tracking-tighter">
                <Wrench className="text-indigo-500" size={28} />
                The Toolbox
            </h2>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
                <button 
                   onClick={() => setActiveTab('resources')}
                   className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <Globe size={14} /> Web Resources
                </button>
                <button 
                   onClick={() => setActiveTab('tools')}
                   className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tools' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <Calculator size={14} /> Writing Tools
                </button>
            </div>

            {activeTab === 'resources' && (
                <Button size="sm" onClick={() => setIsAddingLink(true)} className="rounded-full px-6">
                    <Plus size={16} className="mr-1" /> Add Reference
                </Button>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50 dark:bg-slate-900 shadow-inner no-scrollbar">
        <div className="max-w-7xl mx-auto pb-32">
            {activeTab === 'resources' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allLinks.map((link) => {
                        const isPermanent = DEFAULT_LINKS.some(l => l.id === link.id);
                        return (
                            <div key={link.id} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                                <div className="p-8 flex gap-5 items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                                        <Globe size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 truncate tracking-tight">{link.label}</h4>
                                            {!isPermanent && (
                                                <button onClick={() => onDeleteResource(link.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-400 border border-slate-100 dark:border-slate-600">{link.category}</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8 flex-1 flex flex-col justify-between">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 line-clamp-3 font-medium">
                                        {link.description || 'A useful resource for novelists.'}
                                    </p>
                                    <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-primary flex items-center gap-2 hover:translate-x-1 transition-transform uppercase tracking-widest">
                                            Visit Website <ChevronRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-16">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/40 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg text-4xl transform -rotate-12">🧙‍♂️</div>
                      <div className="text-center md:text-left flex-1">
                         <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tighter mb-2 font-serif">Local Writer Utilities</h3>
                         <p className="text-sm text-indigo-800/70 dark:text-indigo-400 leading-relaxed font-medium">Specialized modules built to bridge the gap between creative intent and mechanical consistency.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <button onClick={() => setActiveTool('splitter')} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group text-left flex flex-col">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all"><Scissors size={24}/></div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">NovelSplitter</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex-1">Break single-file drafts into Act/Chapter/Scene hierarchies for novelWriter.</p>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-4">Launch Engine →</span>
                        </button>
                        {/* Placeholder for others */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border dark:border-slate-700 opacity-60">
                             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Calculator size={24}/></div>
                             <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">QuestCalc</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Coming soon to new container.</p>
                        </div>
                   </div>
                   
                   <div className="space-y-12">
                       <QuestCalc />
                       <div className="w-full h-px bg-slate-200 dark:bg-slate-800 max-w-4xl mx-auto" />
                       <SpellbookTranslator />
                       <div className="w-full h-px bg-slate-200 dark:bg-slate-800 max-w-4xl mx-auto" />
                       <ConlangIpaGenerator />
                   </div>
                </div>
            )}
        </div>
      </div>

      {isAddingLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8 text-slate-800 dark:text-slate-100">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">New Resource</h3>
                    <button onClick={() => setIsAddingLink(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
                </div>
                <div className="space-y-6">
                    <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Endpoint URL</label>
                        <div className="relative">
                            <input className="w-full border dark:border-slate-700 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none bg-slate-50 dark:bg-slate-800 dark:text-white transition-all" placeholder="rhymezone.com" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
                            <button onClick={handleAutoFill} disabled={!newLink.url || isAiProcessing} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 p-3 rounded-xl transition-all">
                                {isAiProcessing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            </button>
                        </div>
                    </div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Display Name</label><input className="w-full border dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold dark:bg-slate-800 dark:text-white transition-all outline-none focus:ring-4 focus:ring-primary/10" placeholder="e.g. RhymeZone" value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})} /></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Abstract / Utility</label><textarea className="w-full border dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium h-24 resize-none dark:bg-slate-800 dark:text-white transition-all outline-none focus:ring-4 focus:ring-primary/10" placeholder="Summarize why this tool matters to your craft..." value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} /></div>
                    <div className="pt-4 flex flex-col gap-3">
                        <Button className="w-full py-5 rounded-2xl shadow-xl shadow-primary/20 text-lg font-black uppercase tracking-widest" onClick={handleAddLink} disabled={!newLink.label || !newLink.url}>Deploy Resource</Button>
                        <Button variant="ghost" className="w-full py-4 text-slate-400 font-bold" onClick={() => setIsAddingLink(false)}>Discard</Button>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};
