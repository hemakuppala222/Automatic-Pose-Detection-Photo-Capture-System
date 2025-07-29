import React from 'react';
import { X, Star } from 'lucide-react';
import { CapturedPhoto } from '../types/pose';

interface PhotoGridProps {
  photos: CapturedPhoto[];
  onRemovePhoto: (photoId: string) => void;
  bestPhotos: CapturedPhoto[];
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onRemovePhoto, bestPhotos }) => {
  const isBestPhoto = (photo: CapturedPhoto) => 
    bestPhotos.some(bp => bp.id === photo.id);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No photos captured yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <div className="relative">
            <img
              src={photo.dataUrl}
              alt="Captured"
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            
            {/* Quality Score Badge */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {Math.round(photo.qualityScore * 100)}%
            </div>
            
            {/* Best Photo Indicator */}
            {isBestPhoto(photo) && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded">
                <Star className="w-3 h-3 fill-current" />
              </div>
            )}
            
            {/* Remove Button */}
            <button
              onClick={() => onRemovePhoto(photo.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {new Date(photo.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};