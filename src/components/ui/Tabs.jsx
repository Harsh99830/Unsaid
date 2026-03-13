import React, { useState } from 'react';

const Tabs = ({ tabs, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === index
                ? 'text-[#FF5722] border-[#FF5722]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
