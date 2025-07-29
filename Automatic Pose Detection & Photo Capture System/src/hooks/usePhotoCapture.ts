import { useState, useCallback } from 'react';
import { CapturedPhoto } from '../types/pose';

export const usePhotoCapture = () => {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePhoto = useCallback((videoElement: HTMLVideoElement): Promise<CapturedPhoto> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Flip the image horizontally to match the video preview
      ctx.scale(-1, 1);
      ctx.drawImage(videoElement, -canvas.width, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const qualityScore = calculatePhotoQuality(canvas, ctx);
      
      const photo: CapturedPhoto = {
        id: Date.now().toString(),
        dataUrl,
        timestamp: Date.now(),
        qualityScore
      };
      
      resolve(photo);
    });
  }, []);

  const calculatePhotoQuality = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number => {
    // Simple quality assessment based on image sharpness and brightness
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let totalBrightness = 0;
    let edgeStrength = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      // Simple edge detection for sharpness
      if (i < data.length - 4) {
        const nextR = data[i + 4];
        const nextG = data[i + 5];
        const nextB = data[i + 6];
        const nextBrightness = (nextR + nextG + nextB) / 3;
        edgeStrength += Math.abs(brightness - nextBrightness);
      }
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    const normalizedEdgeStrength = edgeStrength / (data.length / 4);
    
    // Quality score based on optimal brightness and sharpness
    const brightnessScore = 1 - Math.abs(avgBrightness - 128) / 128;
    const sharpnessScore = Math.min(normalizedEdgeStrength / 20, 1);
    
    return (brightnessScore + sharpnessScore) / 2;
  };

  const addPhoto = useCallback((photo: CapturedPhoto) => {
    setCapturedPhotos(prev => [...prev, photo]);
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const getBestPhotos = useCallback((count: number = 4): CapturedPhoto[] => {
    return [...capturedPhotos]
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, count);
  }, [capturedPhotos]);

  const clearPhotos = useCallback(() => {
    setCapturedPhotos([]);
  }, []);

  return {
    capturedPhotos,
    isCapturing,
    setIsCapturing,
    capturePhoto,
    addPhoto,
    removePhoto,
    getBestPhotos,
    clearPhotos
  };
};