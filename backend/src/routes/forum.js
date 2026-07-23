const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/course/:courseId', optionalAuth, forumController.getPosts);

router.get('/:id', optionalAuth, forumController.getPostById);

router.post('/', authenticate, forumController.createPost);

router.put('/:id', authenticate, forumController.updatePost);

router.delete('/:id', authenticate, forumController.deletePost);

router.post('/:postId/replies', authenticate, forumController.createReply);

router.put('/replies/:replyId/solution', authenticate, forumController.markSolution);

router.delete('/replies/:replyId', authenticate, forumController.deleteReply);

module.exports = router;
