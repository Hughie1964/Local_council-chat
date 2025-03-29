import crypto from 'crypto';
import { User } from '@shared/schema';
import { storage } from './storage';

// Generate a verification token for a user
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a verification link
export function generateVerificationLink(token: string): string {
  // In a production environment, this would be your actual domain
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-email?token=${token}`;
}

// Set a verification token for a user
export async function setVerificationTokenForUser(userId: number): Promise<string | null> {
  try {
    const token = generateVerificationToken();
    // Token expires in 24 hours
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await storage.updateUserVerificationToken(userId, token, expiry);
    
    return token;
  } catch (error) {
    console.error('Error setting verification token:', error);
    return null;
  }
}

// Verify a user with a given token
export async function verifyUserWithToken(token: string): Promise<boolean> {
  try {
    const user = await storage.verifyUser(token);
    return !!user;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}

// Send a verification email to a user
// This is a mock function - in a real implementation, you would use nodemailer
export async function sendVerificationEmail(user: User, token: string): Promise<boolean> {
  try {
    const verificationLink = generateVerificationLink(token);
    
    // Instead of actually sending an email, we'll log it to the console
    console.log(`
    ========= VERIFICATION EMAIL =========
    To: ${user.email}
    Subject: Verify your UK Local Council Finance Chat account
    
    Hello ${user.username},
    
    Thank you for registering for the UK Local Council Finance Chat. 
    Please click the link below to verify your email address:
    
    ${verificationLink}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Regards,
    The UK Local Council Finance Chat Team
    ======================================
    `);
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}