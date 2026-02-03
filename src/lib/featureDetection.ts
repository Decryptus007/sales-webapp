import React from 'react';

/**
 * Feature detection utilities for graceful degradation
 */

export interface FeatureSupport {
  localStorage: boolean;
  fileSystemAccess: boolean;
  dragAndDrop: boolean;
  touchEvents: boolean;
  webWorkers: boolean;
  indexedDB: boolean;
}

/**
 * Detect browser feature support
 */
export function detectFeatureSupport(): FeatureSupport {
  const support: FeatureSupport = {
    localStorage: false,
    fileSystemAccess: false,
    dragAndDrop: false,
    touchEvents: false,
    webWorkers: false,
    indexedDB: false,
  };

  if (typeof window === 'undefined') {
    return support;
  }

  // localStorage support
  try {
    const testKey = '__feature_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    support.localStorage = true;
  } catch {
    support.localStorage = false;
  }

  // File System Access API support
  support.fileSystemAccess = 'showOpenFilePicker' in window;

  // Drag and Drop support
  support.dragAndDrop = 'draggable' in document.createElement('div') &&
    'ondrop' in document.createElement('div');

  // Touch events support
  support.touchEvents = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  // Web Workers support
  support.webWorkers = typeof Worker !== 'undefined';

  // IndexedDB support
  support.indexedDB = 'indexedDB' in window;

  return support;
}

/**
 * Get fallback options when features are not supported
 */
export function getFallbackOptions(features: FeatureSupport) {
  const fallbacks = {
    storage: features.localStorage ? 'localStorage' : 'memory',
    fileUpload: features.fileSystemAccess ? 'fileSystemAccess' : 'traditional',
    interaction: features.touchEvents ? 'touch' : 'mouse',
    dataProcessing: features.webWorkers ? 'webWorker' : 'mainThread',
    database: features.indexedDB ? 'indexedDB' : features.localStorage ? 'localStorage' : 'memory',
  };

  return fallbacks;
}

/**
 * Check if the current environment supports all required features
 */
export function checkRequiredFeatures(): { supported: boolean; missing: string[] } {
  const features = detectFeatureSupport();
  const required = ['localStorage']; // Minimum required features
  const missing: string[] = [];

  required.forEach(feature => {
    if (!features[feature as keyof FeatureSupport]) {
      missing.push(feature);
    }
  });

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Get user-friendly messages for unsupported features
 */
export function getUnsupportedFeatureMessage(feature: string): string {
  const messages: Record<string, string> = {
    localStorage: 'Your browser does not support local storage. Data will not be saved between sessions.',
    fileSystemAccess: 'Your browser does not support the File System Access API. File operations may be limited.',
    dragAndDrop: 'Your browser does not support drag and drop. Please use the file picker instead.',
    touchEvents: 'Touch events are not supported. Some mobile features may not work properly.',
    webWorkers: 'Web Workers are not supported. Large operations may block the interface.',
    indexedDB: 'IndexedDB is not supported. Using localStorage as fallback.',
  };

  return messages[feature] || `The feature "${feature}" is not supported in your browser.`;
}

/**
 * Hook for feature detection with React
 */
export function useFeatureDetection() {
  const [features, setFeatures] = React.useState<FeatureSupport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const detected = detectFeatureSupport();
    setFeatures(detected);
    setIsLoading(false);
  }, []);

  const fallbacks = features ? getFallbackOptions(features) : null;
  const requiredCheck = features ? checkRequiredFeatures() : null;

  return {
    features,
    fallbacks,
    isSupported: requiredCheck?.supported ?? false,
    missingFeatures: requiredCheck?.missing ?? [],
    isLoading,
    getUnsupportedMessage: getUnsupportedFeatureMessage,
  };
}