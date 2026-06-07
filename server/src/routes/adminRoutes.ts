import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllGroups,
  getReports,
  createReport,
  resolveReport,
  deleteUserByAdmin
} from '../controllers/AdminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Users can report other messages/users
router.post('/reports', createReport);

// All subsequent routes require Admin privileges
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/groups', getAllGroups);
router.get('/reports', getReports);
router.put('/reports/:reportId', resolveReport);
router.delete('/users/:userId', deleteUserByAdmin);

export default router;
