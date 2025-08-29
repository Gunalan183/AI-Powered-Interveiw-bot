import re
import spacy
import nltk
from typing import Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import pipeline

class ResumeParser:
    def __init__(self):
        # Load spaCy model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Warning: spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Initialize NLTK
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
        except:
            pass
        
        # Skills database
        self.tech_skills = {
            'programming_languages': [
                'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
                'typescript', 'kotlin', 'swift', 'scala', 'r', 'matlab', 'perl'
            ],
            'web_technologies': [
                'html', 'css', 'react', 'angular', 'vue', 'nodejs', 'express', 'django',
                'flask', 'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle',
                'sqlite', 'cassandra', 'dynamodb', 'firebase'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean',
                'cloudflare', 'vercel', 'netlify'
            ],
            'tools': [
                'git', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
                'webpack', 'babel', 'eslint', 'jest', 'cypress', 'selenium'
            ],
            'ai_ml': [
                'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
                'pandas', 'numpy', 'opencv', 'nlp', 'computer vision', 'neural networks'
            ]
        }
        
        # Flatten skills for easier searching
        self.all_skills = []
        for category in self.tech_skills.values():
            self.all_skills.extend(category)

    def parse(self, text: str) -> Dict:
        """Parse resume text and extract structured information"""
        
        # Clean text
        cleaned_text = self._clean_text(text)
        
        # Extract different sections
        skills = self._extract_skills(cleaned_text)
        experience = self._extract_experience(cleaned_text)
        education = self._extract_education(cleaned_text)
        projects = self._extract_projects(cleaned_text)
        contact_info = self._extract_contact_info(cleaned_text)
        summary = self._extract_summary(cleaned_text)
        
        return {
            'skills': skills,
            'experience': experience,
            'education': education,
            'projects': projects,
            'contact_info': contact_info,
            'summary': summary,
            'raw_text': text[:500] + '...' if len(text) > 500 else text
        }

    def analyze(self, parsed_data: Dict, target_role: str = None) -> Dict:
        """Analyze parsed resume data and provide insights"""
        
        analysis = {
            'strengths': [],
            'weaknesses': [],
            'suggestions': [],
            'matchScore': 0,
            'missingSkills': [],
            'skillCategories': {}
        }
        
        # Analyze skills by category
        user_skills = [skill.lower() for skill in parsed_data.get('skills', [])]
        
        for category, category_skills in self.tech_skills.items():
            matched_skills = [skill for skill in category_skills if skill in user_skills]
            analysis['skillCategories'][category] = {
                'matched': matched_skills,
                'count': len(matched_skills),
                'percentage': len(matched_skills) / len(category_skills) * 100
            }
        
        # Calculate overall match score
        total_skills = len(self.all_skills)
        matched_skills = len([skill for skill in self.all_skills if skill in user_skills])
        analysis['matchScore'] = min(100, (matched_skills / total_skills) * 100 * 2)  # Boost score
        
        # Generate strengths
        if analysis['skillCategories']['programming_languages']['count'] > 2:
            analysis['strengths'].append('Strong programming background')
        if analysis['skillCategories']['web_technologies']['count'] > 3:
            analysis['strengths'].append('Comprehensive web development skills')
        if analysis['skillCategories']['cloud_platforms']['count'] > 0:
            analysis['strengths'].append('Cloud platform experience')
        
        # Generate suggestions
        if analysis['skillCategories']['ai_ml']['count'] == 0:
            analysis['suggestions'].append('Consider learning AI/ML technologies')
        if analysis['skillCategories']['cloud_platforms']['count'] == 0:
            analysis['suggestions'].append('Add cloud platform experience')
        if len(parsed_data.get('projects', [])) < 3:
            analysis['suggestions'].append('Include more project examples')
        
        # Missing skills for target role
        if target_role:
            role_skills = self._get_role_skills(target_role)
            analysis['missingSkills'] = [skill for skill in role_skills if skill not in user_skills]
        
        return analysis

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep important ones
        text = re.sub(r'[^\w\s\.\-\+\#\@]', ' ', text)
        return text.strip()

    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.all_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())
        
        # Remove duplicates and return
        return list(set(found_skills))

    def _extract_experience(self, text: str) -> List[str]:
        """Extract work experience information"""
        experience = []
        
        # Look for experience patterns
        experience_patterns = [
            r'(?:worked|employed|experience)\s+(?:as|at|with)\s+([^.]+)',
            r'(?:software engineer|developer|analyst|manager)\s+at\s+([^.]+)',
            r'(\d+)\s+(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)',
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            experience.extend(matches)
        
        # Clean and limit results
        experience = [exp.strip()[:100] for exp in experience if len(exp.strip()) > 5]
        return experience[:5]  # Limit to 5 entries

    def _extract_education(self, text: str) -> List[str]:
        """Extract education information"""
        education = []
        
        education_patterns = [
            r'(?:bachelor|master|phd|degree)\s+(?:of|in|from)\s+([^.]+)',
            r'(?:university|college|institute)\s+of\s+([^.]+)',
            r'(?:b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?)\s+in\s+([^.]+)',
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            education.extend(matches)
        
        return [edu.strip()[:100] for edu in education if len(edu.strip()) > 3][:3]

    def _extract_projects(self, text: str) -> List[str]:
        """Extract project information"""
        projects = []
        
        project_patterns = [
            r'(?:project|built|developed|created)\s*:?\s*([^.]+)',
            r'(?:github|portfolio)\s*:?\s*([^.]+)',
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            projects.extend(matches)
        
        return [proj.strip()[:150] for proj in projects if len(proj.strip()) > 10][:5]

    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information"""
        contact = {}
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact['email'] = emails[0]
        
        # Phone pattern
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact['phone'] = f"({phones[0][0]}) {phones[0][1]}-{phones[0][2]}"
        
        # LinkedIn pattern
        linkedin_pattern = r'linkedin\.com/in/([a-zA-Z0-9-]+)'
        linkedin = re.findall(linkedin_pattern, text, re.IGNORECASE)
        if linkedin:
            contact['linkedin'] = f"linkedin.com/in/{linkedin[0]}"
        
        return contact

    def _extract_summary(self, text: str) -> str:
        """Extract or generate a summary"""
        # Look for summary/objective sections
        summary_patterns = [
            r'(?:summary|objective|profile)\s*:?\s*([^.]+(?:\.[^.]+){0,2})',
            r'^([^.]+(?:\.[^.]+){0,2})',  # First few sentences
        ]
        
        for pattern in summary_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                summary = matches[0].strip()
                if len(summary) > 50:
                    return summary[:300] + '...' if len(summary) > 300 else summary
        
        # Fallback: use first 200 characters
        return text[:200] + '...' if len(text) > 200 else text

    def _get_role_skills(self, role: str) -> List[str]:
        """Get required skills for a specific role"""
        role_lower = role.lower()
        
        role_skill_map = {
            'software engineer': ['python', 'javascript', 'git', 'sql', 'react', 'nodejs'],
            'data scientist': ['python', 'r', 'machine learning', 'pandas', 'numpy', 'sql'],
            'frontend developer': ['javascript', 'react', 'html', 'css', 'typescript', 'webpack'],
            'backend developer': ['python', 'nodejs', 'sql', 'mongodb', 'express', 'django'],
            'full stack developer': ['javascript', 'python', 'react', 'nodejs', 'sql', 'git'],
            'devops engineer': ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform', 'git'],
            'product manager': ['agile', 'scrum', 'analytics', 'sql', 'project management'],
        }
        
        for role_key, skills in role_skill_map.items():
            if role_key in role_lower:
                return skills
        
        # Default skills for any tech role
        return ['git', 'sql', 'python', 'javascript', 'agile']
