// Audio utilities for the application

// Pre-load the notification sound for better performance
let notificationSound: HTMLAudioElement | null = null;

// Initialize the audio when the module loads
try {
  notificationSound = new Audio();
  notificationSound.src = '/sounds/notification.mp3';
  // Set to low volume by default
  notificationSound.volume = 0.5;
  // Preload the audio
  notificationSound.load();
} catch (error) {
  console.error("Failed to initialize notification sound:", error);
}

/**
 * Play the notification sound
 * This function tries to handle various browser autoplay restrictions
 */
export function playNotificationSound(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!notificationSound) {
      console.error("Notification sound not initialized");
      reject(new Error("Notification sound not initialized"));
      return;
    }

    try {
      // Reset the audio to the beginning
      notificationSound.currentTime = 0;
      
      // Add event listeners to track play status
      const onPlaySuccess = () => {
        notificationSound?.removeEventListener('play', onPlaySuccess);
        notificationSound?.removeEventListener('error', onPlayError);
        resolve();
      };
      
      const onPlayError = (error: Event) => {
        notificationSound?.removeEventListener('play', onPlaySuccess);
        notificationSound?.removeEventListener('error', onPlayError);
        console.error("Error playing notification sound:", error);
        reject(error);
      };
      
      notificationSound.addEventListener('play', onPlaySuccess);
      notificationSound.addEventListener('error', onPlayError);
      
      // Try to play the sound
      const playPromise = notificationSound.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Browser blocked autoplay:", error);
          // Clean up listeners since the promise will reject
          notificationSound?.removeEventListener('play', onPlaySuccess);
          notificationSound?.removeEventListener('error', onPlayError);
          reject(error);
        });
      }
    } catch (error) {
      console.error("Exception playing notification sound:", error);
      reject(error);
    }
  });
}

/**
 * Generic play sound function for any sound
 */
export async function playSound(soundPath: string): Promise<void> {
  try {
    if (soundPath === '/sounds/notification.mp3') {
      return playNotificationSound();
    }
    
    // For other sounds, create a new audio element
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.warn(`Failed to play sound ${soundPath}:`, error);
    throw error;
  }
}