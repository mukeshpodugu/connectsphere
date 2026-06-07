import { Router } from 'express';
import {
  getChats,
  getOrCreateDirectChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleStarMessage,
  togglePinMessage
} from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/UploadService';

const router = Router();

router.use(authenticateToken);

router.get('/', getChats);
router.post('/direct', getOrCreateDirectChat);
router.get('/:chatId/messages', getMessages);
router.post('/message', upload.single('file'), sendMessage);
router.put('/message/:messageId', editMessage);
router.delete('/message/:messageId', deleteMessage);
router.post('/message/:messageId/star', toggleStarMessage);
router.post('/message/:messageId/pin', togglePinMessage);

export default router;
