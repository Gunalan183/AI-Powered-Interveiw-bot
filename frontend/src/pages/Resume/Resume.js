import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Trash2,
  Eye,
  Brain,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { uploadResume, fetchResumeAnalysis, deleteResume } from '../../store/slices/resumeSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Resume = () => {
  const dispatch = useDispatch();
  const { resumeData, analysis, loading, uploadProgress } = useSelector(state => state.resume);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (!resumeData && !loading) {
      dispatch(fetchResumeAnalysis());
    }
  }, [dispatch, resumeData, loading]);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const formData = new FormData();
      formData.append('resume', file);
      
      try {
        const result = await dispatch(uploadResume(formData));
        if (result.type === 'resume/upload/fulfilled') {
          toast.success('Resume uploaded and analyzed successfully!');
          setActiveTab('analysis');
        }
      } catch (error) {
        toast.error('Failed to upload resume');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleDeleteResume = async () => {
    if (window.confirm('Are you sure you want to delete your resume?')) {
      try {
        await dispatch(deleteResume());
        toast.success('Resume deleted successfully');
        setActiveTab('upload');
      } catch (error) {
        toast.error('Failed to delete resume');
      }
    }
  };

  const skillsData = analysis?.skillCategories ? 
    Object.entries(analysis.skillCategories).map(([category, data]) => ({
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.count,
      percentage: data.percentage
    })) : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
            <div className="bg-primary-600 p-3 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis</h1>
          <p className="text-gray-600">
            Upload your resume to get AI-powered insights and optimization suggestions
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Resume
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              disabled={!resumeData}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'analysis'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analysis Results
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Current Resume Status */}
              {resumeData && (
                <div className="card mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Current Resume</h3>
                        <p className="text-sm text-gray-600">
                          {resumeData.filename} • Uploaded {new Date(resumeData.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab('analysis')}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Analysis"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleDeleteResume}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="card">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your resume, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, and DOCX files up to 10MB
                    </p>
                  </div>
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Uploading and analyzing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-3">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">AI Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Get detailed insights about your skills and experience
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Optimization Tips</h3>
                  <p className="text-sm text-gray-600">
                    Receive suggestions to improve your resume
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Job Matching</h3>
                  <p className="text-sm text-gray-600">
                    See how well your resume matches job requirements
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analysis' && resumeData && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Match Score */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Resume Score</h3>
                      <Award className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary-600 mb-2">
                        {Math.round(analysis?.matchScore || 0)}%
                      </div>
                      <p className="text-gray-600">Overall Match Score</p>
                    </div>
                  </div>

                  {/* Skills Breakdown */}
                  {skillsData.length > 0 && (
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills Analysis</h3>
                      <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={skillsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip formatter={(value) => [value, 'Skills Count']} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {skillsData.map((skill, index) => (
                          <div key={skill.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{skill.category}</span>
                            </div>
                            <span className="text-sm text-gray-600">{skill.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Strengths */}
                  {analysis?.strengths && analysis.strengths.length > 0 && (
                    <div className="card">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis?.suggestions && analysis.suggestions.length > 0 && (
                    <div className="card">
                      <div className="flex items-center mb-4">
                        <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {analysis?.missingSkills && analysis.missingSkills.length > 0 && (
                    <div className="card">
                      <div className="flex items-center mb-4">
                        <Target className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Missing Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingSkills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skills */}
                {resumeData.parsedData?.skills && resumeData.parsedData.skills.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.parsedData.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {resumeData.parsedData?.experience && resumeData.parsedData.experience.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
                    <ul className="space-y-2">
                      {resumeData.parsedData.experience.map((exp, index) => (
                        <li key={index} className="text-sm text-gray-700 border-l-2 border-gray-200 pl-3">
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Education */}
                {resumeData.parsedData?.education && resumeData.parsedData.education.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                    <ul className="space-y-2">
                      {resumeData.parsedData.education.map((edu, index) => (
                        <li key={index} className="text-sm text-gray-700 border-l-2 border-gray-200 pl-3">
                          {edu}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Projects */}
                {resumeData.parsedData?.projects && resumeData.parsedData.projects.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
                    <ul className="space-y-2">
                      {resumeData.parsedData.projects.map((project, index) => (
                        <li key={index} className="text-sm text-gray-700 border-l-2 border-gray-200 pl-3">
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 mt-8">
                <button className="btn-primary flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Download Report
                </button>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="btn-secondary flex items-center"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload New Resume
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Resume;
