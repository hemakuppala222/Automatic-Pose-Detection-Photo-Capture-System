export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  qualityScore: number;
  pose?: Pose;
}

export interface PoseDetectionState {
  isCorrectPose: boolean;
  confidence: number;
  message: string;
  status: 'detecting' | 'ready' | 'capturing' | 'countdown';
}