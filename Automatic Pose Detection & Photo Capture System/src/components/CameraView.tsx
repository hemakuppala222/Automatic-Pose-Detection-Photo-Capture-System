import React, { useEffect, useRef } from 'react';
import { Camera, Circle } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { Pose } from '../types/pose';

interface CameraViewProps {
  onPoseDetected: (pose: Pose) => void;
  onVideoReady: (video: HTMLVideoElement) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onPoseDetected, onVideoReady }) => {
  const { videoRef, isLoading, error } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentPose, poseState } = usePoseDetection(videoRef.current);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      onVideoReady(videoRef.current);
    }
  }, [onVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => {
        onVideoReady(video);
      };
      video.addEventListener('loadeddata', handleLoadedData);
      return () => video.removeEventListener('loadeddata', handleLoadedData);
    }
  }, [onVideoReady]);

  useEffect(() => {
    if (currentPose) {
      onPoseDetected(currentPose);
    }
  }, [currentPose, onPoseDetected]);

  useEffect(() => {
    const drawPose = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video || !currentPose) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw pose keypoints
      currentPose.keypoints.forEach((keypoint) => {
        if (keypoint.score > 0.3) {
          ctx.beginPath();
          ctx.arc(keypoint.position.x, keypoint.position.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = poseState.isCorrectPose ? '#10B981' : '#F59E0B';
          ctx.fill();
        }
      });
      
      // Draw connections between keypoints
      const connections = [
        ['nose', 'leftEye'], ['nose', 'rightEye'],
        ['leftEye', 'leftEar'], ['rightEye', 'rightEar'],
        ['leftShoulder', 'rightShoulder'],
        ['leftShoulder', 'leftElbow'], ['rightShoulder', 'rightElbow']
      ];
      
      connections.forEach(([start, end]) => {
        const startPoint = currentPose.keypoints.find(kp => kp.part === start);
        const endPoint = currentPose.keypoints.find(kp => kp.part === end);
        
        if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(startPoint.position.x, startPoint.position.y);
          ctx.lineTo(endPoint.position.x, endPoint.position.y);
          ctx.strokeStyle = poseState.isCorrectPose ? '#10B981' : '#F59E0B';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };
    
    drawPose();
  }, [currentPose, poseState.isCorrectPose]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-white">Loading camera...</div>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto transform scale-x-[-1]"
        style={{ maxHeight: '480px' }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] pointer-events-none"
      />
      
      {/* Pose Status Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className={`px-4 py-2 rounded-lg text-white text-center font-medium ${
          poseState.isCorrectPose ? 'bg-green-600' : 'bg-yellow-600'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <Circle 
              className={`w-3 h-3 ${poseState.isCorrectPose ? 'fill-green-300' : 'fill-yellow-300'}`}
            />
            {poseState.message}
          </div>
          <div className="text-xs mt-1">
            Confidence: {Math.round(poseState.confidence * 100)}%
          </div>
        </div>
      </div>
      
      {/* Center Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border-2 border-white border-dashed rounded-lg w-64 h-80 opacity-50"></div>
      </div>
    </div>
  );
};