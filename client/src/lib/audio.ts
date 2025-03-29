// Audio utilities for the application

// Pre-load the audio element to avoid loading delays
const notificationAudio = new Audio('/sounds/notification.mp3');
let isAudioInitialized = false;

/**
 * Initialize the audio system on first user interaction
 * This must be called from a user interaction event handler
 */
export function initializeAudio(): Promise<void> {
  // If audio is already initialized, return a resolved promise
  if (isAudioInitialized) {
    return Promise.resolve();
  }
  
  return new Promise<void>((resolve, reject) => {
    try {
      // Load the audio file
      notificationAudio.load();
      
      // Set volume to 50%
      notificationAudio.volume = 0.5;
      
      // Try playing and immediately pausing to "unlock" audio on some browsers
      const playPromise = notificationAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Immediately pause the audio
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
            
            isAudioInitialized = true;
            console.log('Audio system initialized successfully');
            resolve();
          })
          .catch(error => {
            // Auto-play was prevented
            console.warn('Audio initialization failed (auto-play prevented):', error);
            
            // Still consider it initialized - we'll try again on user interaction
            isAudioInitialized = true;
            resolve();
          });
      } else {
        // Browser doesn't return a promise from play()
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
        
        isAudioInitialized = true;
        console.log('Audio system initialized successfully');
        resolve();
      }
    } catch (error) {
      console.error('Exception initializing audio:', error);
      reject(error);
    }
  });
}

/**
 * Play the notification sound using HTML5 Audio
 * This is a simpler approach than Web Audio API
 */
export function playNotificationSound(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // Clone the audio element to allow overlapping sounds
      const audioClone = new Audio(notificationAudio.src);
      audioClone.volume = notificationAudio.volume;
      
      // Play the sound
      const playPromise = audioClone.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Playing notification sound');
            
            // Listen for the ended event to resolve the promise
            audioClone.onended = () => {
              resolve();
            };
          })
          .catch(error => {
            console.warn('Failed to play notification sound:', error);
            resolve(); // Resolve anyway to prevent hanging promises
          });
      } else {
        // Browser doesn't return a promise from play()
        console.log('Playing notification sound');
        
        // Listen for the ended event to resolve the promise
        audioClone.onended = () => {
          resolve();
        };
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      resolve(); // Resolve anyway to prevent hanging promises
    }
  });
}

/**
 * Generic play sound function for any sound
 * NOTE: This is mainly for backward compatibility
 */
export async function playSound(soundPath: string): Promise<void> {
  if (soundPath === '/sounds/notification.mp3') {
    return playNotificationSound();
  }
  
  // For other sounds, create a new Audio element
  const audio = new Audio(soundPath);
  audio.volume = 0.5;
  
  return new Promise<void>((resolve) => {
    audio.play().catch(console.error);
    audio.onended = () => resolve();
  });
}