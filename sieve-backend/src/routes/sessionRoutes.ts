import { Router } from 'express';
import { 
  evaluateAllApplicants, 
  getSessionResults, 
  streamSessionProgress,
  overrideCandidateRank 
} from '../controllers/applicantController';

const router = Router();

// POST /api/sessions - Triggers evaluation
router.post('/', evaluateAllApplicants);

// GET /api/sessions/:id/results - Fetches leaderboard
router.get('/:id/results', getSessionResults);

// GET /api/sessions/:id/stream - Live SSE progress
router.get('/:id/stream', streamSessionProgress);

// NEW: PUT /api/sessions/:id/override - Matches blueprint [cite: 180]
router.put('/:id/override', overrideCandidateRank);

export default router;