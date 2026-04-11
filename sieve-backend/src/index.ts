import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import jobRoutes from './routes/jobRoutes';
import { apiKeyAuth } from './middleware/auth'; // 1. Import the bouncer

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cors());

// Health Check (Keep this unprotected so AWS/Render can check if the server is alive)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Sieve API is running' });
});

// 2. Protect all /api/jobs routes by putting the middleware in the middle
app.use('/api/jobs', apiKeyAuth, jobRoutes); 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});