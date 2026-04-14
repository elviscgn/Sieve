import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import jobRoutes from './routes/jobRoutes';
import { apiKeyAuth } from './middleware/auth'; 
import sessionRoutes from './routes/sessionRoutes';
import { setupSwagger } from './config/swagger';
import applicantRoutes from './routes/applicantRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cors());

// Health Check (Keep this unprotected so AWS/Render can check if the server is alive)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Sieve API is running' });
});

/// Protect all /api/jobs routes
app.use('/api/jobs', apiKeyAuth, jobRoutes); 

// Protect all /api/sessions routes
app.use('/api/sessions', apiKeyAuth, sessionRoutes);

// Protect all /api/applicants routes
app.use('/api/applicants', applicantRoutes);

// Initialize Swagger UI
setupSwagger(app);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});