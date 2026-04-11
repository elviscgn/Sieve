import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // 1. Look for the key in the incoming request headers
  const incomingKey = req.header('x-api-key');
  
  // 2. Grab your secret key from the environment file
  const validKey = process.env.API_KEY;

  // 3. Compare them
  if (!incomingKey || incomingKey !== validKey) {
    // If it's missing or wrong, kick them out immediately
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing API Key' });
  }

  // 4. If it matches, let them through to the controller
  next();
};