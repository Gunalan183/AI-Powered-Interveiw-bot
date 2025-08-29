import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const createInterview = createAsyncThunk(
  'interview/create',
  async (interviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/interview/create', interviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const startInterview = createAsyncThunk(
  'interview/start',
  async (interviewId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/interview/${interviewId}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'interview/submitAnswer',
  async ({ interviewId, answerData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/interview/${interviewId}/answer`, answerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const completeInterview = createAsyncThunk(
  'interview/complete',
  async (interviewId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/interview/${interviewId}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchInterview = createAsyncThunk(
  'interview/fetch',
  async (interviewId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/interview/${interviewId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchInterviewHistory = createAsyncThunk(
  'interview/fetchHistory',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/interview?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    currentInterview: null,
    interviewHistory: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    answers: [],
    isActive: false,
    loading: false,
    error: null,
    pagination: null,
  },
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload.question;
      state.currentQuestionIndex = action.payload.index;
    },
    addAnswer: (state, action) => {
      state.answers.push(action.payload);
    },
    resetInterview: (state) => {
      state.currentInterview = null;
      state.currentQuestion = null;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.isActive = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Interview
      .addCase(createInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInterview = action.payload.data;
        state.error = null;
      })
      .addCase(createInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Start Interview
      .addCase(startInterview.pending, (state) => {
        state.loading = true;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.isActive = true;
        state.currentQuestion = action.payload.data.questions[0];
        state.currentQuestionIndex = 0;
        state.error = null;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Answer
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload.data.nextQuestion;
        if (action.payload.data.nextQuestion) {
          state.currentQuestionIndex += 1;
        }
        state.error = null;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete Interview
      .addCase(completeInterview.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.isActive = false;
        state.currentInterview = action.payload.data.interview;
        state.error = null;
      })
      .addCase(completeInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Interview
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.currentInterview = action.payload.data;
      })
      // Fetch History
      .addCase(fetchInterviewHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInterviewHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.interviewHistory = action.payload.data.interviews;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchInterviewHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentQuestion, addAnswer, resetInterview, clearError } = interviewSlice.actions;
export default interviewSlice.reducer;
