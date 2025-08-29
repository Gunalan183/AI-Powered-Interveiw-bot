const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Update user profile with new image URL
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old image from Cloudinary if it exists
    if (user.profile && user.profile.profileImage) {
      const publicId = user.profile.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`profile-images/${publicId}`);
    }

    // Update user with new profile image
    user.profile = user.profile || {};
    user.profile.profileImage = req.file.path;
    await user.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: req.file.path,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload' });
  }
});

// @route   DELETE /api/upload/profile-image
// @desc    Delete profile image
// @access  Private
router.delete('/profile-image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profile && user.profile.profileImage) {
      // Delete image from Cloudinary
      const publicId = user.profile.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`profile-images/${publicId}`);

      // Remove image URL from user profile
      user.profile.profileImage = null;
      await user.save();
    }

    res.json({
      message: 'Profile image deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Profile image delete error:', error);
    res.status(500).json({ message: 'Server error during image deletion' });
  }
});

module.exports = router;
