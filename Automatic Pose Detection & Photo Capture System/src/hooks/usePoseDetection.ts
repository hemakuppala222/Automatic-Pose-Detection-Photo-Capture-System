import { useEffect, useRef, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import { Pose, PoseDetectionState } from '../types/pose';

export const usePoseDetection = (videoElement: HTMLVideoElement | null) => {
  const [model, setModel] = useState<posenet.PoseNet | null>(null);
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [poseState, setPoseState] = useState<PoseDetectionState>({
    isCorrectPose: false,
    confidence: 0,
    message: 'Loading pose detection...',
    status: 'detecting'
  });
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const net = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: 0.75
        });
        setModel(net);
        setPoseState(prev => ({ ...prev, message: 'Ready to detect pose' }));
      } catch (error) {
        console.error('Failed to load PoseNet model:', error);
        setPoseState(prev => ({ ...prev, message: 'Failed to load pose detection' }));
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (!model || !videoElement) return;

    const detectPose = async () => {
      try {
        // Check if video has valid dimensions before attempting pose detection
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
          return; // Skip detection until video dimensions are available
        }

        // Additional check to ensure video is ready
        if (videoElement.readyState < 2) {
          return; // Skip detection until video has loaded enough data
        }

        const pose = await model.estimateSinglePose(videoElement, {
          flipHorizontal: true
        });

        setCurrentPose(pose);
        
        const poseQuality = evaluatePoseQuality(pose);
        setPoseState({
          isCorrectPose: poseQuality.isCorrect,
          confidence: poseQuality.confidence,
          message: poseQuality.message,
          status: poseQuality.isCorrect ? 'ready' : 'detecting'
        });
      } catch (error) {
        console.error('Pose detection error:', error);
      }
    };

    detectionIntervalRef.current = setInterval(detectPose, 100);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [model, videoElement]);

  const evaluatePoseQuality = (pose: posenet.Pose) => {
    const keypoints = pose.keypoints;
    const requiredPoints = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'];
    
    // Check if key facial points are visible
    const visibleFacePoints = requiredPoints.filter(pointName => {
      const point = keypoints.find(kp => kp.part === pointName);
      return point && point.score > 0.5;
    });

    // Check pose alignment (head should be roughly centered and upright)
    const nose = keypoints.find(kp => kp.part === 'nose');
    const leftShoulder = keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = keypoints.find(kp => kp.part === 'rightShoulder');

    let isCorrect = false;
    let confidence = 0;
    let message = 'Position yourself in the frame';

    if (visibleFacePoints.length >= 3) {
      confidence = visibleFacePoints.length / requiredPoints.length;
      
      // Check if shoulders are roughly level (passport pose)
      if (leftShoulder && rightShoulder && nose) {
        const shoulderDiff = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
        const isLevel = shoulderDiff < 50; // pixels
        const isCentered = nose.position.x > 200 && nose.position.x < 440; // roughly centered
        
        if (isLevel && isCentered && confidence > 0.7) {
          isCorrect = true;
          message = 'Perfect pose! Stay still...';
        } else if (!isLevel) {
          message = 'Keep your shoulders level';
        } else if (!isCentered) {
          message = 'Center yourself in the frame';
        } else {
          message = 'Almost there, stay still';
        }
      }
    }

    return { isCorrect, confidence, message };
  };

  return {
    model,
    currentPose,
    poseState,
    setPoseState
  };
};