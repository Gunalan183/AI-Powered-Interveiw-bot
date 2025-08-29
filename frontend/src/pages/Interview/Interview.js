import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Video, 
  Mic, 
  MessageSquare, 
  Settings, 
  Play,
  Clock,
  Target,
  Brain
} from 'lucide-react';
import { createInterview } from '../../store/slices/interviewSlice';
import toast from 'react-hot-toast';

const Interview = () => {
  const [interviewConfig, setInterviewConfig] = useState({
    jobRole: '',
    company: '',
    type: 'text',
    difficulty: 'intermediate',
    mode: 'practice'
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const interviewTypes = [
    {
      id: 'text',
      name: 'Text Interview',
      description: 'Type your answers and get instant feedback',
      icon: MessageSquare,
      color: 'bg-blue-500',
      recommended: true
    },
    {
      id: 'audio',
      name: 'Audio Interview',
      description: 'Speak your answers and get voice analysis',
      icon: Mic,
      color: 'bg-green-500'
    },
    {
      id: 'video',
      name: 'Video Interview',
      description: 'Full video interview with body language analysis',
      icon: Video,
      color: 'bg-purple-500',
      premium: true
    }
  ];

  const difficultyLevels = [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Basic questions for entry-level positions',
      duration: '15-20 min'
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'Standard questions for mid-level positions',
      duration: '25-30 min'
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Complex questions for senior positions',
      duration: '35-45 min'
    }
  ];

  const popularRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'UI/UX Designer'
  ];

  const handleConfigChange = (field, value) => {
    setInterviewConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartInterview = async () => {
    if (!interviewConfig.jobRole) {
      toast.error('Please enter a job role');
      return;
    }

    if (user?.subscription?.plan === 'free' && user?.subscription?.interviewsRemaining <= 0) {
      toast.error('You have reached your interview limit. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(createInterview(interviewConfig));
      if (result.type === 'interview/create/fulfilled') {
        const interviewId = result.payload.data._id;
        navigate(`/interview/${interviewId}`);
        toast.success('Interview created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Mock Interview
          </h1>
          <p className="text-gray-600">
            Configure your interview settings and begin practicing with AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Job Role */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Role *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Software Engineer, Product Manager"
                    value={interviewConfig.jobRole}
                    onChange={(e) => handleConfigChange('jobRole', e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {popularRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleConfigChange('jobRole', role)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full transition-colors"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Google, Microsoft, Startup"
                    value={interviewConfig.company}
                    onChange={(e) => handleConfigChange('company', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Interview Type */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {interviewTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = interviewConfig.type === type.id;
                  const isPremium = type.premium && user?.subscription?.plan === 'free';
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => !isPremium && handleConfigChange('type', type.id)}
                      disabled={isPremium}
                      className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`${type.color} p-2 rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {type.recommended && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                        {type.premium && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Level</h3>
              <div className="space-y-3">
                {difficultyLevels.map((level) => {
                  const isSelected = interviewConfig.difficulty === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => handleConfigChange('difficulty', level.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{level.name}</h4>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {level.duration}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Summary Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="card sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Job Role</p>
                    <p className="font-medium text-gray-900">
                      {interviewConfig.jobRole || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {interviewConfig.type} Interview
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {interviewConfig.difficulty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Interviews remaining</span>
                  <span className="font-medium text-gray-900">
                    {user?.subscription?.interviewsRemaining || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={loading || !interviewConfig.jobRole}
                className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Interview
                  </>
                )}
              </button>

              {user?.subscription?.plan === 'free' && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Upgrade to Premium for unlimited interviews and video analysis
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
