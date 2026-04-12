import { Router } from 'express';
import { evaluateAllApplicants, getSessionResults, streamSessionProgress } from '../controllers/applicantController';

const router = Router();

// Matches blueprint: POST /api/sessions

router.post('/', evaluateAllApplicants);

// Matches blueprint: GET /api/sessions/:id/results
router.get('/:id/results', getSessionResults);

// NEW matches blueprint: GET /api/sessions/:id/stream
router.get('/:id/stream', streamSessionProgress);

export default router;