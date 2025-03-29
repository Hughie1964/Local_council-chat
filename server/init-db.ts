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
    
    try {
      const { stdout, stderr } = await exec('npm run db:push');
      console.log('Migration stdout:', stdout);
      if (stderr) console.error('Migration stderr:', stderr);
      console.log('Database schema pushed successfully');
    } catch (error) {
      console.error('Error pushing schema:', error);
      return;
    }
    
    // Initialize demo data
    console.log('Seeding demo data...');
    await (storage as any).initializeDemoData();
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export { initializeDatabase };