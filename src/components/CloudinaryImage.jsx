import React from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { createOptimizedImage } from '../services/cloudinary';

const CloudinaryImage = ({ 
  publicId = 'cld-sample-5', 
  width = 500, 
  height = 500, 
  className = '', 
  alt = 'Cloudinary image' 
}) => {
  const img = createOptimizedImage(publicId, width, height);
  
  return (
    <AdvancedImage 
      cldImg={img} 
      className={className}
      alt={alt}
    />
  );
};

export default CloudinaryImage;
