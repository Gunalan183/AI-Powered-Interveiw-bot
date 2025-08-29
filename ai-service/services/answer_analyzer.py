import re
import nltk
from typing import Dict, List
from textstat import flesch_reading_ease, flesch_kincaid_grade
import spacy

class AnswerAnalyzer:
    def __init__(self):
        # Load spaCy model for NLP analysis
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Warning: spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Initialize NLTK
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            from nltk.sentiment import SentimentIntensityAnalyzer
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except:
            self.sentiment_analyzer = None
        
        # Keywords for different aspects
        self.confidence_keywords = {
            'high': ['confident', 'certain', 'definitely', 'absolutely', 'sure', 'positive'],
            'low': ['maybe', 'perhaps', 'might', 'possibly', 'unsure', 'think', 'guess']
        }
        
        self.technical_keywords = {
            'architecture': ['design', 'architecture', 'pattern', 'structure', 'framework'],
            'performance': ['optimize', 'performance', 'speed', 'efficient', 'scalable'],
            'security': ['security', 'authentication', 'authorization', 'encryption', 'vulnerability'],
            'testing': ['test', 'testing', 'unit test', 'integration', 'debugging'],
            'collaboration': ['team', 'collaborate', 'communication', 'meeting', 'review']
        }

    def analyze(self, question: str, answer: str, category: str, job_role: str) -> Dict:
        """Analyze user's answer and return detailed analysis"""
        
        if not answer or len(answer.strip()) < 10:
            return self._generate_insufficient_answer_analysis()
        
        analysis = {
            'content_analysis': self._analyze_content(answer, question, category),
            'linguistic_analysis': self._analyze_linguistics(answer),
            'technical_analysis': self._analyze_technical_content(answer, job_role),
            'structure_analysis': self._analyze_structure(answer, category),
            'confidence_analysis': self._analyze_confidence(answer),
            'completeness_analysis': self._analyze_completeness(answer, question, category)
        }
        
        # Calculate overall scores
        analysis['scores'] = self._calculate_scores(analysis)
        
        return analysis

    def _analyze_content(self, answer: str, question: str, category: str) -> Dict:
        """Analyze the content relevance and quality"""
        
        # Basic metrics
        word_count = len(answer.split())
        sentence_count = len([s for s in answer.split('.') if s.strip()])
        
        # Keyword relevance
        question_keywords = set(re.findall(r'\b\w+\b', question.lower()))
        answer_keywords = set(re.findall(r'\b\w+\b', answer.lower()))
        relevance_score = len(question_keywords.intersection(answer_keywords)) / max(len(question_keywords), 1) * 100
        
        # Content depth indicators
        depth_indicators = ['because', 'therefore', 'however', 'additionally', 'furthermore', 'for example', 'such as']
        depth_score = sum(1 for indicator in depth_indicators if indicator in answer.lower()) * 10
        
        return {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'relevance_score': min(100, relevance_score),
            'depth_score': min(100, depth_score),
            'has_examples': any(phrase in answer.lower() for phrase in ['for example', 'such as', 'like when', 'instance'])
        }

    def _analyze_linguistics(self, answer: str) -> Dict:
        """Analyze linguistic quality of the answer"""
        
        try:
            # Readability scores
            readability = flesch_reading_ease(answer)
            grade_level = flesch_kincaid_grade(answer)
        except:
            readability = 50  # Default moderate score
            grade_level = 10
        
        # Grammar and complexity
        if self.nlp:
            doc = self.nlp(answer)
            
            # Count different types of words
            nouns = len([token for token in doc if token.pos_ == 'NOUN'])
            verbs = len([token for token in doc if token.pos_ == 'VERB'])
            adjectives = len([token for token in doc if token.pos_ == 'ADJ'])
            
            # Sentence complexity
            avg_sentence_length = len(doc) / max(len(list(doc.sents)), 1)
            
            vocabulary_diversity = len(set([token.lemma_.lower() for token in doc if token.is_alpha])) / max(len(doc), 1)
        else:
            # Fallback analysis
            words = answer.split()
            nouns = len([w for w in words if w.endswith('tion') or w.endswith('ness')])
            verbs = len([w for w in words if w.endswith('ed') or w.endswith('ing')])
            adjectives = len([w for w in words if w.endswith('ly')])
            avg_sentence_length = len(words) / max(len(answer.split('.')), 1)
            vocabulary_diversity = len(set(words)) / max(len(words), 1)
        
        return {
            'readability_score': max(0, min(100, readability)),
            'grade_level': grade_level,
            'avg_sentence_length': avg_sentence_length,
            'vocabulary_diversity': vocabulary_diversity * 100,
            'word_types': {
                'nouns': nouns,
                'verbs': verbs,
                'adjectives': adjectives
            }
        }

    def _analyze_technical_content(self, answer: str, job_role: str) -> Dict:
        """Analyze technical depth and accuracy"""
        
        answer_lower = answer.lower()
        
        # Count technical keywords by category
        technical_scores = {}
        for category, keywords in self.technical_keywords.items():
            score = sum(1 for keyword in keywords if keyword in answer_lower)
            technical_scores[category] = min(100, score * 20)
        
        # Role-specific technical terms
        role_terms = self._get_role_technical_terms(job_role)
        role_term_count = sum(1 for term in role_terms if term in answer_lower)
        role_technical_score = min(100, role_term_count * 15)
        
        # Code or technical examples
        has_code_example = any(indicator in answer_lower for indicator in 
                              ['function', 'class', 'method', 'algorithm', 'data structure', 'database'])
        
        return {
            'technical_categories': technical_scores,
            'role_technical_score': role_technical_score,
            'has_code_example': has_code_example,
            'overall_technical_score': sum(technical_scores.values()) / max(len(technical_scores), 1)
        }

    def _analyze_structure(self, answer: str, category: str) -> Dict:
        """Analyze answer structure and organization"""
        
        # STAR method detection for behavioral questions
        star_indicators = {
            'situation': ['situation', 'context', 'background', 'when', 'where'],
            'task': ['task', 'responsibility', 'goal', 'objective', 'needed to'],
            'action': ['action', 'did', 'implemented', 'developed', 'created', 'decided'],
            'result': ['result', 'outcome', 'achieved', 'improved', 'increased', 'successful']
        }
        
        star_score = 0
        star_components = {}
        
        if category == 'behavioral':
            answer_lower = answer.lower()
            for component, indicators in star_indicators.items():
                has_component = any(indicator in answer_lower for indicator in indicators)
                star_components[component] = has_component
                if has_component:
                    star_score += 25
        
        # Logical flow indicators
        flow_indicators = ['first', 'then', 'next', 'finally', 'in conclusion', 'therefore']
        has_logical_flow = sum(1 for indicator in flow_indicators if indicator in answer.lower()) > 0
        
        # Introduction and conclusion
        has_introduction = len(answer.split('.')[0]) > 20 if '.' in answer else False
        has_conclusion = any(phrase in answer.lower()[-100:] for phrase in 
                           ['in conclusion', 'to summarize', 'overall', 'in summary'])
        
        return {
            'star_score': star_score,
            'star_components': star_components,
            'has_logical_flow': has_logical_flow,
            'has_introduction': has_introduction,
            'has_conclusion': has_conclusion,
            'structure_score': (star_score + (25 if has_logical_flow else 0) + 
                              (15 if has_introduction else 0) + (10 if has_conclusion else 0))
        }

    def _analyze_confidence(self, answer: str) -> Dict:
        """Analyze confidence level in the answer"""
        
        answer_lower = answer.lower()
        
        # Count confidence indicators
        high_confidence = sum(1 for word in self.confidence_keywords['high'] if word in answer_lower)
        low_confidence = sum(1 for word in self.confidence_keywords['low'] if word in answer_lower)
        
        # Hedge words and filler words
        hedge_words = ['kind of', 'sort of', 'i think', 'i believe', 'probably', 'maybe']
        hedge_count = sum(1 for phrase in hedge_words if phrase in answer_lower)
        
        # Calculate confidence score
        confidence_score = max(0, min(100, (high_confidence * 15) - (low_confidence * 10) - (hedge_count * 5) + 50))
        
        # Sentiment analysis
        sentiment_score = 50  # Default neutral
        if self.sentiment_analyzer:
            try:
                sentiment = self.sentiment_analyzer.polarity_scores(answer)
                sentiment_score = max(0, min(100, (sentiment['compound'] + 1) * 50))
            except:
                pass
        
        return {
            'confidence_score': confidence_score,
            'high_confidence_indicators': high_confidence,
            'low_confidence_indicators': low_confidence,
            'hedge_word_count': hedge_count,
            'sentiment_score': sentiment_score
        }

    def _analyze_completeness(self, answer: str, question: str, category: str) -> Dict:
        """Analyze how complete the answer is"""
        
        word_count = len(answer.split())
        
        # Expected length by category
        expected_lengths = {
            'technical': (100, 300),
            'behavioral': (150, 400),
            'situational': (100, 250),
            'general': (50, 200)
        }
        
        min_length, max_length = expected_lengths.get(category, (100, 250))
        
        # Length appropriateness
        if word_count < min_length:
            length_score = (word_count / min_length) * 70
        elif word_count > max_length:
            length_score = max(70, 100 - ((word_count - max_length) / max_length) * 30)
        else:
            length_score = 100
        
        # Question addressing
        question_parts = question.count('?') + question.count('and') + question.count('or')
        question_parts = max(1, question_parts)
        
        # Simple heuristic for addressing multiple parts
        addresses_all_parts = len(answer.split('.')) >= question_parts
        
        return {
            'word_count': word_count,
            'length_score': length_score,
            'addresses_all_parts': addresses_all_parts,
            'completeness_score': (length_score + (20 if addresses_all_parts else 0)) / 1.2
        }

    def _calculate_scores(self, analysis: Dict) -> Dict:
        """Calculate overall scores from analysis"""
        
        # Weight different aspects
        weights = {
            'content': 0.25,
            'technical': 0.25,
            'structure': 0.20,
            'confidence': 0.15,
            'completeness': 0.15
        }
        
        # Extract key scores
        content_score = (analysis['content_analysis']['relevance_score'] + 
                        analysis['content_analysis']['depth_score']) / 2
        
        technical_score = analysis['technical_analysis']['overall_technical_score']
        structure_score = analysis['structure_analysis']['structure_score']
        confidence_score = analysis['confidence_analysis']['confidence_score']
        completeness_score = analysis['completeness_analysis']['completeness_score']
        
        # Calculate weighted overall score
        overall_score = (
            content_score * weights['content'] +
            technical_score * weights['technical'] +
            structure_score * weights['structure'] +
            confidence_score * weights['confidence'] +
            completeness_score * weights['completeness']
        )
        
        return {
            'overall_score': min(100, max(0, overall_score)),
            'content_score': content_score,
            'technical_score': technical_score,
            'structure_score': structure_score,
            'confidence_score': confidence_score,
            'completeness_score': completeness_score,
            'communication_score': (analysis['linguistic_analysis']['readability_score'] + 
                                  confidence_score) / 2
        }

    def _generate_insufficient_answer_analysis(self) -> Dict:
        """Generate analysis for insufficient answers"""
        return {
            'content_analysis': {'relevance_score': 0, 'depth_score': 0, 'word_count': 0},
            'technical_analysis': {'overall_technical_score': 0},
            'structure_analysis': {'structure_score': 0},
            'confidence_analysis': {'confidence_score': 0},
            'completeness_analysis': {'completeness_score': 0},
            'scores': {
                'overall_score': 0,
                'content_score': 0,
                'technical_score': 0,
                'structure_score': 0,
                'confidence_score': 0,
                'completeness_score': 0,
                'communication_score': 0
            }
        }

    def _get_role_technical_terms(self, job_role: str) -> List[str]:
        """Get technical terms specific to job role"""
        role_terms = {
            'software engineer': ['algorithm', 'data structure', 'api', 'framework', 'library', 'debugging'],
            'frontend developer': ['responsive', 'dom', 'css', 'javascript', 'react', 'vue', 'angular'],
            'backend developer': ['database', 'server', 'api', 'microservices', 'authentication', 'caching'],
            'data scientist': ['model', 'dataset', 'analysis', 'statistics', 'machine learning', 'visualization'],
            'devops engineer': ['deployment', 'infrastructure', 'monitoring', 'automation', 'pipeline', 'container']
        }
        
        role_lower = job_role.lower()
        for role, terms in role_terms.items():
            if role in role_lower:
                return terms
        
        return ['technology', 'system', 'solution', 'implementation', 'development']
