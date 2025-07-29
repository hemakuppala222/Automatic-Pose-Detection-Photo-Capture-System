import { useEffect, useRef, useState } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported in this browser');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          setError(null);
        }
      } catch (err) {
        let errorMessage = 'Failed to access camera.';
        
        if (err instanceof Error) {
          switch (err.name) {
            case 'NotAllowedError':
              errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.';
              break;
            case 'NotFoundError':
              errorMessage = 'No camera found. Please connect a camera and try again.';
              break;
            case 'NotReadableError':
              errorMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
              break;
            case 'OverconstrainedError':
              errorMessage = 'Camera constraints could not be satisfied. Please try with a different camera.';
              break;
            case 'SecurityError':
              errorMessage = 'Camera access blocked due to security restrictions. Please ensure you\'re using HTTPS or localhost.';
              break;
            case 'AbortError':
              errorMessage = 'Camera access was aborted. Please try again.';
              break;
            default:
              // Handle the specific "Device in use" error message
              if (err.message.includes('Device in use') || err.message.includes('device in use')) {
                errorMessage = 'Camera is currently being used by another application. Please close other apps using the camera (like video calls, other browser tabs, or camera apps) and try again.';
              } else {
                errorMessage = `Camera error: ${err.message}`;
              }
          }
        }
        
        setError(errorMessage);
        console.error('Camera access error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retryCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(null);
      }
    } catch (err) {
      let errorMessage = 'Failed to access camera.';
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found. Please connect a camera and try again.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints could not be satisfied. Please try with a different camera.';
            break;
          case 'SecurityError':
            errorMessage = 'Camera access blocked due to security restrictions. Please ensure you\'re using HTTPS or localhost.';
            break;
          case 'AbortError':
            errorMessage = 'Camera access was aborted. Please try again.';
            break;
          default:
            // Handle the specific "Device in use" error message
            if (err.message.includes('Device in use') || err.message.includes('device in use')) {
              errorMessage = 'Camera is currently being used by another application. Please close other apps using the camera (like video calls, other browser tabs, or camera apps) and try again.';
            } else {
              errorMessage = `Camera error: ${err.message}`;
            }
        }
      }
      
      setError(errorMessage);
      console.error('Camera access error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    videoRef,
    isLoading,
    error,
    stopCamera,
    retryCamera
  };
};