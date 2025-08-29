import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { loadUser } from '../../store/slices/authSlice';

const ProfileImageUpload = ({ user, onImageUpdate }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload image
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile image updated successfully!');
      
      // Update user data in Redux store
      dispatch(loadUser());
      
      // Callback to parent component
      if (onImageUpdate) {
        onImageUpdate(response.data.profileImage);
      }

      setPreviewImage(null);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!user?.profile?.profileImage) return;

    if (window.confirm('Are you sure you want to delete your profile image?')) {
      try {
        await api.delete('/upload/profile-image');
        toast.success('Profile image deleted successfully!');
        
        // Update user data in Redux store
        dispatch(loadUser());
        
        // Callback to parent component
        if (onImageUpdate) {
          onImageUpdate(null);
        }
      } catch (error) {
        console.error('Image delete error:', error);
        toast.error(error.response?.data?.message || 'Failed to delete image');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const currentImage = previewImage || user?.profile?.profileImage;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Image Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key="profile-image"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                src={currentImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center bg-primary-100"
              >
                <User className="w-12 h-12 text-primary-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upload Overlay */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={triggerFileInput}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <motion.button
          onClick={triggerFileInput}
          disabled={uploading}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </motion.button>

        {user?.profile?.profileImage && (
          <motion.button
            onClick={handleDeleteImage}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </motion.button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Guidelines */}
      <div className="text-center text-sm text-gray-500 max-w-xs">
        <p>Upload a profile photo to personalize your account.</p>
        <p className="mt-1">JPG, PNG or GIF. Max size 5MB.</p>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
