import random
from typing import Dict, List, Optional
import json

class QuestionGenerator:
    def __init__(self):
        self.question_templates = {
            'technical': {
                'easy': [
                    "What is {skill} and how have you used it?",
                    "Explain the basics of {skill}.",
                    "What are the main features of {skill}?",
                    "How would you describe {skill} to a beginner?",
                    "What drew you to learning {skill}?"
                ],
                'medium': [
                    "Describe a project where you used {skill}. What challenges did you face?",
                    "How would you optimize performance in a {skill} application?",
                    "What are the best practices you follow when working with {skill}?",
                    "Compare {skill} with similar technologies. What are the pros and cons?",
                    "Walk me through how you would debug an issue in {skill}."
                ],
                'hard': [
                    "Design a scalable system using {skill}. What architecture would you choose?",
                    "How would you handle concurrency issues in {skill}?",
                    "Explain the internals of {skill}. How does it work under the hood?",
                    "What are the security considerations when using {skill}?",
                    "How would you migrate a large codebase from another technology to {skill}?"
                ]
            },
            'behavioral': {
                'easy': [
                    "Tell me about yourself and your background.",
                    "Why are you interested in this role?",
                    "What are your greatest strengths?",
                    "Where do you see yourself in 5 years?",
                    "Why do you want to work for our company?"
                ],
                'medium': [
                    "Describe a time when you had to learn a new technology quickly.",
                    "Tell me about a challenging project you worked on.",
                    "How do you handle working under pressure?",
                    "Describe a time when you had to work with a difficult team member.",
                    "What's the most innovative solution you've implemented?"
                ],
                'hard': [
                    "Tell me about a time when you failed and how you handled it.",
                    "Describe a situation where you had to make a decision with incomplete information.",
                    "How would you handle a disagreement with your manager about technical direction?",
                    "Tell me about a time when you had to convince others to adopt your approach.",
                    "Describe the most complex problem you've solved and your approach."
                ]
            },
            'situational': {
                'easy': [
                    "How would you approach learning a new programming language?",
                    "What would you do if you encountered a bug you couldn't solve?",
                    "How do you stay updated with new technologies?",
                    "What's your process for code review?",
                    "How do you prioritize tasks when everything seems urgent?"
                ],
                'medium': [
                    "Your team is behind schedule on a project. How would you help catch up?",
                    "You discover a security vulnerability in production. What's your approach?",
                    "How would you onboard a new team member?",
                    "A client wants a feature that you think is technically unfeasible. How do you handle it?",
                    "You disagree with a design decision made by a senior developer. What do you do?"
                ],
                'hard': [
                    "The system is down and customers are complaining. Walk me through your incident response.",
                    "You need to choose between two architectural approaches with different trade-offs. How do you decide?",
                    "Your team wants to adopt a new technology, but management is resistant. How do you proceed?",
                    "You've inherited a legacy codebase with poor documentation. How do you approach modernizing it?",
                    "A critical team member just quit before a major deadline. How do you manage the situation?"
                ]
            },
            'general': {
                'easy': [
                    "What interests you most about software development?",
                    "How do you approach problem-solving?",
                    "What's your preferred development environment?",
                    "How do you handle feedback on your code?",
                    "What motivates you in your work?"
                ],
                'medium': [
                    "Describe your ideal work environment.",
                    "How do you balance technical debt with new feature development?",
                    "What's your approach to testing?",
                    "How do you ensure code quality in your projects?",
                    "What's the most important skill for a developer to have?"
                ],
                'hard': [
                    "How do you evaluate and choose between different technical solutions?",
                    "What's your philosophy on software architecture?",
                    "How do you measure the success of a software project?",
                    "What role should developers play in product decisions?",
                    "How do you balance innovation with stability in software development?"
                ]
            }
        }
        
        self.role_specific_questions = {
            'software engineer': {
                'technical': [
                    "Explain the difference between synchronous and asynchronous programming.",
                    "How would you design a REST API for a social media platform?",
                    "What are the SOLID principles and why are they important?",
                    "Explain the concept of Big O notation with examples.",
                    "How do you ensure your code is maintainable and scalable?"
                ],
                'coding': [
                    "Write a function to reverse a string without using built-in methods.",
                    "Implement a binary search algorithm.",
                    "How would you find the duplicate number in an array?",
                    "Design a data structure for a LRU cache.",
                    "Write code to detect if a linked list has a cycle."
                ]
            },
            'frontend developer': {
                'technical': [
                    "Explain the difference between var, let, and const in JavaScript.",
                    "How does the virtual DOM work in React?",
                    "What are CSS Grid and Flexbox? When would you use each?",
                    "Explain event bubbling and capturing in JavaScript.",
                    "How do you optimize web application performance?"
                ]
            },
            'backend developer': {
                'technical': [
                    "Explain the difference between SQL and NoSQL databases.",
                    "How would you design a database schema for an e-commerce platform?",
                    "What are microservices and their advantages?",
                    "How do you handle authentication and authorization?",
                    "Explain caching strategies and when to use them."
                ]
            },
            'data scientist': {
                'technical': [
                    "Explain the difference between supervised and unsupervised learning.",
                    "How would you handle missing data in a dataset?",
                    "What is overfitting and how do you prevent it?",
                    "Explain the bias-variance tradeoff.",
                    "How do you evaluate the performance of a machine learning model?"
                ]
            }
        }

    def generate(self, job_role: str, difficulty: str = "intermediate", 
                 resume_data: Optional[Dict] = None, question_count: int = 10) -> List[Dict]:
        """Generate interview questions based on job role and resume data"""
        
        questions = []
        difficulty_map = {
            'beginner': 'easy',
            'intermediate': 'medium', 
            'advanced': 'hard'
        }
        
        diff_level = difficulty_map.get(difficulty, 'medium')
        
        # Determine question distribution
        distribution = self._get_question_distribution(question_count)
        
        # Generate technical questions based on resume skills
        if resume_data and resume_data.get('skills'):
            tech_questions = self._generate_technical_questions(
                resume_data['skills'], 
                distribution['technical'], 
                diff_level
            )
            questions.extend(tech_questions)
        
        # Generate role-specific questions
        role_questions = self._generate_role_specific_questions(
            job_role, 
            distribution['technical'] - len([q for q in questions if q['category'] == 'technical'])
        )
        questions.extend(role_questions)
        
        # Generate behavioral questions
        behavioral_questions = self._generate_behavioral_questions(
            distribution['behavioral'], 
            diff_level
        )
        questions.extend(behavioral_questions)
        
        # Generate situational questions
        situational_questions = self._generate_situational_questions(
            distribution['situational'], 
            diff_level
        )
        questions.extend(situational_questions)
        
        # Generate general questions
        general_questions = self._generate_general_questions(
            distribution['general'], 
            diff_level
        )
        questions.extend(general_questions)
        
        # Shuffle and limit to requested count
        random.shuffle(questions)
        return questions[:question_count]

    def _get_question_distribution(self, total_count: int) -> Dict[str, int]:
        """Determine how many questions of each type to generate"""
        if total_count <= 5:
            return {
                'technical': max(1, total_count // 2),
                'behavioral': max(1, total_count // 3),
                'situational': max(1, total_count // 4),
                'general': max(0, total_count - (total_count // 2) - (total_count // 3) - (total_count // 4))
            }
        else:
            return {
                'technical': max(2, int(total_count * 0.4)),
                'behavioral': max(2, int(total_count * 0.3)),
                'situational': max(1, int(total_count * 0.2)),
                'general': max(1, int(total_count * 0.1))
            }

    def _generate_technical_questions(self, skills: List[str], count: int, difficulty: str) -> List[Dict]:
        """Generate technical questions based on user's skills"""
        questions = []
        templates = self.question_templates['technical'][difficulty]
        
        # Select random skills and templates
        selected_skills = random.sample(skills, min(len(skills), count))
        
        for i, skill in enumerate(selected_skills):
            if i >= count:
                break
                
            template = random.choice(templates)
            question_text = template.format(skill=skill)
            
            questions.append({
                'question': question_text,
                'category': 'technical',
                'difficulty': difficulty,
                'skill': skill,
                'expectedAnswer': f"Expected to demonstrate knowledge of {skill} with practical examples."
            })
        
        return questions

    def _generate_role_specific_questions(self, job_role: str, count: int) -> List[Dict]:
        """Generate questions specific to the job role"""
        questions = []
        role_lower = job_role.lower()
        
        # Find matching role questions
        role_questions = []
        for role_key, role_data in self.role_specific_questions.items():
            if role_key in role_lower:
                for category, question_list in role_data.items():
                    for q in question_list:
                        role_questions.append({
                            'question': q,
                            'category': 'technical' if category == 'technical' else category,
                            'difficulty': 'medium',
                            'role': job_role
                        })
                break
        
        # Select random questions
        if role_questions:
            selected = random.sample(role_questions, min(len(role_questions), count))
            questions.extend(selected)
        
        return questions

    def _generate_behavioral_questions(self, count: int, difficulty: str) -> List[Dict]:
        """Generate behavioral interview questions"""
        questions = []
        templates = self.question_templates['behavioral'][difficulty]
        
        selected_templates = random.sample(templates, min(len(templates), count))
        
        for template in selected_templates:
            questions.append({
                'question': template,
                'category': 'behavioral',
                'difficulty': difficulty,
                'expectedAnswer': "Expected to use STAR method (Situation, Task, Action, Result) to provide specific examples."
            })
        
        return questions

    def _generate_situational_questions(self, count: int, difficulty: str) -> List[Dict]:
        """Generate situational interview questions"""
        questions = []
        templates = self.question_templates['situational'][difficulty]
        
        selected_templates = random.sample(templates, min(len(templates), count))
        
        for template in selected_templates:
            questions.append({
                'question': template,
                'category': 'situational',
                'difficulty': difficulty,
                'expectedAnswer': "Expected to demonstrate problem-solving approach and decision-making process."
            })
        
        return questions

    def _generate_general_questions(self, count: int, difficulty: str) -> List[Dict]:
        """Generate general interview questions"""
        questions = []
        templates = self.question_templates['general'][difficulty]
        
        selected_templates = random.sample(templates, min(len(templates), count))
        
        for template in selected_templates:
            questions.append({
                'question': template,
                'category': 'general',
                'difficulty': difficulty,
                'expectedAnswer': "Expected to show passion, communication skills, and cultural fit."
            })
        
        return questions
