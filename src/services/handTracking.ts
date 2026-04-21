/**
 * Hand Tracking Service using MediaPipe
 * Initializes and manages hand detection from webcam feed
 */

import { HandPose, Point } from '@/types';
import { HAND_TRACKING_CONFIG } from '@/utils/constants';

let handDetector: any = null;
let webcamRunning = false;
let video: HTMLVideoElement | null = null;

/**
 * Initialize hand tracking model
 */
export const initializeHandTracking = async (
  videoElement: HTMLVideoElement
): Promise<void> => {
  try {
    console.log('Initializing hand tracking...');

    // Check if MediaPipe is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC not supported');
    }

    // Dynamically import MediaPipe tasks
    const vision = await import('@mediapipe/tasks-vision');

    const { HandLandmarker, FilesetResolver } = vision;

    console.log('Loading MediaPipe model...');
    const wasmLoaderPath = await FilesetResolver.forVisionTasks(
      HAND_TRACKING_CONFIG.MODEL_ASSET_PATH
    );

    handDetector = await HandLandmarker.createFromOptions(wasmLoaderPath, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU" // Changed from GPU to CPU for better compatibility
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: HAND_TRACKING_CONFIG.DETECTION_CONFIDENCE,
      minHandPresenceConfidence: HAND_TRACKING_CONFIG.DETECTION_CONFIDENCE,
      minTrackingConfidence: HAND_TRACKING_CONFIG.TRACKING_CONFIDENCE,
    });

    video = videoElement;
    console.log('Hand tracking initialized successfully');

    // Request camera permission and start streaming
    await startWebcam();
  } catch (error) {
    console.error('Failed to initialize hand tracking:', error);
    // Try fallback initialization
    try {
      console.log('Trying fallback initialization...');
      await initializeFallbackHandTracking(videoElement);
    } catch (fallbackError) {
      console.error('Fallback hand tracking also failed:', fallbackError);
      throw error;
    }
  }
};

/**
 * Start webcam stream
 */
const startWebcam = async (): Promise<void> => {
  try {
    console.log('Requesting camera access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user' // Use front camera
      },
      audio: false,
    });

    if (video) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, starting playback...');
        video!.play().then(() => {
          webcamRunning = true;
          console.log('Webcam started successfully');
        }).catch((playError) => {
          console.error('Failed to play video:', playError);
          throw playError;
        });
      };

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video ready timeout'));
        }, 5000);

        if (video) {
          video.oncanplay = () => {
            clearTimeout(timeout);
            resolve();
          };

          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Video error'));
          };
        } else {
          reject(new Error('Video element not available'));
        }
      });
    }
  } catch (error) {
    console.error('Failed to start webcam:', error);
    throw error;
  }
};

/**
 * Stop webcam stream
 */
export const stopWebcam = (): void => {
  if (video && video.srcObject) {
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    webcamRunning = false;
  }
};

/**
 * Detect hand pose from current video frame
 */
export const detectHandPose = (
  timestamp: number = Date.now()
): HandPose | null => {
  if (
    !handDetector ||
    !video ||
    !webcamRunning ||
    video.readyState < video.HAVE_CURRENT_DATA ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return null;
  }

  try {
    const results = handDetector.detectForVideo(video, timestamp);

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      const handedness = results.handedness?.[0];

      // Check if video is mirrored via CSS transform
      const isVideoMirrored = video.style.transform.includes('scaleX(-1)');

      // Convert normalized coordinates (0-1) to pixel coordinates
      const points: Point[] = landmarks.map((landmark: any) => {
        let x = landmark.x * (video?.videoWidth || 1280);
        if (isVideoMirrored) {
          // Flip X-coordinate to match mirrored video display
          x = (1 - landmark.x) * (video?.videoWidth || 1280);
        }
        return {
          x,
          y: landmark.y * (video?.videoHeight || 720),
        };
      });

      return {
        landmarks: points,
        confidence: handedness?.score || 0.9,
        handedness: handedness?.categoryName || 'Right',
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting hand pose:', error);
    return null;
  }
};

/**
 * Get hand landmark by index
 * https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
export const getHandLandmark = (
  handPose: HandPose,
  landmarkIndex: number
): Point | null => {
  if (handPose.landmarks[landmarkIndex]) {
    return handPose.landmarks[landmarkIndex];
  }
  return null;
};

/**
 * Get specific hand landmarks
 */
export const getHandLandmarks = (handPose: HandPose) => {
  return {
    wrist: handPose.landmarks[0],
    thumbTip: handPose.landmarks[4],
    indexTip: handPose.landmarks[8],
    middleTip: handPose.landmarks[12],
    ringTip: handPose.landmarks[16],
    pinkyTip: handPose.landmarks[20],
  };
};

/**
 * Clean up resources
 */
export const cleanupHandTracking = (): void => {
  stopWebcam();
  handDetector = null;
  video = null;
};

/**
 * Check if hand tracking is ready
 */
export const isHandTrackingReady = (): boolean => {
  return handDetector !== null && webcamRunning;
};

/**
 * Fallback hand tracking initialization with different settings
 */
const initializeFallbackHandTracking = async (
  videoElement: HTMLVideoElement
): Promise<void> => {
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const { HandLandmarker, FilesetResolver } = vision;

    const wasmLoaderPath = await FilesetResolver.forVisionTasks(
      HAND_TRACKING_CONFIG.MODEL_ASSET_PATH
    );

    handDetector = await HandLandmarker.createFromOptions(wasmLoaderPath, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.3, // Lower threshold
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });

    video = videoElement;
    await startWebcam();
  } catch (error) {
    console.error('Fallback initialization failed:', error);
    throw error;
  }
};
