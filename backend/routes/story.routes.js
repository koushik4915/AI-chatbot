const express = require('express');
const router = express.Router();
const storyController = require('../controllers/story.controller');
const { protect } = require('../middlewares/auth.middleware'); 


router.use(protect);


router.post('/generate', storyController.generateStory);


module.exports = router;