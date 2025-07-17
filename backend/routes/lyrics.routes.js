const express = require('express');
const router = express.Router();
const lyricController = require('../controllers/lyrics.controller');
const { protect } = require('../middlewares/auth.middleware'); 


router.use(protect);


router.post('/generate', lyricController.generateLyrics);


module.exports = router;