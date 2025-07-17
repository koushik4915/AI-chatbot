# AI Chatbot - Multi-Feature AI Assistant

A comprehensive AI-powered chatbot application with multiple features including chat, story generation, character creation, lyrics generation, and video prompt creation. Built with Next.js frontend and Node.js backend.

## 🚀 Features

### Core Features
- **AI Chat**: Interactive chat with AI using Google's Gemini API
- **Story Generator**: Create engaging stories with AI assistance
- **Character Creator**: Generate 3D animated characters
- **Lyrics Generator**: Create song lyrics with AI
- **Video Prompt Creator**: Generate video prompts for content creation
- **File Upload**: Support for PDF, images, and text files
- **Voice Recognition**: Speech-to-text functionality
- **Real-time Chat**: WebSocket-based real-time messaging
- **Chat History**: Persistent chat history with user authentication

### Technical Features
- **Authentication**: JWT-based user authentication
- **File Processing**: PDF parsing, image processing, and text extraction
- **Content Moderation**: Banned words filtering
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Markdown Support**: Rich text rendering in chat responses

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library
- **React Markdown** - Markdown rendering
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - Real-time bidirectional communication
- **Google Gemini AI** - AI/ML capabilities
- **JWT** - Authentication
- **Multer** - File upload handling
- **Sharp** - Image processing
- **PDF-parse** - PDF text extraction

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Google Gemini API key

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/koushik4915/AI-chatbot.git
cd AI-chatbot
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Start the Application

#### Development Mode
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build
npm start

# Start backend
cd ../backend
npm start
```

## 📁 Project Structure

```
growstackrepo/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.js     # Authentication logic
│   │   ├── chat.controller.js     # Chat functionality
│   │   ├── character.controller.js # Character generation
│   │   ├── lyrics.controller.js   # Lyrics generation
│   │   ├── story.controller.js    # Story generation
│   │   └── video.controller.js    # Video prompt generation
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   └── validate.middleware.js # Request validation
│   ├── models/
│   │   ├── user.model.js          # User schema
│   │   ├── chat.model.js          # Chat schema
│   │   └── ...                    # Other models
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication routes
│   │   ├── chat.routes.js         # Chat routes
│   │   └── ...                    # Other route files
│   ├── utils/
│   │   ├── ai-helpers.js          # AI integration
│   │   ├── file-utils.js          # File processing
│   │   └── ...                    # Utility functions
│   └── index.js                   # Server entry point
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── Components/
│   │   │   │   ├── dashboard/     # Main chat interface
│   │   │   │   ├── story-generator/
│   │   │   │   ├── song-lyrics-generater/
│   │   │   │   ├── videoPrompt/
│   │   │   │   └── 3D-animated-character/
│   │   │   ├── context/
│   │   │   │   ├── authContext.tsx
│   │   │   │   └── historyContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.tsx
│   │   │   │   ├── useStory.tsx
│   │   │   │   └── ...            # Custom hooks
│   │   │   └── layout.tsx
│   │   └── lib/
│   │       └── utils.ts
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Chat
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Get chat history

### Files
- `POST /api/files/upload` - Upload files
- `GET /api/files/:id` - Get file by ID

### Stories
- `POST /api/stories/generate` - Generate story
- `GET /api/stories/history` - Get story history

### Characters
- `POST /api/character/generate` - Generate character
- `GET /api/character/history` - Get character history

### Lyrics
- `POST /api/lyrics/generate` - Generate lyrics
- `GET /api/lyrics/history` - Get lyrics history

### Video Prompts
- `POST /api/video/generate` - Generate video prompt
- `GET /api/video/history` - Get video prompt history

## 🎯 Usage

### Chat Interface
1. Sign up or log in to your account
2. Navigate to the dashboard
3. Start typing messages or use voice input
4. Upload files (PDF, images, text) for context
5. View chat history in the sidebar

### Story Generator
1. Go to the Story Generator page
2. Provide a story prompt or theme
3. Generate creative stories with AI assistance

### Character Creator
1. Visit the 3D Animated Character page
2. Describe your character
3. Generate and animate 3D characters

### Lyrics Generator
1. Access the Song Lyrics Generator
2. Provide song theme or genre
3. Generate original lyrics

### Video Prompt Creator
1. Navigate to the Video Prompt page
2. Describe your video concept
3. Generate detailed video prompts

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or Vercel

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or other platforms
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Koushik** - [GitHub](https://github.com/koushik4915)

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- Next.js team for the amazing framework
- MongoDB for database solutions
- All open-source contributors

---

⭐ Star this repository if you find it helpful!