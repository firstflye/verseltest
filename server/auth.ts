import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

declare global {
  namespace Express {
    // Define the User type that Express will use
    interface User {
      id: number;
      username: string;
      password: string;
      name: string | null;
      bio: string | null;
      website: string | null;
      profileImage: string | null;
      createdAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  // For test accounts, we'll create a pre-computed hash with a fixed salt
  // This way the passwords will be the same on every startup for testing
  if (process.env.NODE_ENV !== "production" && 
      (password === "password123" || password === "admin123")) {
    if (password === "password123") {
      return "7e37f68170f346624e20394de3a95406a12ebde79386a6b5e7864ddd20a7ae823e9e572c293459b38ea6c34b0e8945d0940bab3ea789bc8049cabe81911bb58a.a48b2a4aff589853f4a99654a298c901";
    } else if (password === "admin123") {
      return "8b1077f921d0db4d33868a8e5be9df8eaa154e09f1d7caeacf58b83eb50bc0e5444a8df47c6888b77a6358412e7ea2347c994e9293d633fb372d8bc23d9b4d11.5f3e6ee1c642ffbff5114dd505665316";
    }
  }
  
  // Otherwise, generate a unique salt for each password
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "instagram-clone-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
