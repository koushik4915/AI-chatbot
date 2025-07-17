const express = require('express');
const router = express.Router();
const characterController = require('../controllers/character.controller');
const { protect } = require('../middlewares/auth.middleware'); 


router.use(protect);

router.post("/generate-character-data", characterController.generateCharactersFromStory);


module.exports = router;






