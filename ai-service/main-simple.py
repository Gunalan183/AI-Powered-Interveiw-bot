from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import re
from typing import List, Dict, Any
import PyPDF2
import docx
import io

app = FastAPI(title="AI Interview Coach - Simple Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ResumeAnalysis(BaseModel):
    skills: List[str]
    experience: List[str]
    education: List[str]
    projects: List[str]
    match_score: int
    strengths: List[str]
    suggestions: List[str]
    missing_skills: List[str]

class QuestionRequest(BaseModel):
    job_role: str
    experience_level: str
    skills: List[str]
    difficulty: str = "medium"

class AnswerAnalysisRequest(BaseModel):
    question: str
    answer: str
    expected_keywords: List[str] = []

# Simple text extraction functions
def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

# Simple parsing functions using regex patterns
def extract_skills(text: str) -> List[str]:
    # Common technical skills patterns
    skill_patterns = [
        r'\b(?:Python|Java|JavaScript|React|Node\.js|Angular|Vue|HTML|CSS|SQL|MongoDB|PostgreSQL|MySQL|Git|Docker|Kubernetes|AWS|Azure|GCP|Linux|Windows|MacOS|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|TypeScript|Bootstrap|jQuery|Express|Django|Flask|Spring|Laravel|Rails|TensorFlow|PyTorch|Pandas|NumPy|Scikit-learn|Matplotlib|Seaborn|Tableau|Power BI|Excel|Photoshop|Illustrator|Figma|Sketch|InDesign|Premiere|After Effects|Unity|Unreal|Blender|Maya|AutoCAD|SolidWorks|MATLAB|R|Stata|SPSS|Salesforce|HubSpot|Slack|Jira|Trello|Asana|Notion|Confluence|SharePoint|Office 365|Google Workspace)\b',
        r'\b(?:Machine Learning|Data Science|Artificial Intelligence|Deep Learning|Natural Language Processing|Computer Vision|DevOps|Cloud Computing|Cybersecurity|Web Development|Mobile Development|Full Stack|Frontend|Backend|Database|API|REST|GraphQL|Microservices|Agile|Scrum|Kanban|Project Management|Digital Marketing|SEO|SEM|Social Media|Content Marketing|Email Marketing|Analytics|UX|UI|Design|Branding|Photography|Video Editing|3D Modeling|Animation|Game Development|Blockchain|Cryptocurrency|IoT|Robotics|Automation|Testing|QA|CI/CD|Version Control|Networking|System Administration|Technical Writing|Data Analysis|Business Analysis|Product Management|Strategy|Consulting|Sales|Customer Service|HR|Finance|Accounting|Legal|Healthcare|Education|Research)\b'
    ]
    
    skills = set()
    for pattern in skill_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        skills.update([match.strip() for match in matches])
    
    return list(skills)[:20]  # Limit to top 20 skills

def extract_experience(text: str) -> List[str]:
    # Look for experience/work history patterns
    experience_patterns = [
        r'(?:Experience|Work History|Employment|Career|Professional Experience)[\s\S]*?(?=Education|Skills|Projects|$)',
        r'\d{4}\s*[-–]\s*(?:\d{4}|Present|Current).*?(?=\n\n|\d{4}\s*[-–]|$)',
        r'(?:Software Engineer|Developer|Manager|Analyst|Consultant|Designer|Architect|Lead|Senior|Junior|Intern).*?(?=\n\n|$)'
    ]
    
    experiences = []
    for pattern in experience_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        experiences.extend([match.strip()[:200] for match in matches if len(match.strip()) > 20])
    
    return experiences[:10]  # Limit to top 10 experiences

def extract_education(text: str) -> List[str]:
    # Look for education patterns
    education_patterns = [
        r'(?:Education|Academic|Qualification|Degree|University|College|School)[\s\S]*?(?=Experience|Skills|Projects|$)',
        r'(?:Bachelor|Master|PhD|Doctorate|Diploma|Certificate).*?(?=\n\n|$)',
        r'(?:B\.S\.|B\.A\.|M\.S\.|M\.A\.|MBA|Ph\.D\.).*?(?=\n\n|$)'
    ]
    
    education = []
    for pattern in education_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        education.extend([match.strip()[:200] for match in matches if len(match.strip()) > 10])
    
    return education[:5]  # Limit to top 5 education entries

def extract_projects(text: str) -> List[str]:
    # Look for project patterns
    project_patterns = [
        r'(?:Projects|Portfolio|Work Samples)[\s\S]*?(?=Education|Skills|Experience|$)',
        r'Project\s*:.*?(?=\n\n|Project\s*:|$)',
        r'(?:Built|Developed|Created|Designed|Implemented).*?(?=\n\n|$)'
    ]
    
    projects = []
    for pattern in project_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        projects.extend([match.strip()[:200] for match in matches if len(match.strip()) > 20])
    
    return projects[:8]  # Limit to top 8 projects

# Predefined interview questions by role and difficulty
INTERVIEW_QUESTIONS = {
    "software engineer": {
        "easy": [
            "Tell me about yourself and your programming background.",
            "What programming languages are you most comfortable with?",
            "Explain the difference between a stack and a queue.",
            "What is object-oriented programming?",
            "How do you handle debugging in your code?"
        ],
        "medium": [
            "Describe a challenging project you worked on and how you overcame obstacles.",
            "Explain the concept of RESTful APIs and how you've used them.",
            "What are the differences between SQL and NoSQL databases?",
            "How would you optimize a slow-performing application?",
            "Describe your experience with version control systems like Git."
        ],
        "hard": [
            "Design a scalable system for handling millions of users.",
            "Explain the trade-offs between microservices and monolithic architecture.",
            "How would you implement a distributed caching system?",
            "Describe a time when you had to make a critical technical decision under pressure.",
            "What strategies do you use for ensuring code quality in a team environment?"
        ]
    },
    "data scientist": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain what a p-value means in statistics.",
            "What tools do you use for data analysis?",
            "How do you handle missing data in a dataset?",
            "What is the purpose of data visualization?"
        ],
        "medium": [
            "Describe a machine learning project you've worked on from start to finish.",
            "How would you evaluate the performance of a classification model?",
            "Explain the bias-variance tradeoff in machine learning.",
            "What is feature engineering and why is it important?",
            "How do you ensure your models are not overfitting?"
        ],
        "hard": [
            "Design an A/B testing framework for a large-scale application.",
            "How would you build a recommendation system for an e-commerce platform?",
            "Explain how you would handle concept drift in a production ML model.",
            "Describe your approach to building interpretable machine learning models.",
            "How would you design a real-time fraud detection system?"
        ]
    },
    "product manager": {
        "easy": [
            "What does a product manager do on a day-to-day basis?",
            "How do you prioritize features in a product roadmap?",
            "What metrics would you use to measure product success?",
            "How do you gather and incorporate user feedback?",
            "Describe your experience working with cross-functional teams."
        ],
        "medium": [
            "How would you launch a new product feature?",
            "Describe a time when you had to make a difficult product decision.",
            "How do you balance technical debt with new feature development?",
            "What frameworks do you use for product strategy?",
            "How do you handle conflicting stakeholder requirements?"
        ],
        "hard": [
            "Design a product strategy for entering a new market.",
            "How would you turn around a declining product?",
            "Describe how you would build and scale a product team.",
            "What's your approach to competitive analysis and positioning?",
            "How do you measure and improve user engagement?"
        ]
    }
}

