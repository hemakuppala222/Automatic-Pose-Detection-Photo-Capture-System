import React, { useState, useCallback, useRef } from 'react';
import { Camera, RotateCcw, Download } from 'lucide-react';
import { CameraView } from './components/CameraView';
import { PhotoGrid } from './components/PhotoGrid';
import { CountdownTimer } from './components/CountdownTimer';
import { LayoutGenerator } from './components/LayoutGenerator';
import { usePhotoCapture } from './hooks/usePhotoCapture';
import { Pose } from './types/pose';

function App() {
  const [currentVideo, setCurrentVideo] = useState<HTMLVideoElement | null>(null);
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [activeTab, setActiveTab] = useState<'capture' | 'photos' | 'layout'>('capture');
  
  const {
    capturedPhotos,
    isCapturing,
    setIsCapturing,
    capturePhoto,
    addPhoto,
    removePhoto,
    getBestPhotos,
    clearPhotos
  } = usePhotoCapture();

  const lastCaptureTime = useRef<number>(0);
  const poseStableTime = useRef<number>(0);
  const wasCorrectPose = useRef<boolean>(false);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    setCurrentVideo(video);
  }, []);

  const handlePoseDetected = useCallback((pose: Pose) => {
    setCurrentPose(pose);
    
    if (!autoCapture || !currentVideo || isCapturing || isCountdownActive) return;
    
    // Check if enough time has passed since last capture
    const now = Date.now();
    if (now - lastCaptureTime.current < 5000) return; // 5 second cooldown
    
    // Simple pose quality check
    const faceKeypoints = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'];
    const visibleFacePoints = faceKeypoints.filter(pointName => {
      const point = pose.keypoints.find(kp => kp.part === pointName);
      return point && point.score > 0.5;
    });
    
    const isGoodPose = visibleFacePoints.length >= 4;
    
    if (isGoodPose) {
      if (!wasCorrectPose.current) {
        poseStableTime.current = now;
        wasCorrectPose.current = true;
      } else if (now - poseStableTime.current > 2000) { // 2 seconds of stable pose
        startCountdown();
        wasCorrectPose.current = false;
      }
    } else {
      wasCorrectPose.current = false;
    }
  }, [autoCapture, currentVideo, isCapturing, isCountdownActive]);

  const startCountdown = () => {
    setIsCountdownActive(true);
  };

  const handleCountdownComplete = async () => {
    setIsCountdownActive(false);
    
    if (currentVideo) {
      setIsCapturing(true);
      try {
        const photo = await capturePhoto(currentVideo);
        addPhoto(photo);
        lastCaptureTime.current = Date.now();
      } catch (error) {
        console.error('Failed to capture photo:', error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleManualCapture = async () => {
    if (!currentVideo || isCapturing) return;
    
    setIsCapturing(true);
    try {
      const photo = await capturePhoto(currentVideo);
      addPhoto(photo);
    } catch (error) {
      console.error('Failed to capture photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const bestPhotos = getBestPhotos(4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Photo Booth
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Automatic pose detection and photo capture system. Position yourself in front of the camera 
            and hold a passport-style pose for automatic capture.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'capture'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Capture
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Photos ({capturedPhotos.length})
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'layout'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Layout
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'capture' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <CameraView
                  onPoseDetected={handlePoseDetected}
                  onVideoReady={handleVideoReady}
                />
                
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={handleManualCapture}
                    disabled={isCapturing || !currentVideo}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-5 h-5" />
                    {isCapturing ? 'Capturing...' : 'Manual Capture'}
                  </button>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoCapture}
                      onChange={(e) => setAutoCapture(e.target.checked)}
                      className="rounded"
                    />
                    Auto-capture on good pose
                  </label>
                </div>
              </div>
              
              {capturedPhotos.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Captures</h2>
                    <button
                      onClick={clearPhotos}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>
                  <PhotoGrid
                    photos={capturedPhotos.slice(-4)}
                    onRemovePhoto={removePhoto}
                    bestPhotos={bestPhotos}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">All Photos</h2>
                <button
                  onClick={clearPhotos}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All
                </button>
              </div>
              <PhotoGrid
                photos={capturedPhotos}
                onRemovePhoto={removePhoto}
                bestPhotos={bestPhotos}
              />
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LayoutGenerator photos={bestPhotos} />
            </div>
          )}
        </div>

        <CountdownTimer
          isActive={isCountdownActive}
          onComplete={handleCountdownComplete}
          duration={3}
        />
      </div>
    </div>
  );
}

export default App;