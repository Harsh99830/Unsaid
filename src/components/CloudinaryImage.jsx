import React from 'react';

const CloudinaryImage = ({ 
  width = 500, 
  height = 500, 
  className = '', 
  alt = 'Placeholder image' 
}) => {
  return (
    <div 
      className={`bg-gray-200 flex items-center justify-center text-gray-500 text-sm ${className}`}
      style={{ width, height }}
    >
      {alt}
    </div>
  );
};

export default CloudinaryImage;
