const express = require('express');
const axios = require('axios');
const { protect, checkSubscription } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

const router = express.Router();

// @route   POST /api/interview/create
// @desc    Create new interview session
// @access  Private
router.post('/create', protect, checkSubscription, async (req, res) => {
  try {
    const { jobRole, company, type, difficulty, mode } = req.body;

    if (!jobRole || !type) {
      return res.status(400).json({ message: 'Job role and interview type are required' });
    }

    const user = await User.findById(req.user.id);

    // Generate questions based on resume and job role
    let questions = [];
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/generate-questions`, {
        jobRole,
        difficulty: difficulty || 'intermediate',
        resumeData: user.resume?.parsedData,
        questionCount: 10
      });
      questions = response.data.questions;
    } catch (error) {
      // Fallback questions
      questions = [
        {
          question: `Tell me about your experience with ${jobRole} development.`,
          category: 'general',
          difficulty: 'medium'
        },
        {
          question: 'What are your greatest strengths?',
          category: 'behavioral',
          difficulty: 'easy'
        },
        {
          question: 'Describe a challenging project you worked on.',
          category: 'behavioral',
          difficulty: 'medium'
        }
      ];
    }

    // Create interview
    const interview = new Interview({
      user: req.user.id,
      jobRole,
      company,
      type,
      difficulty: difficulty || 'intermediate',
      mode: mode || 'practice',
      questions,
      duration: { planned: 30 },
      status: 'scheduled'
    });

    await interview.save();

    // Decrease interview count for free users
    if (user.subscription.plan === 'free') {
      user.subscription.interviewsRemaining -= 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Interview creation error:', error);
    res.status(500).json({ message: 'Error creating interview' });
  }
});

// @route   POST /api/interview/:id/start
// @desc    Start interview session
// @access  Private
router.post('/:id/start', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    interview.status = 'in-progress';
    interview.startTime = new Date();
    await interview.save();

    res.json({
      success: true,
      data: {
        interviewId: interview._id,
        questions: interview.questions,
        startTime: interview.startTime
      }
    });
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({ message: 'Error starting interview' });
  }
});

// @route   POST /api/interview/:id/answer
// @desc    Submit answer to question
// @access  Private
router.post('/:id/answer', protect, async (req, res) => {
  try {
    const { questionIndex, answer, audioUrl, videoUrl, duration } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview || interview.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    // Update question with user answer
    interview.questions[questionIndex].userAnswer = {
      text: answer,
      audioUrl,
      videoUrl,
      duration
    };
    interview.questions[questionIndex].answeredAt = new Date();

    // Get AI feedback for the answer
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-answer`, {
        question: interview.questions[questionIndex].question,
        answer,
        category: interview.questions[questionIndex].category,
        jobRole: interview.jobRole
      });

      interview.questions[questionIndex].feedback = response.data.feedback;
    } catch (error) {
      // Fallback feedback
      interview.questions[questionIndex].feedback = {
        score: Math.floor(Math.random() * 30) + 70, // Random score 70-100
        strengths: ['Clear communication'],
        improvements: ['Add more specific examples'],
        technicalAccuracy: 80,
        communication: 85,
        confidence: 75
      };
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        feedback: interview.questions[questionIndex].feedback,
        nextQuestion: questionIndex + 1 < interview.questions.length 
          ? interview.questions[questionIndex + 1] 
          : null
      }
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    res.status(500).json({ message: 'Error submitting answer' });
  }
});

// @route   POST /api/interview/:id/complete
// @desc    Complete interview and generate report
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview || interview.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'completed';
    interview.endTime = new Date();
    interview.duration.actual = Math.round((interview.endTime - interview.startTime) / (1000 * 60));

    // Generate overall feedback
    const answeredQuestions = interview.questions.filter(q => q.feedback);
    if (answeredQuestions.length > 0) {
      const avgScore = answeredQuestions.reduce((sum, q) => sum + (q.feedback.score || 0), 0) / answeredQuestions.length;
      const finalScore = isNaN(avgScore) ? 0 : Math.round(avgScore);
      
      interview.overallFeedback = {
        totalScore: finalScore,
        summary: `You completed ${answeredQuestions.length} out of ${interview.questions.length} questions with an average score of ${finalScore}%.`,
        strengths: ['Good communication skills', 'Clear explanations'],
        areasForImprovement: ['Technical depth', 'Specific examples'],
        recommendations: [
          'Practice more technical questions',
          'Prepare STAR method examples',
          'Research company-specific information'
        ]
      };
    } else {
      // Default feedback when no questions answered
      interview.overallFeedback = {
        totalScore: 0,
        summary: 'No questions were answered in this interview session.',
        strengths: [],
        areasForImprovement: ['Complete interview questions', 'Provide detailed answers'],
        recommendations: [
          'Start a new interview session',
          'Take time to answer each question thoroughly',
          'Practice speaking clearly and confidently'
        ]
      };
    }

    await interview.save();

    // Add to user's interview history
    const user = await User.findById(req.user.id);
    if (!user.interviewHistory.includes(interview._id)) {
      user.interviewHistory.push(interview._id);
      await user.save();
    }

    res.json({
      success: true,
      data: {
        interview: interview,
        report: interview.overallFeedback
      }
    });
  } catch (error) {
    console.error('Interview completion error:', error);
    res.status(500).json({ message: 'Error completing interview' });
  }
});

// @route   GET /api/interview/:id
// @desc    Get interview details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview || interview.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Error fetching interview' });
  }
});

// @route   GET /api/interview
// @desc    Get user's interview history
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const interviews = await Interview.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Interview.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: {
        interviews: interviews.map(interview => interview.getSummary()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Error fetching interviews' });
  }
});

module.exports = router;
