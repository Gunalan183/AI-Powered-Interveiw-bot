from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import os
from dotenv import load_dotenv

from services.resume_parser import ResumeParser
from services.question_generator import QuestionGenerator
from services.answer_analyzer import AnswerAnalyzer
from services.feedback_generator import FeedbackGenerator

load_dotenv()

app = FastAPI(
    title="AI Interview Coach - AI Service",
    description="AI microservice for resume parsing, question generation, and answer analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
resume_parser = ResumeParser()
question_generator = QuestionGenerator()
answer_analyzer = AnswerAnalyzer()
feedback_generator = FeedbackGenerator()

# Pydantic models
class ResumeParseRequest(BaseModel):
    text: str

class QuestionGenerationRequest(BaseModel):
    jobRole: str
    difficulty: str = "intermediate"
    resumeData: Optional[Dict] = None
    questionCount: int = 10

class AnswerAnalysisRequest(BaseModel):
    question: str
    answer: str
    category: str
    jobRole: str

class ResumeAnalysisRequest(BaseModel):
    parsedData: Dict
    targetRole: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "AI Interview Coach - AI Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["resume_parser", "question_generator", "answer_analyzer"]}

@app.post("/parse-resume")
async def parse_resume(request: ResumeParseRequest):
    """Parse resume text and extract structured data"""
    try:
        parsed_data = resume_parser.parse(request.text)
        return {"success": True, "data": parsed_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

@app.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    """Analyze parsed resume data and provide insights"""
    try:
        analysis = resume_parser.analyze(request.parsedData, request.targetRole)
        return {"success": True, "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")

@app.post("/generate-questions")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate interview questions based on job role and resume"""
    try:
        questions = question_generator.generate(
            job_role=request.jobRole,
            difficulty=request.difficulty,
            resume_data=request.resumeData,
            question_count=request.questionCount
        )
        return {"success": True, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@app.post("/analyze-answer")
async def analyze_answer(request: AnswerAnalysisRequest):
    """Analyze user's answer and provide feedback"""
    try:
        analysis = answer_analyzer.analyze(
            question=request.question,
            answer=request.answer,
            category=request.category,
            job_role=request.jobRole
        )
        
        feedback = feedback_generator.generate_feedback(analysis)
        
        return {"success": True, "feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer analysis failed: {str(e)}")

@app.post("/analyze-audio")
async def analyze_audio(audio_data: bytes):
    """Analyze audio for speech patterns, tone, and clarity"""
    try:
        # TODO: Implement audio analysis
        analysis = {
            "clarity": 85,
            "pace": 75,
            "tone": "confident",
            "fillerWords": 3,
            "confidence": 80
        }
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")

@app.post("/analyze-video")
async def analyze_video(video_data: bytes):
    """Analyze video for facial expressions and body language"""
    try:
        # TODO: Implement video analysis with OpenCV and DeepFace
        analysis = {
            "eyeContact": 80,
            "facialExpressions": ["confident", "engaged"],
            "posture": "good",
            "gestures": "appropriate"
        }
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
