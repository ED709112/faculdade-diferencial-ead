const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadImage, uploadVideo, uploadDocument, uploadAvatar } = require('../utils/upload');

router.post('/image', authenticate, uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const imageUrl = `/uploads/courses/${req.file.filename}`;

    res.json({
      message: 'Imagem enviada com sucesso!',
      url: imageUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
  }
});

router.post('/video', authenticate, uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum vídeo enviado.' });
    }

    const videoUrl = `/uploads/courses/${req.file.filename}`;

    res.json({
      message: 'Vídeo enviado com sucesso!',
      url: videoUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Erro no upload de vídeo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do vídeo.' });
  }
});

router.post('/document', authenticate, uploadDocument.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum documento enviado.' });
    }

    const documentUrl = `/uploads/attachments/${req.file.filename}`;

    res.json({
      message: 'Documento enviado com sucesso!',
      url: documentUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do documento.' });
  }
});

router.post('/avatar', authenticate, uploadAvatar.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    res.json({
      message: 'Avatar enviado com sucesso!',
      url: avatarUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do avatar.' });
  }
});

module.exports = router;
