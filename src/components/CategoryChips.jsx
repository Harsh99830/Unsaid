import React from 'react';

const CategoryChips = ({ categories = [], onCategoryChange }) => {
  return (
    <div className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide">
      {categories.map((category, index) => (
        <div
          key={index}
          className={`
            flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm cursor-pointer transition-colors
            ${category.isActive 
              ? 'bg-[#f45925] text-white' 
              : 'bg-white border border-gray-200'
            }
          `}
          onClick={() => onCategoryChange && onCategoryChange(index)}
        >
          <p className={`text-sm font-medium ${category.isActive ? 'font-semibold' : 'text-gray-600'}`}>
            {category.name}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CategoryChips;
