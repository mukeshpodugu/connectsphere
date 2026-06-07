import { Router } from 'express';
import {
  createGroup,
  addMembers,
  removeMember,
  updateGroup
} from '../controllers/GroupController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/UploadService';

const router = Router();

router.use(authenticateToken);

router.post('/', upload.single('avatar'), createGroup);
router.post('/:chatId/members', addMembers);
router.delete('/:chatId/members/:userId', removeMember);
router.put('/:chatId', upload.single('avatar'), updateGroup);

export default router;
