import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  isActive: boolean;
  onComplete: () => void;
  duration?: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  isActive, 
  onComplete, 
  duration = 3 
}) => {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setCount(duration);
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          onComplete();
          return duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onComplete, duration]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="text-8xl font-bold text-white animate-pulse">
        {count}
      </div>
    </div>
  );
};