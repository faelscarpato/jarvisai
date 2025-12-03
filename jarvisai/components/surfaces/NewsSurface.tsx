import * as React from 'react';
import { useJarvisStore } from '../../store';
import { Newspaper, ExternalLink } from 'lucide-react';

export const NewsSurface: React.FC = () => {
  const { news } = useJarvisStore();

  return (
    <div className="w-full h-full flex flex-col">
       <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
            <Newspaper className="text-blue-400 w-6 h-6" />
        </div>
        <h2 className="text-xl font-medium tracking-wide">Briefing Diário</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-y-auto">
        {news.map((item) => (
            <div key={item.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all">
                <div className="h-32 w-full overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">{item.source}</span>
                        <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-medium text-lg leading-tight mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.summary}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};