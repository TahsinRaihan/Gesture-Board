/**
 * Gesture Detection Service
 * Recognizes hand gestures from landmark positions
 */

import { HandPose, GestureResult, Point } from '@/types';
import { distance } from '@/utils/helpers';
import { GESTURE_CONFIG } from '@/utils/constants';

/**
 * Detect pinch gesture (thumb + index finger touching)
 */
const isPinching = (
  landmarks: Point[],
  threshold: number = GESTURE_CONFIG.PINCH_THRESHOLD
): boolean => {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  if (!thumbTip || !indexTip) return false;

  const pinchDistance = distance(thumbTip, indexTip);
  const handSize = distance(landmarks[0], landmarks[9]); // wrist to middle base

  // Pinch if finger distance is less than 10% of hand size
  return pinchDistance < handSize * threshold;
};

/**
 * Detect open hand (all fingers spread apart)
 */
const isOpenHand = (landmarks: Point[]): boolean => {
  const fingerTips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];

  // Check if all fingers are spread (average distance > threshold)
  let spreadSum = 0;
  for (let i = 0; i < fingerTips.length - 1; i++) {
    for (let j = i + 1; j < fingerTips.length; j++) {
      spreadSum += distance(fingerTips[i], fingerTips[j]);
    }
  }

  const avgSpread = spreadSum / 10; // 5 choose 2 = 10 pairs
  const handSize = distance(landmarks[0], landmarks[9]);

  return avgSpread > handSize * 0.4;
};

/**
 * Detect fist (all fingers closed together)
 */
const isFist = (landmarks: Point[]): boolean => {
  const fingerTips = [
    landmarks[4], // thumb
    landmarks[8], // index
    landmarks[12], // middle
    landmarks[16], // ring
    landmarks[20], // pinky
  ];

  const palm = landmarks[9]; // middle base

  // All fingers should be close to palm
  return fingerTips.every((tip) => {
    if (!tip || !palm) return false;
    return distance(tip, palm) < distance(landmarks[0], palm) * 0.5;
  });
};

/**
 * Detect pointing gesture (index finger extended)
 */
const isPointing = (landmarks: Point[]): boolean => {
  const indexTip = landmarks[8];
  const indexPIP = landmarks[6]; // index middle joint
  const indexMCP = landmarks[5]; // index base joint

  if (!indexTip || !indexPIP || !indexMCP) return false;

  // Check if index finger is significantly extended
  const indexExtension =
    distance(indexMCP, indexTip) / distance(indexMCP, indexPIP);

  // Other fingers should be curled
  const otherFingers = [
    { tip: landmarks[12], mid: landmarks[10] }, // middle
    { tip: landmarks[16], mid: landmarks[14] }, // ring
    { tip: landmarks[20], mid: landmarks[18] }, // pinky
  ];

  const othersAreCurled = otherFingers.every(
    (finger) =>
      finger.tip &&
      finger.mid &&
      distance(finger.mid, finger.tip) <
        distance(finger.mid, landmarks[9]) * 0.3
  );

  return indexExtension > 1.8 && othersAreCurled;
};

/**
 * Detect pointing up gesture (index and middle fingers up)
 */
const isPointingUp = (landmarks: Point[]): boolean => {
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const wrist = landmarks[0];

  if (!indexTip || !middleTip || !wrist) return false;

  // Both fingers pointing upward (negative Y direction)
  const indexUp = indexTip.y < wrist.y - 50;
  const middleUp = middleTip.y < wrist.y - 50;

  // Should be side by side (similar X)
  const sideBySide = Math.abs(indexTip.x - middleTip.x) < 50;

  // Ring finger should not extend
  const ringTip = landmarks[16];
  const ringDown = ringTip && ringTip.y > wrist.y - 20;

  return indexUp && middleUp && sideBySide && ringDown;
};

/**
 * Main gesture detection function
 */
export const detectGesture = (handPose: HandPose | null): GestureResult => {
  if (!handPose) {
    return { type: 'none', confidence: 0 };
  }

  const landmarks = handPose.landmarks;

  // Check gestures in order of specificity
  if (isPinching(landmarks)) {
    return { type: 'pinch', confidence: 0.9 };
  }

  if (isPointingUp(landmarks)) {
    return { type: 'pointing-up', confidence: 0.85 };
  }

  if (isPointing(landmarks)) {
    return { type: 'point', confidence: 0.85 };
  }

  if (isFist(landmarks)) {
    return { type: 'fist', confidence: 0.8 };
  }

  if (isOpenHand(landmarks)) {
    return { type: 'open', confidence: 0.85 };
  }

  return { type: 'none', confidence: 0 };
};

/**
 * Get the tip position of index finger (for cursor)
 */
export const getIndexFingerTip = (handPose: HandPose): Point | null => {
  return handPose.landmarks[8] || null;
};

/**
 * Smooth gesture detection with hysteresis
 */
let lastGesture: GestureResult = { type: 'none', confidence: 0 };
const GESTURE_HISTORY_WINDOW = 3;
let gestureHistory: GestureResult[] = [];

export const detectGestureSmoothed = (handPose: HandPose | null): GestureResult => {
  const currentGesture = detectGesture(handPose);

  // Maintain history for smoothing
  gestureHistory.push(currentGesture);
  if (gestureHistory.length > GESTURE_HISTORY_WINDOW) {
    gestureHistory.shift();
  }

  // If the last N frames have the same gesture, consider it valid
  const mostCommon = gestureHistory.reduce((acc, g) => {
    acc[g.type] = (acc[g.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(mostCommon));

  if (maxCount >= 2) {
    const detectedType = Object.keys(mostCommon).find(
      (k) => mostCommon[k] === maxCount
    ) as GestureResult['type'];

    lastGesture = {
      type: detectedType || 'none',
      confidence: maxCount / gestureHistory.length,
    };
  }

  return lastGesture;
};
