import React from 'react';
import { ProjectData } from '../../types';

interface GalleryViewProps {
  data: ProjectData;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ data }) => {
  const items = [
    ...data.characters.map(c => ({ ...c, type: 'Character' })),
    ...data.locations.map(l => ({ ...l, type: 'Location' }))
  ];

  if (items.length === 0) return <div className="p-8 text-center text-slate-500 italic">No gallery items available.</div>;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6">Asset Gallery</h2>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {items.map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="break-inside-avoid bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <img 
               src={`https://picsum.photos/seed/${item.name}/600/${Math.floor(Math.random() * 200) + 400}`} 
               className="w-full object-cover"
               alt={item.name}
            />
            <div className="p-4">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${item.type === 'Character' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {item.type}
              </span>
              <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                 {/* @ts-ignore - union type access */}
                 {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};