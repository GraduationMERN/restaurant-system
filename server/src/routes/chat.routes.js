import express from 'express';
import { checkHealth, answerQuestion } from '../controllers/chat.controller.js';
const router = express.Router();

router.get('/health', checkHealth);
// Main chat endpoint
router.post('/ask', answerQuestion);

export default router;
