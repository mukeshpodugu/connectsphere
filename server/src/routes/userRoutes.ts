import { Router } from 'express';
import { getProfile, updateProfile, searchUsers, getSettings } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/UploadService';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.get('/search', searchUsers);
router.get('/settings', getSettings);

export default router;
