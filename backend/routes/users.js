const express = require('express');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

const router = express.Router();

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'interviewHistory',
      options: { sort: { createdAt: -1 }, limit: 5 }
    });

    const totalInterviews = await Interview.countDocuments({ user: req.user.id });
    const completedInterviews = await Interview.countDocuments({ 
      user: req.user.id, 
      status: 'completed' 
    });

    // Calculate average score
    const interviews = await Interview.find({ 
      user: req.user.id, 
      status: 'completed',
      'overallFeedback.totalScore': { $exists: true }
    });

    const avgScore = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + interview.overallFeedback.totalScore, 0) / interviews.length
      : 0;

    // Get recent performance trend (last 10 interviews)
    const recentInterviews = await Interview.find({
      user: req.user.id,
      status: 'completed',
      'overallFeedback.totalScore': { $exists: true }
    }).sort({ createdAt: -1 }).limit(10);

    const performanceTrend = recentInterviews.map(interview => ({
      date: interview.createdAt,
      score: interview.overallFeedback.totalScore,
      jobRole: interview.jobRole
    }));

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        stats: {
          totalInterviews,
          completedInterviews,
          averageScore: Math.round(avgScore),
          interviewsRemaining: user.subscription.interviewsRemaining
        },
        recentInterviews: user.interviewHistory.map(interview => interview.getSummary()),
        performanceTrend
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// @route   GET /api/users/stats
// @desc    Get detailed user statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id, status: 'completed' });

    // Skills performance analysis
    const skillsPerformance = {};
    interviews.forEach(interview => {
      if (interview.aiAnalysis && interview.aiAnalysis.skillsAssessed) {
        interview.aiAnalysis.skillsAssessed.forEach(skill => {
          if (!skillsPerformance[skill]) {
            skillsPerformance[skill] = { total: 0, count: 0 };
          }
          skillsPerformance[skill].total += interview.overallFeedback.totalScore || 0;
          skillsPerformance[skill].count += 1;
        });
      }
    });

    // Calculate average for each skill
    const skillsAnalysis = Object.keys(skillsPerformance).map(skill => ({
      skill,
      averageScore: Math.round(skillsPerformance[skill].total / skillsPerformance[skill].count),
      interviewCount: skillsPerformance[skill].count
    }));

    // Interview type performance
    const typePerformance = {
      text: { total: 0, count: 0 },
      audio: { total: 0, count: 0 },
      video: { total: 0, count: 0 }
    };

    interviews.forEach(interview => {
      if (typePerformance[interview.type]) {
        typePerformance[interview.type].total += interview.overallFeedback.totalScore || 0;
        typePerformance[interview.type].count += 1;
      }
    });

    const typeAnalysis = Object.keys(typePerformance).map(type => ({
      type,
      averageScore: typePerformance[type].count > 0 
        ? Math.round(typePerformance[type].total / typePerformance[type].count) 
        : 0,
      interviewCount: typePerformance[type].count
    }));

    res.json({
      success: true,
      data: {
        skillsAnalysis,
        typeAnalysis,
        totalInterviews: interviews.length,
        improvementAreas: skillsAnalysis
          .filter(skill => skill.averageScore < 70)
          .sort((a, b) => a.averageScore - b.averageScore)
          .slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
