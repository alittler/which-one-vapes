import React from 'react';
import { TimelineEvent, Location } from '../../types';

interface TableViewProps {
  events?: TimelineEvent[];
  locations?: Location[];
}

export const TableView: React.FC<TableViewProps> = ({ events = [], locations = [] }) => {
   if (events.length === 0 && locations.length === 0) return <div className="p-8 text-center text-slate-500 italic">No data available.</div>;

  return (
    <div className="p-6 h-full overflow-auto">
      <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6">Master Data Table</h2>
      
      {events.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
          <h3 className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200">Scenes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Sequence</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Key Characters</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{e.title}</td>
                    <td className="px-6 py-4 text-slate-600">{e.location || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{e.charactersInvolved?.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200">Locations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{l.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{l.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-md truncate">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};