const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// Extract text from PDF
const extractPdfText = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to extract text from PDF');
  }
};

// Extract text from Word document
const extractWordText = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to extract text from Word document');
  }
};

// Parse resume text using AI service
const parseResumeWithAI = async (text) => {
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/parse-resume`, {
      text: text
    });
    return response.data;
  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to basic parsing if AI service is unavailable
    return basicResumeParser(text);
  }
};

// Basic resume parser (fallback)
const basicResumeParser = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Basic skill extraction
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'docker',
    'kubernetes', 'git', 'agile', 'scrum', 'machine learning', 'ai'
  ];
  
  const skills = [];
  const lowerText = text.toLowerCase();
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill)) {
      skills.push(skill);
    }
  });

  // Basic experience extraction
  const experienceKeywords = ['experience', 'worked', 'developed', 'managed', 'led'];
  const experience = lines.filter(line => 
    experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))
  ).slice(0, 5);

  // Basic education extraction
  const educationKeywords = ['university', 'college', 'degree', 'bachelor', 'master', 'phd'];
  const education = lines.filter(line =>
    educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
  ).slice(0, 3);

  return {
    skills,
    experience,
    education,
    projects: [],
    summary: text.substring(0, 200) + '...'
  };
};

// @route   POST /api/resume/upload
// @desc    Upload and parse resume
// @access  Private
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);

    // Extract text based on file type
    let extractedText;
    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractPdfText(req.file.buffer);
    } else {
      extractedText = await extractWordText(req.file.buffer);
    }

    // Upload file to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'resumes',
          public_id: `${user._id}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Parse resume with AI
    const parsedData = await parseResumeWithAI(extractedText);

    // Update user's resume data
    user.resume = {
      filename: req.file.originalname,
      url: uploadResult.secure_url,
      uploadDate: new Date(),
      parsedData
    };

    // Update user's profile skills if not already set
    if (!user.profile.skills || user.profile.skills.length === 0) {
      user.profile.skills = parsedData.skills;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        filename: req.file.originalname,
        parsedData,
        uploadDate: user.resume.uploadDate
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading resume',
      error: error.message 
    });
  }
});

// @route   GET /api/resume/analysis
// @desc    Get resume analysis and suggestions
// @access  Private
router.get('/analysis', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.resume || !user.resume.parsedData) {
      return res.status(404).json({ message: 'No resume found. Please upload a resume first.' });
    }

    const { parsedData } = user.resume;

    // Call AI service for detailed analysis
    let analysis;
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-resume`, {
        parsedData,
        targetRole: user.profile.targetRole
      });
      analysis = response.data;
    } catch (error) {
      // Fallback analysis
      analysis = {
        strengths: parsedData.skills.slice(0, 5),
        weaknesses: ['Communication skills', 'Leadership experience'],
        suggestions: [
          'Add more quantifiable achievements',
          'Include relevant certifications',
          'Highlight project outcomes'
        ],
        matchScore: 75,
        missingSkills: ['Docker', 'Kubernetes', 'AWS']
      };
    }

    res.json({
      success: true,
      data: {
        resumeData: parsedData,
        analysis,
        uploadDate: user.resume.uploadDate,
        filename: user.resume.filename
      }
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: 'Error analyzing resume' });
  }
});

// @route   DELETE /api/resume
// @desc    Delete user's resume
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.resume) {
      return res.status(404).json({ message: 'No resume found' });
    }

    // Delete from Cloudinary if exists
    if (user.resume.url) {
      const publicId = user.resume.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`resumes/${publicId}`, { resource_type: 'raw' });
    }

    // Clear resume data
    user.resume = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({ message: 'Error deleting resume' });
  }
});

module.exports = router;
