import { Request, Response, NextFunction } from "express";

// Intercepts incoming requests to validate the provided API key against the server's environment variables before allowing access to protected routes.
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const incomingKey = req.header("x-api-key");
  const validKey = process.env.API_KEY;

  if (!incomingKey || incomingKey !== validKey) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or missing API Key" });
  }

  next();
};