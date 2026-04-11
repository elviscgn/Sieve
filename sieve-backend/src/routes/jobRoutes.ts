import { Router } from 'express';
import { createJob, generateRubric } from '../controllers/jobController';
import { ingestApplicants } from '../controllers/applicantController'; 

const router = Router();

//POST /api/jobs
router.post('/', createJob);

// POST /api/jobs/:id/applicants
router.post('/:id/applicants', ingestApplicants);

// POST /api/jobs/:id/parse-rubric
router.post('/:id/parse-rubric', generateRubric); 

export default router;