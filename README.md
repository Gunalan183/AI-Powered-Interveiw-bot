# AI-Powered Interview Bot 🤖

A comprehensive full-stack application that helps users practice interviews with AI-powered feedback, resume analysis, and personalized coaching.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure JWT-based registration and login
- **Resume Analysis** - AI-powered resume parsing with skills extraction and feedback
- **Mock Interviews** - Practice sessions with AI-generated questions
- **Video Recording** - WebRTC-based interview recording and playback
- **Performance Tracking** - Detailed analytics and progress monitoring
- **Profile Management** - User profiles with image upload functionality

### AI-Powered Features
- **Smart Question Generation** - Role-specific interview questions
- **Answer Analysis** - Real-time feedback on interview responses
- **Skills Assessment** - Automated skill gap analysis
- **Performance Insights** - Detailed reports with improvement suggestions

## Tech Stack

### Frontend
- **React 18** with Hooks and Context API
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer & Cloudinary** for file uploads
- **bcryptjs** for password hashing

### AI Service
- **Python FastAPI** for AI endpoints
- **PyPDF2 & python-docx** for document parsing
- **Natural Language Processing** for text analysis
- **Machine Learning** for answer evaluation

## Installation

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB Atlas account
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Gunalan183/AI-Powered-Interveiw-bot.git
cd AI-Powered-Interveiw-bot
```

2. **Install dependencies**
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# AI service dependencies
cd ../ai-service
pip install -r requirements-simple.txt
```

3. **Environment Setup**
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

4. **Configure Environment Variables**

**Backend (.env):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview-coach
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Service URL
AI_SERVICE_URL=http://localhost:8001
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:8001
REACT_APP_ENVIRONMENT=development
```

## Running the Application

### Development Mode

**Option 1: Start all services from root**
```bash
npm run dev
```

**Option 2: Start services individually**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

Terminal 3 - AI Service:
```bash
cd ai-service
python main-simple.py
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8001

## Project Structure

```
AI-Powered-Interview-Bot/
├── backend/                 # Node.js Express API
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── server.js           # Entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── ai-service/             # Python FastAPI service
│   ├── services/           # AI processing modules
│   ├── main.py            # FastAPI entry point
│   └── main-simple.py     # Lightweight version
└── README.md
```

## Usage

1. **Register/Login** - Create an account or sign in
2. **Complete Profile** - Add personal and professional information
3. **Upload Resume** - Get AI-powered analysis and feedback
4. **Start Interview** - Choose role and difficulty level
5. **Practice** - Answer AI-generated questions
6. **Review Results** - Get detailed feedback and improvement tips
7. **Track Progress** - Monitor your interview performance over time

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Resume
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume/analysis` - Get resume analysis

### Interviews
- `POST /api/interview/start` - Start new interview
- `GET /api/interview/history` - Get interview history
- `GET /api/interview/:id` - Get specific interview

### File Upload
- `POST /api/upload/profile-image` - Upload profile image
- `DELETE /api/upload/profile-image` - Delete profile image

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for AI capabilities inspiration
- MongoDB Atlas for database hosting
- Cloudinary for image storage
- Tailwind CSS for beautiful styling
- React community for excellent documentation

## Support

For support, email gunalan183@gmail.com or create an issue in this repository.

---

**Built with ❤️ by [Gunalan183](https://github.com/Gunalan183)**
