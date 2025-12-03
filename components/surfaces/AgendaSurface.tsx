import * as React from 'react';
import { useJarvisStore } from '../../store';
import { Calendar, Clock, MapPin } from 'lucide-react';

export const AgendaSurface: React.FC = () => {
  const { agenda } = useJarvisStore();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calendar className="text-purple-400 w-6 h-6" />
        </div>
        <h2 className="text-xl font-medium tracking-wide">Agenda de Hoje</h2>
      </div>

      <div className="flex-1 space-y-4">
        {agenda.map((event, index) => (
            <div key={event.id} className="relative pl-6 border-l border-white/10 pb-6 last:pb-0">
                <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-[#050505] 
                    ${index === 0 ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-gray-600'}`}></div>
                
                <div className="bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-base font-medium text-gray-100">{event.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full 
                            ${event.type === 'meeting' ? 'bg-blue-500/20 text-blue-300' : 
                              event.type === 'task' ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                            {event.type}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                        </div>
                        {event.type === 'meeting' && (
                             <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Escritório</span>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};