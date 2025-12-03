import * as React from 'react';
import { useJarvisStore } from '../store';
import { SurfaceType } from '../types';
import { ShoppingSurface } from './surfaces/ShoppingSurface';
import { AgendaSurface } from './surfaces/AgendaSurface';
import { NewsSurface } from './surfaces/NewsSurface';
import { X } from 'lucide-react';

export const SurfaceManager: React.FC = () => {
  const { activeSurface, setActiveSurface } = useJarvisStore();
  const [displayedSurface, setDisplayedSurface] = React.useState<SurfaceType>(SurfaceType.NONE);

  React.useEffect(() => {
    if (activeSurface !== SurfaceType.NONE) {
      setDisplayedSurface(activeSurface);
    } else {
      // Delay clearing the content to allow the slide-out animation to finish
      // The visual slide-out is controlled by CSS, we just keep the content valid for 500ms
      const timer = setTimeout(() => setDisplayedSurface(SurfaceType.NONE), 500);
      return () => clearTimeout(timer);
    }
  }, [activeSurface]);

  const renderContent = () => {
    // Render based on displayedSurface so content persists during exit animation
    switch (displayedSurface) {
      case SurfaceType.SHOPPING: return <ShoppingSurface />;
      case SurfaceType.AGENDA: return <AgendaSurface />;
      case SurfaceType.NEWS: return <NewsSurface />;
      default: return null;
    }
  };

  const isActive = activeSurface !== SurfaceType.NONE;

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-l border-white/10 p-6 shadow-2xl z-20 flex flex-col 
      transition-transform duration-500 ease-in-out transform 
      ${isActive ? 'translate-x-0' : 'translate-x-full'}`}
    >
       <button 
         onClick={() => setActiveSurface(SurfaceType.NONE)}
         className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
       >
         <X className="w-5 h-5" />
       </button>
       
       <div className={`mt-8 h-full overflow-hidden transition-opacity duration-500 delay-100 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          {renderContent()}
       </div>
    </div>
  );
};