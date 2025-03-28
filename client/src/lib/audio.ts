// Audio utilities for the application

/**
 * Play a notification sound
 * @param soundPath Path to the sound file
 * @returns Promise that resolves when sound has played or rejects with error
 */
export async function playSound(soundPath: string): Promise<void> {
  try {
    // Create a new Audio object each time to avoid issues with concurrent plays
    const audio = new Audio(soundPath);
    await audio.play();
  } catch (error) {
    console.warn(`Failed to play sound ${soundPath}:`, error);
    throw error;
  }
}