const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'situational', 'general'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  expectedAnswer: String,
  userAnswer: {
    text: String,
    audioUrl: String,
    videoUrl: String,
    duration: Number
  },
  feedback: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    strengths: [String],
    improvements: [String],
    technicalAccuracy: Number,
    communication: Number,
    confidence: Number
  },
  answeredAt: Date
});

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'video'],
    required: true
  },
  mode: {
    type: String,
    enum: ['practice', 'mock', 'assessment'],
    default: 'practice'
  },
  jobRole: {
    type: String,
    required: true
  },
  company: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  duration: {
    planned: Number, // in minutes
    actual: Number
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  overallFeedback: {
    totalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    technicalScore: Number,
    communicationScore: Number,
    confidenceScore: Number,
    bodyLanguageScore: Number,
    summary: String,
    strengths: [String],
    areasForImprovement: [String],
    recommendations: [String]
  },
  aiAnalysis: {
    resumeMatch: Number, // percentage match with job requirements
    skillsAssessed: [String],
    missingSkills: [String],
    experienceLevel: String
  },
  videoAnalysis: {
    eyeContact: Number,
    facialExpressions: [String],
    posture: String,
    gestures: String
  },
  audioAnalysis: {
    clarity: Number,
    pace: Number,
    tone: String,
    fillerWords: Number,
    confidence: Number
  },
  startTime: Date,
  endTime: Date,
  scheduledFor: Date
}, {
  timestamps: true
});

// Index for better query performance
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ jobRole: 1 });

// Calculate overall score before saving
interviewSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    const totalQuestions = this.questions.length;
    const answeredQuestions = this.questions.filter(q => q.feedback && q.feedback.score);
    
    if (answeredQuestions.length > 0) {
      const avgScore = answeredQuestions.reduce((sum, q) => sum + q.feedback.score, 0) / answeredQuestions.length;
      const avgTechnical = answeredQuestions.reduce((sum, q) => sum + (q.feedback.technicalAccuracy || 0), 0) / answeredQuestions.length;
      const avgCommunication = answeredQuestions.reduce((sum, q) => sum + (q.feedback.communication || 0), 0) / answeredQuestions.length;
      const avgConfidence = answeredQuestions.reduce((sum, q) => sum + (q.feedback.confidence || 0), 0) / answeredQuestions.length;
      
      this.overallFeedback.totalScore = Math.round(avgScore);
      this.overallFeedback.technicalScore = Math.round(avgTechnical);
      this.overallFeedback.communicationScore = Math.round(avgCommunication);
      this.overallFeedback.confidenceScore = Math.round(avgConfidence);
    }
  }
  next();
});

// Get interview summary
interviewSchema.methods.getSummary = function() {
  return {
    id: this._id,
    jobRole: this.jobRole,
    company: this.company,
    type: this.type,
    status: this.status,
    totalScore: this.overallFeedback.totalScore,
    questionsAnswered: this.questions.filter(q => q.userAnswer && q.userAnswer.text).length,
    totalQuestions: this.questions.length,
    duration: this.duration.actual,
    completedAt: this.endTime,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Interview', interviewSchema);
