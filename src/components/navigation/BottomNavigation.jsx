import React from 'react';
import { Home, Search, Plus, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Plus, label: 'Create', path: '/create' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'text-[#FF5722]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
