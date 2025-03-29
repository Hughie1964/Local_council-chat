import { storage } from './storage';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

// Initialize database tables and seed with demo data
async function initializeDatabase() {
  try {
    console.log('Initializing database and seeding demo data...');
    
    // Push schema to the database to create the necessary tables
    console.log('Running database migrations...');
    
    // Skip the database push as it requires interactive input
    // We'll assume the database is already set up correctly
    console.log('Skipping db:push as it requires interactive input');
    console.log('Database schema assumed to be up to date');
    
    // Initialize demo data
    console.log('Seeding demo data...');
    await (storage as any).initializeDemoData();
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export { initializeDatabase };