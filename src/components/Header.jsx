import React from 'react';
import { Bell } from 'lucide-react';
import MutedSpeechBubble from './MutedSpeechBubble';

const Header = ({ title = 'Unsaid', showNotifications = true }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center px-4 h-16 justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-[#f45925]/10 p-2 rounded-lg">
            <MutedSpeechBubble size={24} color="#f45925" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#181311]">{title}</h1>
        </div>
        
        {showNotifications && (
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f45925] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f45925]"></span>
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
