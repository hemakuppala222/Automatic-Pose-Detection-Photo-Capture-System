import React, { useRef, useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { CapturedPhoto } from '../types/pose';

interface LayoutGeneratorProps {
  photos: CapturedPhoto[];
  layoutType?: 'passport' | 'id' | 'custom';
}

export const LayoutGenerator: React.FC<LayoutGeneratorProps> = ({ 
  photos, 
  layoutType = 'passport' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layoutDataUrl, setLayoutDataUrl] = useState<string>('');

  useEffect(() => {
    if (photos.length > 0) {
      generateLayout();
    }
  }, [photos, layoutType]);

  const generateLayout = async () => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 size at 300 DPI: 2480 x 3508 pixels
    // A6 size at 300 DPI: 1240 x 1754 pixels
    const pageWidth = 2480;
    const pageHeight = 3508;
    
    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Passport photo dimensions (35mm x 45mm at 300 DPI)
    const photoWidth = 413; // 35mm * 300 DPI / 25.4
    const photoHeight = 531; // 45mm * 300 DPI / 25.4
    
    // Calculate grid layout
    const cols = Math.floor(pageWidth / (photoWidth + 60));
    const rows = Math.floor(pageHeight / (photoHeight + 60));
    const totalSlots = cols * rows;
    
    const margin = 60;
    const startX = (pageWidth - (cols * photoWidth + (cols - 1) * margin)) / 2;
    const startY = (pageHeight - (rows * photoHeight + (rows - 1) * margin)) / 2;

    // Load and draw photos
    const photoPromises = photos.slice(0, totalSlots).map((photo, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          
          const x = startX + col * (photoWidth + margin);
          const y = startY + row * (photoHeight + margin);
          
          // Draw photo with proper aspect ratio
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
          
          // Draw border
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, photoWidth, photoHeight);
          
          resolve();
        };
        img.src = photo.dataUrl;
      });
    });

    await Promise.all(photoPromises);
    
    // Add cutting guides
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical guides
    for (let i = 1; i < cols; i++) {
      const x = startX + i * (photoWidth + margin) - margin / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pageHeight);
      ctx.stroke();
    }
    
    // Horizontal guides
    for (let i = 1; i < rows; i++) {
      const y = startY + i * (photoHeight + margin) - margin / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(pageWidth, y);
      ctx.stroke();
    }

    setLayoutDataUrl(canvas.toDataURL('image/png', 1.0));
  };

  const downloadLayout = () => {
    if (!layoutDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `passport-photos-${Date.now()}.png`;
    link.href = layoutDataUrl;
    link.click();
  };

  const printLayout = () => {
    if (!layoutDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Passport Photos</title>
            <style>
              body { margin: 0; padding: 0; }
              img { width: 100%; height: auto; }
              @page { margin: 0; }
            </style>
          </head>
          <body>
            <img src="${layoutDataUrl}" alt="Passport Photos Layout" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Capture some photos to generate a layout</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Print Layout</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadLayout}
            disabled={!layoutDataUrl}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={printLayout}
            disabled={!layoutDataUrl}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full max-w-md mx-auto border border-gray-300 rounded-lg shadow-lg"
        style={{ aspectRatio: '2480/3508' }}
      />
      
      <div className="text-sm text-gray-600 text-center">
        Layout: {layoutType} | Photos: {photos.length} | Size: A4 (210×297mm)
      </div>
    </div>
  );
};