import { Router } from 'express';
import { generateResponse } from '../services/aiService';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const response = await generateResponse(prompt, context);
    res.json({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

export default router;
