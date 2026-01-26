import React from 'react';
import { Home, Search, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = ({ activeTab = 'home', onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current route
  const getCurrentActiveTab = () => {
    if (location.pathname === '/profile') return 'profile';
    return activeTab;
  };
  
  const currentActiveTab = getCurrentActiveTab();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'explore', icon: Search, label: 'Explore' },
    { id: 'clubs', icon: MessageCircle, label: 'chat' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 pb-6 pt-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentActiveTab === item.id 
                ? 'text-[#f45925]' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => {
              if (item.id === 'profile') {
                navigate('/profile');
              } else if (item.id === 'home') {
                navigate('/');
              } else {
                onTabChange && onTabChange(item.id);
              }
            }}
          >
            <span className={currentActiveTab === item.id ? 'text-[#f45925]' : 'text-gray-400'}>
              <item.icon size={24} fill={currentActiveTab === item.id ? 'currentColor' : 'none'} />
            </span>
            <span className={`text-[10px] ${currentActiveTab === item.id ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
