import { Request, Response } from 'express';
import Job from '../models/Job';
import { generateRubricFromJD } from '../services/aiService'; 

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, rawJD } = req.body;
    if (!title || !rawJD) {
      return res.status(400).json({ message: 'Title and rawJD are required' });
    }
    const newJob = await Job.create({ title, rawJD });
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

export const generateRubric = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    // 1. Find the job in the database
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }


    const generatedRubric = await generateRubricFromJD(job.rawJD);

    // 3. Update the Job document with the new AI rubric
    job.rubric = {
      dimensions: generatedRubric
    };
    
    // 4. Save the updated job back to MongoDB
    await job.save();

    // 5. Send the updated job back to the frontend
    res.status(200).json({
      message: 'Rubric generated successfully',
      job: job
    });

  } catch (error: any) {
    console.error('Error generating rubric:', error);
    // Force the server to send the actual error back to PowerShell
    res.status(500).json({ 
      message: 'Server error generating rubric via AI',
      errorDetails: error.message 
    });
  }
};