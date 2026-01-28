import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

// Initialize Cloudinary instance with environment variables
export const cld = new Cloudinary({ 
  cloud: { 
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drvdwpb45'
  } 
});

// Function to upload image to Cloudinary
export const uploadImage = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  console.log('Upload config:', { cloudName, uploadPreset });

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary upload preset not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const responseText = await response.text();
    console.log('Cloudinary response:', response.status, responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
      throw new Error(`Upload failed: ${errorData.error?.message || errorData.error || response.statusText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Upload successful:', data);
    
    return {
      publicId: data.public_id,
      url: data.secure_url,
      format: data.format
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Function to create optimized image
export const createOptimizedImage = (publicId, width = 500, height = 500) => {
  return cld
    .image(publicId)
    .format('auto') // Optimize delivery by resizing and applying auto-format and auto-quality
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height)); // Transform the image: auto-crop to square aspect_ratio
};