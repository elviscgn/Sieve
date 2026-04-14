import { Router } from 'express';
import { askApplicantQuestion } from '../controllers/applicantController';

const router = Router();

router.post('/:id/ask', askApplicantQuestion);

export default router;