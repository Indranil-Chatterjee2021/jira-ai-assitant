import { Router } from 'express';
import jiraRoutes from './jira';
import aiRoutes from './ai';

const router = Router();

router.use('/jira', jiraRoutes);
router.use('/ai', aiRoutes);

export default router;
