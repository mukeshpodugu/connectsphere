import { Router } from 'express';
import { initiateCallLog, updateCallLog, getCallHistory } from '../controllers/CallController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', initiateCallLog);
router.put('/:callId', updateCallLog);
router.get('/history', getCallHistory);

export default router;
