// Audio utilities for the application

// This is a workaround for browser autoplay restrictions
// We create a single audio context on user interaction
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let isAudioInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the audio system on first user interaction
 * This must be called from a user interaction event handler
 */
export function initializeAudio(): Promise<void> {
  // If audio is already initialized or being initialized, return the existing promise
  if (isAudioInitialized) {
    return Promise.resolve();
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Create a new initialization promise
  initializationPromise = new Promise<void>((resolve, reject) => {
    try {
      // Create AudioContext on user interaction
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fetch the audio file
      fetch('/sounds/notification.mp3')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch sound file: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          if (!audioContext) {
            throw new Error('AudioContext not initialized');
          }
          
          // Decode the audio file
          return audioContext.decodeAudioData(arrayBuffer);
        })
        .then(buffer => {
          audioBuffer = buffer;
          isAudioInitialized = true;
          console.log('Audio system initialized successfully');
          resolve();
        })
        .catch(error => {
          console.error('Failed to initialize audio:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Exception initializing audio:', error);
      reject(error);
    }
  });
  
  return initializationPromise;
}

/**
 * Play the notification sound
 * This uses Web Audio API which has better browser support for playing
 * sounds without user interaction once initialized
 */
export function playNotificationSound(): Promise<void> {
  // If audio is not initialized, just return resolved promise
  // We don't want to try to initialize audio here as it requires user interaction
  if (!isAudioInitialized || !audioContext || !audioBuffer) {
    console.warn('Cannot play notification sound: Audio not initialized');
    return Promise.resolve();
  }
  
  try {
    // Create a sound source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create a gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // Set volume to 50%
    
    // Connect the source to the gain node and the gain node to the destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play the sound
    source.start(0);
    console.log('Playing notification sound');
    
    // Return a promise that resolves when the sound is done playing
    return new Promise((resolve) => {
      source.onended = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    return Promise.resolve();
  }
}

/**
 * Generic play sound function for any sound
 * NOTE: This is mainly for backward compatibility
 */
export async function playSound(soundPath: string): Promise<void> {
  if (soundPath === '/sounds/notification.mp3') {
    return playNotificationSound();
  }
  
  console.warn('playSound is deprecated, use playNotificationSound instead');
  return playNotificationSound();
}