import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Award, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Download,
  Share2,
  RotateCcw
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Results = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviewResults();
  }, [id]);

  const fetchInterviewResults = async () => {
    try {
      const response = await api.get(`/interview/${id}`);
      setInterview(response.data.data);
    } catch (error) {
      console.error('Error fetching interview results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-4">The interview results could not be loaded.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const feedback = interview.overallFeedback || {};
  const answeredQuestions = interview.questions.filter(q => q.feedback);
  
  const scoreData = [
    { name: 'Score', value: feedback.totalScore || 0, fill: '#3b82f6' }
  ];

  const categoryScores = [
    { category: 'Technical', score: feedback.technicalScore || 0 },
    { category: 'Communication', score: feedback.communicationScore || 0 },
    { category: 'Confidence', score: feedback.confidenceScore || 0 },
    { category: 'Body Language', score: feedback.bodyLanguageScore || 0 }
  ].filter(item => item.score > 0);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${getScoreBg(feedback.totalScore || 0)}`}>
              <Award className={`h-8 w-8 ${getScoreColor(feedback.totalScore || 0)}`} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Results</h1>
          <p className="text-gray-600">
            {interview.jobRole} at {interview.company || 'Company'}
          </p>
          <p className="text-sm text-gray-500">
            Completed on {new Date(interview.endTime).toLocaleDateString()}
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card mb-8 text-center"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Performance</h2>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={scoreData}>
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#3b82f6"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(feedback.totalScore || 0)}`}>
                    {feedback.totalScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{answeredQuestions.length}</div>
              <div className="text-sm text-gray-600">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{interview.questions.length}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {interview.duration?.actual || 0}m
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {interview.difficulty}
              </div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Scores */}
          {categoryScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Strengths & Improvements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Strengths */}
            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="card">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
              <div className="card">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                </div>
                <ul className="space-y-2">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recommendations */}
        {feedback.recommendations && feedback.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card mb-8"
          >
            <div className="flex items-center mb-4">
              <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Question-by-Question Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Question Analysis</h3>
          <div className="space-y-6">
            {interview.questions.map((question, index) => {
              const hasAnswer = question.userAnswer && question.userAnswer.text;
              const feedback = question.feedback;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full mr-2">
                          Q{index + 1}
                        </span>
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                          {question.category}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                    </div>
                    {feedback && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(feedback.score)} ${getScoreColor(feedback.score)}`}>
                        {feedback.score}%
                      </div>
                    )}
                  </div>
                  
                  {hasAnswer && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        {question.userAnswer.text}
                      </p>
                    </div>
                  )}
                  
                  {feedback && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {feedback.strengths && feedback.strengths.length > 0 && (
                        <div>
                          <p className="font-medium text-green-700 mb-1">Strengths:</p>
                          <ul className="text-green-600 space-y-1">
                            {feedback.strengths.map((strength, i) => (
                              <li key={i}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedback.improvements && feedback.improvements.length > 0 && (
                        <div>
                          <p className="font-medium text-orange-700 mb-1">Improvements:</p>
                          <ul className="text-orange-600 space-y-1">
                            {feedback.improvements.map((improvement, i) => (
                              <li key={i}>• {improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!hasAnswer && (
                    <p className="text-gray-500 text-sm italic">Question not answered</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/interview" className="btn-primary flex items-center justify-center">
            <RotateCcw className="h-5 w-5 mr-2" />
            Practice Again
          </Link>
          <button className="btn-secondary flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            Download Report
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share Results
          </button>
          <Link to="/history" className="btn-outline flex items-center justify-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            View History
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
