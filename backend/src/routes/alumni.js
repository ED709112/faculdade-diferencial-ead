const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alumniController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { createUpload } = require('../utils/upload');

const upload = createUpload('alumni');

// Public
router.get('/public', ctrl.listPublic);
router.get('/public/stats', ctrl.getStats);
router.get('/public/courses', ctrl.getCourses);
router.get('/public/:id', ctrl.getPublicById);
router.get('/testimonials/public', ctrl.listTestimonialsPublic);
router.get('/events/public', ctrl.listEventsPublic);

// Admin
router.get('/', authenticate, authorize('admin'), ctrl.adminList);
router.get('/:id', authenticate, authorize('admin'), ctrl.adminGet);
router.post('/', authenticate, authorize('admin'), upload.single('photo'), ctrl.adminCreate);
router.put('/:id', authenticate, authorize('admin'), upload.single('photo'), ctrl.adminUpdate);
router.delete('/:id', authenticate, authorize('admin'), ctrl.adminDelete);

// Admin Testimonials
router.get('/testimonials/all', authenticate, authorize('admin'), ctrl.adminListTestimonials);
router.post('/testimonials', authenticate, authorize('admin'), upload.single('photo'), ctrl.adminCreateTestimonial);
router.put('/testimonials/:id', authenticate, authorize('admin'), upload.single('photo'), ctrl.adminUpdateTestimonial);
router.delete('/testimonials/:id', authenticate, authorize('admin'), ctrl.adminDeleteTestimonial);

// Admin Events
router.get('/events/all', authenticate, authorize('admin'), ctrl.adminListEvents);
router.post('/events', authenticate, authorize('admin'), upload.single('image'), ctrl.adminCreateEvent);
router.put('/events/:id', authenticate, authorize('admin'), upload.single('image'), ctrl.adminUpdateEvent);
router.delete('/events/:id', authenticate, authorize('admin'), ctrl.adminDeleteEvent);

module.exports = router;
