from typing import Dict, List
import random

class FeedbackGenerator:
    def __init__(self):
        self.feedback_templates = {
            'strengths': {
                'high_technical': [
                    "Excellent technical depth and accuracy in your response",
                    "Strong demonstration of technical knowledge and expertise",
                    "Impressive understanding of technical concepts and implementation",
                    "Great technical insight and practical application knowledge"
                ],
                'good_structure': [
                    "Well-structured and organized response",
                    "Clear logical flow in your explanation",
                    "Excellent use of the STAR method for storytelling",
                    "Good progression from problem to solution"
                ],
                'high_confidence': [
                    "Confident and assured delivery",
                    "Strong conviction in your responses",
                    "Excellent communication confidence",
                    "Clear and decisive communication style"
                ],
                'good_examples': [
                    "Great use of specific examples and real-world scenarios",
                    "Excellent concrete examples that illustrate your points",
                    "Strong practical examples that demonstrate experience",
                    "Good use of case studies and specific instances"
                ],
                'comprehensive': [
                    "Comprehensive and thorough response",
                    "Complete coverage of all question aspects",
                    "Detailed and well-rounded answer",
                    "Thorough exploration of the topic"
                ]
            },
            'improvements': {
                'low_technical': [
                    "Consider adding more technical details and depth",
                    "Include more specific technical examples and implementations",
                    "Expand on the technical aspects of your solution",
                    "Provide more detailed technical reasoning"
                ],
                'poor_structure': [
                    "Try to organize your response with a clearer structure",
                    "Consider using the STAR method for behavioral questions",
                    "Improve the logical flow of your explanation",
                    "Structure your answer with clear beginning, middle, and end"
                ],
                'low_confidence': [
                    "Speak with more confidence and conviction",
                    "Reduce hedge words like 'maybe' and 'I think'",
                    "Be more assertive in your responses",
                    "Practice speaking with greater certainty"
                ],
                'insufficient_examples': [
                    "Include more specific examples from your experience",
                    "Add concrete scenarios to illustrate your points",
                    "Provide real-world examples to support your answers",
                    "Use more detailed case studies and specific instances"
                ],
                'incomplete': [
                    "Provide more comprehensive coverage of the question",
                    "Address all parts of the multi-part question",
                    "Expand your response to be more thorough",
                    "Include more detail to fully answer the question"
                ],
                'too_brief': [
                    "Expand your response with more detail and examples",
                    "Provide a more comprehensive answer",
                    "Add more depth to your explanation",
                    "Include additional context and background"
                ],
                'too_verbose': [
                    "Try to be more concise while maintaining key points",
                    "Focus on the most important aspects of your answer",
                    "Streamline your response for better clarity",
                    "Practice delivering more focused responses"
                ]
            },
            'suggestions': {
                'technical_improvement': [
                    "Practice explaining technical concepts in simple terms",
                    "Prepare specific examples of your technical work",
                    "Study common technical interview questions for your role",
                    "Practice whiteboarding and code explanation"
                ],
                'communication_improvement': [
                    "Practice the STAR method for behavioral questions",
                    "Work on speaking with more confidence and less hesitation",
                    "Practice structuring your responses clearly",
                    "Record yourself answering questions to improve delivery"
                ],
                'preparation_tips': [
                    "Research the company and role more thoroughly",
                    "Prepare more specific examples from your experience",
                    "Practice common interview questions for your field",
                    "Review your resume and be ready to discuss each point"
                ]
            }
        }

    def generate_feedback(self, analysis: Dict) -> Dict:
        """Generate comprehensive feedback based on answer analysis"""
        
        scores = analysis['scores']
        
        # Determine feedback based on scores
        strengths = self._identify_strengths(analysis)
        improvements = self._identify_improvements(analysis)
        suggestions = self._generate_suggestions(analysis)
        
        # Calculate component scores
        technical_accuracy = min(100, scores['technical_score'])
        communication = min(100, scores['communication_score'])
        confidence = min(100, scores['confidence_score'])
        
        return {
            'score': int(scores['overall_score']),
            'strengths': strengths,
            'improvements': improvements,
            'suggestions': suggestions,
            'technicalAccuracy': int(technical_accuracy),
            'communication': int(communication),
            'confidence': int(confidence),
            'detailed_scores': {
                'content': int(scores['content_score']),
                'technical': int(scores['technical_score']),
                'structure': int(scores['structure_score']),
                'completeness': int(scores['completeness_score'])
            }
        }

    def _identify_strengths(self, analysis: Dict) -> List[str]:
        """Identify strengths based on analysis scores"""
        strengths = []
        scores = analysis['scores']
        
        # Technical strengths
        if scores['technical_score'] >= 75:
            strengths.append(random.choice(self.feedback_templates['strengths']['high_technical']))
        
        # Structure strengths
        if scores['structure_score'] >= 70:
            strengths.append(random.choice(self.feedback_templates['strengths']['good_structure']))
        
        # Confidence strengths
        if scores['confidence_score'] >= 75:
            strengths.append(random.choice(self.feedback_templates['strengths']['high_confidence']))
        
        # Examples and completeness
        if analysis['content_analysis'].get('has_examples', False):
            strengths.append(random.choice(self.feedback_templates['strengths']['good_examples']))
        
        if scores['completeness_score'] >= 80:
            strengths.append(random.choice(self.feedback_templates['strengths']['comprehensive']))
        
        # Ensure at least one strength
        if not strengths:
            if scores['overall_score'] >= 50:
                strengths.append("Good effort in addressing the question")
            else:
                strengths.append("Thank you for providing a response")
        
        return strengths[:3]  # Limit to top 3 strengths

    def _identify_improvements(self, analysis: Dict) -> List[str]:
        """Identify areas for improvement based on analysis"""
        improvements = []
        scores = analysis['scores']
        content = analysis['content_analysis']
        
        # Technical improvements
        if scores['technical_score'] < 50:
            improvements.append(random.choice(self.feedback_templates['improvements']['low_technical']))
        
        # Structure improvements
        if scores['structure_score'] < 50:
            improvements.append(random.choice(self.feedback_templates['improvements']['poor_structure']))
        
        # Confidence improvements
        if scores['confidence_score'] < 60:
            improvements.append(random.choice(self.feedback_templates['improvements']['low_confidence']))
        
        # Examples and completeness
        if not content.get('has_examples', False):
            improvements.append(random.choice(self.feedback_templates['improvements']['insufficient_examples']))
        
        # Length-based improvements
        word_count = content.get('word_count', 0)
        if word_count < 50:
            improvements.append(random.choice(self.feedback_templates['improvements']['too_brief']))
        elif word_count > 400:
            improvements.append(random.choice(self.feedback_templates['improvements']['too_verbose']))
        
        # Completeness
        if scores['completeness_score'] < 60:
            improvements.append(random.choice(self.feedback_templates['improvements']['incomplete']))
        
        return improvements[:3]  # Limit to top 3 improvements

    def _generate_suggestions(self, analysis: Dict) -> List[str]:
        """Generate actionable suggestions for improvement"""
        suggestions = []
        scores = analysis['scores']
        
        # Technical suggestions
        if scores['technical_score'] < 70:
            suggestions.append(random.choice(self.feedback_templates['suggestions']['technical_improvement']))
        
        # Communication suggestions
        if scores['communication_score'] < 70 or scores['structure_score'] < 60:
            suggestions.append(random.choice(self.feedback_templates['suggestions']['communication_improvement']))
        
        # General preparation suggestions
        if scores['overall_score'] < 70:
            suggestions.append(random.choice(self.feedback_templates['suggestions']['preparation_tips']))
        
        # Specific suggestions based on analysis
        if analysis['structure_analysis']['star_score'] < 50:
            suggestions.append("Practice using the STAR method (Situation, Task, Action, Result) for behavioral questions")
        
        if analysis['confidence_analysis']['hedge_word_count'] > 3:
            suggestions.append("Reduce filler words and hedge phrases to sound more confident")
        
        # Ensure at least one suggestion
        if not suggestions:
            suggestions.append("Continue practicing interview questions to build confidence and improve responses")
        
        return suggestions[:4]  # Limit to top 4 suggestions

    def generate_interview_summary(self, interview_data: Dict) -> Dict:
        """Generate overall interview summary and feedback"""
        
        questions = interview_data.get('questions', [])
        answered_questions = [q for q in questions if q.get('feedback')]
        
        if not answered_questions:
            return {
                'summary': "Interview not completed",
                'overall_score': 0,
                'strengths': [],
                'areas_for_improvement': [],
                'recommendations': []
            }
        
        # Calculate averages
        avg_score = sum(q['feedback']['score'] for q in answered_questions) / len(answered_questions)
        avg_technical = sum(q['feedback'].get('technicalAccuracy', 0) for q in answered_questions) / len(answered_questions)
        avg_communication = sum(q['feedback'].get('communication', 0) for q in answered_questions) / len(answered_questions)
        avg_confidence = sum(q['feedback'].get('confidence', 0) for q in answered_questions) / len(answered_questions)
        
        # Collect all strengths and improvements
        all_strengths = []
        all_improvements = []
        
        for q in answered_questions:
            feedback = q['feedback']
            all_strengths.extend(feedback.get('strengths', []))
            all_improvements.extend(feedback.get('improvements', []))
        
        # Get unique strengths and improvements
        unique_strengths = list(set(all_strengths))[:5]
        unique_improvements = list(set(all_improvements))[:5]
        
        # Generate overall recommendations
        recommendations = self._generate_interview_recommendations(avg_score, avg_technical, avg_communication)
        
        # Generate summary text
        summary = self._generate_summary_text(len(answered_questions), len(questions), avg_score)
        
        return {
            'summary': summary,
            'overall_score': int(avg_score),
            'technical_score': int(avg_technical),
            'communication_score': int(avg_communication),
            'confidence_score': int(avg_confidence),
            'strengths': unique_strengths,
            'areas_for_improvement': unique_improvements,
            'recommendations': recommendations,
            'questions_answered': len(answered_questions),
            'total_questions': len(questions)
        }

    def _generate_interview_recommendations(self, avg_score: float, avg_technical: float, avg_communication: float) -> List[str]:
        """Generate overall interview recommendations"""
        recommendations = []
        
        if avg_score >= 80:
            recommendations.append("Excellent performance! You're well-prepared for interviews at this level.")
        elif avg_score >= 70:
            recommendations.append("Good performance with room for improvement in specific areas.")
        elif avg_score >= 60:
            recommendations.append("Solid foundation but focus on strengthening weaker areas.")
        else:
            recommendations.append("Significant improvement needed. Consider more practice and preparation.")
        
        if avg_technical < 70:
            recommendations.append("Focus on strengthening technical knowledge and practice coding problems.")
        
        if avg_communication < 70:
            recommendations.append("Work on communication skills and practice explaining concepts clearly.")
        
        recommendations.append("Continue practicing with mock interviews to build confidence.")
        
        return recommendations

    def _generate_summary_text(self, answered: int, total: int, avg_score: float) -> str:
        """Generate interview summary text"""
        completion_rate = (answered / total) * 100 if total > 0 else 0
        
        if avg_score >= 80:
            performance = "excellent"
        elif avg_score >= 70:
            performance = "good"
        elif avg_score >= 60:
            performance = "satisfactory"
        else:
            performance = "needs improvement"
        
        return (f"You completed {answered} out of {total} questions ({completion_rate:.0f}% completion rate) "
                f"with an average score of {avg_score:.0f}%. Your overall performance was {performance}. "
                f"Focus on the improvement areas identified to enhance your interview skills.")
