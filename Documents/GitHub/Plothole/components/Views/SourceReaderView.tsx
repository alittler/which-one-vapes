
import React, { useState } from 'react';
import { Search, FileText, AlignLeft, Info } from 'lucide-react';

interface SourceReaderViewProps {
  text?: string;
}

export const SourceReaderView: React.FC<SourceReaderViewProps> = ({ text }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const highlightText = (content: string, term: string) => {
    if (!term.trim()) return content;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = content.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{part}</mark>
          ) : part
        )}
      </>
    );
  };

  if (!text) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
         <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <FileText size={32} className="opacity-20" />
         </div>
         <h3 className="text-lg font-bold text-slate-600 mb-2">No manuscript source found.</h3>
         <p className="max-w-sm text-sm">Upload a manuscript or use the Data Processor to populate the source reader. This allows you to quickly reference your original text.</p>
      </div>
    );
  }

  const wordCount = text.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">
              <FileText size={14} />
              LATEST MANUSCRIPT VERSION
           </div>
           <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <AlignLeft size={14} />
              {wordCount.toLocaleString()} words
           </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
            placeholder="Search original text..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white selection:bg-blue-100">
         <div className="max-w-3xl mx-auto">
            {searchTerm && (
               <div className="mb-6 flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <Info size={14} />
                  Showing results for "{searchTerm}"
               </div>
            )}
            <div className="text-lg leading-relaxed text-slate-800 font-serif whitespace-pre-wrap">
              {highlightText(text, searchTerm)}
            </div>
         </div>
      </div>
    </div>
  );
};
