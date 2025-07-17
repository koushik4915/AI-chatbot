const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { protect } = require('../middlewares/auth.middleware'); 


router.use(protect);


router.post('/generate', videoController.videoController);


module.exports = router;