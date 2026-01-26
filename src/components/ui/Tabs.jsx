import React, { useState } from 'react';

const Tabs = ({ tabs = [], defaultTab = 0, onTabChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index) => {
    setActiveTab(index);
    onTabChange && onTabChange(index);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(index)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors relative
              ${activeTab === index 
                ? 'text-[#f45925] border-b-2 border-[#f45925]' 
                : 'text-gray-600 hover:text-gray-800 hover:text-gray-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {tabs[activeTab] && tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs;