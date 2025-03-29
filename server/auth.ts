import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { setVerificationTokenForUser, sendVerificationEmail, verifyUserWithToken } from "./email-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Make sure we have a properly formatted stored password
    if (!stored || !stored.includes('.')) {
      console.log("Invalid stored password format");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("Missing hash or salt components");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Check buffer lengths before comparison
    if (hashedBuf.length !== suppliedBuf.length) {
      console.log(`Buffer length mismatch: ${hashedBuf.length} vs ${suppliedBuf.length}`);
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "uk-council-money-market-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Apply rate limiter to login route
  app.post("/api/login", loginLimiter, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, councilId, role = "user" } = req.body;
      
      // Check for required fields
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        councilId,
        role,
      });

      // Generate and set a verification token
      const token = await setVerificationTokenForUser(user.id);
      if (token) {
        // Send a verification email (in this case, just log it to console)
        await sendVerificationEmail(user, token);
      }

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...user,
          emailVerificationPending: !user.isVerified,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Email verification route
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      const success = await verifyUserWithToken(token);
      
      if (success) {
        // If the user is logged in, update their session
        if (req.isAuthenticated() && req.user) {
          req.user.isVerified = true;
        }
        
        return res.status(200).json({ 
          message: "Email verified successfully",
          success: true 
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid or expired verification token",
          success: false
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        message: "Failed to verify email",
        success: false
      });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}