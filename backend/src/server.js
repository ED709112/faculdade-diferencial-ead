require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const lessonRoutes = require('./routes/lessons');
const enrollmentRoutes = require('./routes/enrollments');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const quizRoutes = require('./routes/quizzes');
const certificateRoutes = require('./routes/certificates');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const uploadRoutes = require('./routes/uploads');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const reviewRoutes = require('./routes/reviews');
const faqRoutes = require('./routes/faqs');
const bannerRoutes = require('./routes/banners');
const testimonialRoutes = require('./routes/testimonials');
const couponRoutes = require('./routes/coupons');
const searchRoutes = require('./routes/search');
const settingsRoutes = require('./routes/settings');
const badgeRoutes = require('./routes/badges');

const app = express();
const server = http.createServer(app);

// Socket.IO para chat em tempo real
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Disponibilizar io para toda a aplicação
app.set('io', io);

// =====================================================
// MIDDLEWARES GLOBAIS
// =====================================================

// Segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Compressão
app.use(compression());

// Parse de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookies
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Rate limiting mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// =====================================================
// ROTAS DA API
// =====================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/badges', badgeRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =====================================================
// MIDDLEWARES DE ERRO
// =====================================================

app.use(notFound);
app.use(errorHandler);

// =====================================================
// SOCKET.IO - CHAT EM TEMPO REAL
// =====================================================

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('user_connected', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  socket.on('send_message', (data) => {
    const { conversationId, message } = data;
    io.to(`conversation_${conversationId}`).emit('new_message', {
      conversationId,
      message
    });
  });

  socket.on('typing', (data) => {
    const { conversationId, userId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      conversationId
    });
  });

  socket.on('stop_typing', (data) => {
    const { conversationId, userId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
      userId,
      conversationId
    });
  });

  socket.on('notification', (data) => {
    const { userId } = data;
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit('new_notification', data);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
  ====================================
  Faculdade Diferencial EAD - Backend
  ====================================
  Servidor rodando em: http://${HOST}:${PORT}
  Ambiente: ${process.env.NODE_ENV}
  API: http://${HOST}:${PORT}/api
  ====================================
  `);
});

module.exports = { app, server, io };
