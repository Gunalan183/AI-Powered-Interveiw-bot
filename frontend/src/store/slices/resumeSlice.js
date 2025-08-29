import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchResumeAnalysis = createAsyncThunk(
  'resume/fetchAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/resume/analysis');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deleteResume = createAsyncThunk(
  'resume/delete',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/resume');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    resumeData: null,
    analysis: null,
    uploadProgress: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetResume: (state) => {
      state.resumeData = null;
      state.analysis = null;
      state.uploadProgress = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Resume
      .addCase(uploadResume.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resumeData = action.payload.data;
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      })
      // Fetch Analysis
      .addCase(fetchResumeAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchResumeAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.analysis = action.payload.data;
        state.resumeData = action.payload.data.resumeData;
      })
      .addCase(fetchResumeAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Resume
      .addCase(deleteResume.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteResume.fulfilled, (state) => {
        state.loading = false;
        state.resumeData = null;
        state.analysis = null;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUploadProgress, clearError, resetResume } = resumeSlice.actions;
export default resumeSlice.reducer;
