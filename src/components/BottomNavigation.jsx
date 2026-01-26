import React from 'react';

const BottomNavigation = ({ activeTab = 'home', onTabChange }) => {
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'explore', icon: '🔍', label: 'Explore' },
    { id: 'clubs', icon: '💬', label: 'chat' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 pb-6 pt-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === item.id 
                ? 'text-[#f45925]' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => onTabChange && onTabChange(item.id)}
          >
            <span className="text-xl">
              {item.icon}
            </span>
            <span className={`text-[10px] ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