@app.get("/")
async def root():
    return {"message": "AI Interview Coach Service - Simple Version", "status": "running"}

@app.post("/analyze-resume", response_model=ResumeAnalysis)
async def analyze_resume(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        elif file.filename.lower().endswith(('.docx', '.doc')):
            text = extract_text_from_docx(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX files.")
        
        # Extract information using simple parsing
        skills = extract_skills(text)
        experience = extract_experience(text)
        education = extract_education(text)
        projects = extract_projects(text)
        
        # Simple scoring based on content richness
        match_score = min(95, max(60, len(skills) * 3 + len(experience) * 5 + len(education) * 2 + len(projects) * 4))
        
        # Generate simple feedback
        strengths = []
        suggestions = []
        missing_skills = []
        
        if len(skills) > 10:
            strengths.append("Strong technical skill set with diverse technologies")
        if len(experience) > 3:
            strengths.append("Solid professional experience background")
        if len(projects) > 2:
            strengths.append("Good project portfolio demonstrating practical application")
        
        if len(skills) < 8:
            suggestions.append("Consider adding more technical skills to strengthen your profile")
        if len(experience) < 2:
            suggestions.append("Include more detailed work experience descriptions")
        if len(projects) < 2:
            suggestions.append("Add more projects to showcase your practical skills")
        
        # Common missing skills suggestions
        common_skills = ["Python", "JavaScript", "SQL", "Git", "Docker", "AWS", "React", "Node.js"]
        for skill in common_skills:
            if skill.lower() not in [s.lower() for s in skills]:
                missing_skills.append(skill)
        
        return ResumeAnalysis(
            skills=skills,
            experience=experience,
            education=education,
            projects=projects,
            match_score=match_score,
            strengths=strengths[:5],
            suggestions=suggestions[:5],
            missing_skills=missing_skills[:8]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@app.post("/generate-questions")
async def generate_questions(request: QuestionRequest):
    try:
        role = request.job_role.lower()
        difficulty = request.difficulty.lower()
        
        # Find matching role or use generic questions
        questions = []
        if role in INTERVIEW_QUESTIONS:
            questions = INTERVIEW_QUESTIONS[role].get(difficulty, INTERVIEW_QUESTIONS[role]["medium"])
        else:
            # Generic questions for unknown roles
            generic_questions = {
                "easy": [
                    "Tell me about yourself and your professional background.",
                    "What interests you about this role?",
                    "What are your greatest strengths?",
                    "Describe a typical day in your current/previous role.",
                    "What motivates you in your work?"
                ],
                "medium": [
                    "Describe a challenging project you worked on and how you handled it.",
                    "How do you prioritize tasks when you have multiple deadlines?",
                    "Tell me about a time you had to learn something new quickly.",
                    "How do you handle feedback and criticism?",
                    "Describe a situation where you had to work with a difficult team member."
                ],
                "hard": [
                    "Where do you see yourself in 5 years?",
                    "Describe a time when you failed and what you learned from it.",
                    "How would you handle a situation where you disagree with your manager?",
                    "What would you do if you were asked to do something unethical?",
                    "How do you stay current with industry trends and developments?"
                ]
            }
            questions = generic_questions.get(difficulty, generic_questions["medium"])
        
        return {
            "questions": questions,
            "role": request.job_role,
            "difficulty": difficulty,
            "total_questions": len(questions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/analyze-answer")
async def analyze_answer(request: AnswerAnalysisRequest):
    try:
        answer = request.answer.lower()
        question = request.question.lower()
        
        # Simple scoring based on answer length and keyword presence
        word_count = len(answer.split())
        
        # Basic scoring criteria
        score = 0
        feedback = []
        
        # Length scoring
        if word_count < 20:
            score += 20
            feedback.append("Consider providing more detailed responses")
        elif word_count < 50:
            score += 60
            feedback.append("Good response length, could be more detailed")
        else:
            score += 85
            feedback.append("Excellent detailed response")
        
        # Keyword analysis
        positive_keywords = ["experience", "project", "team", "challenge", "solution", "result", "learn", "improve", "achieve", "successful"]
        keyword_count = sum(1 for keyword in positive_keywords if keyword in answer)
        
        if keyword_count > 3:
            score += 15
            feedback.append("Good use of relevant professional terminology")
        elif keyword_count > 1:
            score += 10
        
        # Structure analysis
        if any(phrase in answer for phrase in ["first", "then", "finally", "because", "therefore", "as a result"]):
            score += 10
            feedback.append("Well-structured response with clear flow")
        
        # Ensure score is within bounds
        score = min(100, max(0, score))
        
        # Generate suggestions
        suggestions = []
        if word_count < 30:
            suggestions.append("Provide more specific examples and details")
        if keyword_count < 2:
            suggestions.append("Include more relevant professional terminology")
        if not any(phrase in answer for phrase in ["example", "instance", "time when", "experience"]):
            suggestions.append("Use specific examples to illustrate your points")
        
        return {
            "score": score,
            "feedback": feedback,
            "suggestions": suggestions,
            "word_count": word_count,
            "keyword_matches": keyword_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing answer: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Interview Coach - Simple"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
