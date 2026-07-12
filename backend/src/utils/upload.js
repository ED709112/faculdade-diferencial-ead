const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const storage = (uploadDir) => multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', uploadDir);
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: ${allowedTypes.join(', ')}`), false);
  }
};

const createUpload = (uploadDir, allowedTypes, maxSize = 50 * 1024 * 1024) => {
  return multer({
    storage: storage(uploadDir),
    fileFilter: fileFilter(allowedTypes),
    limits: { fileSize: maxSize }
  });
};

const uploadImage = createUpload('courses', [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
], 5 * 1024 * 1024);

const uploadVideo = createUpload('courses', [
  'video/mp4', 'video/webm', 'video/ogg'
], 500 * 1024 * 1024);

const uploadDocument = createUpload('attachments', [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
], 50 * 1024 * 1024);

const uploadAvatar = createUpload('avatars', [
  'image/jpeg', 'image/png', 'image/webp'
], 5 * 1024 * 1024);

const uploadCertificate = createUpload('certificates', [
  'application/pdf', 'image/png', 'image/jpeg'
], 10 * 1024 * 1024);

module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadAvatar,
  uploadCertificate,
  createUpload
};
