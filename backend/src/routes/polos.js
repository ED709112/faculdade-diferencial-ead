const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const poloController = require('../controllers/poloController');

// Rotas publicas
router.get('/public', poloController.listPublic);

// Rotas admin
router.get('/', authenticate, authorize('admin'), poloController.list);
router.get('/:id', authenticate, authorize('admin'), poloController.getById);
router.post('/', authenticate, authorize('admin'), poloController.create);
router.put('/:id', authenticate, authorize('admin'), poloController.update);
router.delete('/:id', authenticate, authorize('admin'), poloController.remove);

module.exports = router;
