import { Router } from 'express';
import { createJob, generateRubric } from '../controllers/jobController'; // 1. Import the new function
import { ingestApplicants } from '../controllers/applicantController';

const router = Router();

// Route: POST /api/jobs
router.post('/', createJob);

// Route: POST /api/jobs/:id/applicants
router.post('/:id/applicants', ingestApplicants);

// Route: POST /api/jobs/:id/rubric/generate
router.post('/:id/rubric/generate', generateRubric); 

export default router;