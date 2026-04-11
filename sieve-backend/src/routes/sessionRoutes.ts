import { Router } from 'express';
import { evaluateAllApplicants } from '../controllers/applicantController';

const router = Router();

// Matches blueprint: POST /api/sessions
// This triggers the bulk evaluation
router.post('/', evaluateAllApplicants);

export default router;