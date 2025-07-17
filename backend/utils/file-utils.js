const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
require('dotenv').config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});


const fileFilter = (req, file, cb) => {

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, WEBP, and TXT files are allowed.'), false);
  }
};


exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: fileFilter
});

exports.extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    console.log(data)
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

exports.extractTextFromImage = async (filePath) => {
  try {
    const optimizedImagePath = `${filePath}-optimized.jpg`;
    await sharp(filePath)
      .resize(1000) 
      .jpeg({ quality: 80 }) 
      .toFile(optimizedImagePath);
    
    const imageData = fs.readFileSync(optimizedImagePath);
    
    const base64Image = imageData.toString('base64');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const prompt = "Extract all text from this image. Return only the extracted text without any additional comments or explanations.";
    
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    fs.unlinkSync(optimizedImagePath);
    
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
};

exports.cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

exports.processFile = async (file) => {
  try {
    let extractedText = '';
    
    if (file.mimetype === 'application/pdf') {
      extractedText = await exports.extractTextFromPdf(file.path);
    } else if (file.mimetype.startsWith('image/')) {
      extractedText = await exports.extractTextFromImage(file.path);
    } else if (file.mimetype === 'text/plain') {
      extractedText = fs.readFileSync(file.path, 'utf8');
    }
    
    const chunks = exports.chunkText(extractedText);
    
    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      extractedText,
      chunks
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
};

exports.chunkText = (text, chunkSize = 1000, overlap = 100) => {
  const chunks = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      chunks.push(currentChunk);
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};