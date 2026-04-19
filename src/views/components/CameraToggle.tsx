/**
 * Camera Toggle Component
 * Enable/disable hand gesture recognition
 */

import React, { useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { useStore } from '@/store/store';
import '../styles/CameraToggle.css';

const CameraToggle: React.FC = () => {
  const state = useStore();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    try {
      if (state.isHandGestureEnabled) {
        state.setHandGestureEnabled(false);
      } else {
        // Request camera permission
        await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        state.setHandGestureEnabled(true);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      alert(`Error: ${error.message || 'Could not access camera'}`);
      state.setHandGestureEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`camera-toggle ${state.isHandGestureEnabled ? 'active' : ''} ${
        loading ? 'loading' : ''
      }`}
      onClick={handleToggle}
      disabled={loading}
      title={state.isHandGestureEnabled ? 'Disable Hand Gestures' : 'Enable Hand Gestures'}
    >
      {state.isHandGestureEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
      <span className="tooltip">
        {loading ? 'Initializing...' : state.isHandGestureEnabled ? 'Hand Gestures ON' : 'Hand Gestures OFF'}
      </span>
    </button>
  );
};

export default CameraToggle;
