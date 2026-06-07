import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File validation limits
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', // Images
    '.mp4', '.mov', '.avi', '.mkv', // Videos
    '.pdf',                          // PDF
    '.doc', '.docx',                 // Word
    '.zip', '.rar', '.7z'            // Archives
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Forbidden file format. Supported extensions: ${allowedExtensions.join(', ')}`));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

// Helper service to retrieve upload destination details
class UploadService {
  public getFileUrl(filename: string): string {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}/uploads/${filename}`;
  }

  public getFilePath(filename: string): string {
    return path.join(uploadDir, filename);
  }

  public deleteFile(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fullPath = this.getFilePath(filename);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default new UploadService();
