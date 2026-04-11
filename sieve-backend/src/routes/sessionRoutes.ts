import { Router } from 'express';
import { evaluateAllApplicants, getSessionResults } from '../controllers/applicantController';

const router = Router();

// Matches blueprint: POST /api/sessions
router.post('/', evaluateAllApplicants);

// Matches blueprint: GET /api/sessions/:id/results
router.get('/:id/results', getSessionResults);

export default router;