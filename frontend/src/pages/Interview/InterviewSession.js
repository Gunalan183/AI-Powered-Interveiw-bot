import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  Clock, 
  SkipForward,
  CheckCircle,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { 
  startInterview, 
  submitAnswer, 
  completeInterview,
  fetchInterview,
  setCurrentQuestion 
} from '../../store/slices/interviewSlice';
import toast from 'react-hot-toast';

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentInterview, currentQuestion, currentQuestionIndex, isActive, loading } = useSelector(state => state.interview);
  
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchInterview(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentInterview && !isActive) {
      handleStartInterview();
    }
  }, [currentInterview]);

  useEffect(() => {
    if (isActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
      sessionTimerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - Date.now()) / 1000));
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isActive, sessionStartTime]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleStartInterview = async () => {
    try {
      await dispatch(startInterview(id));
      toast.success('Interview started! Good luck!');
    } catch (error) {
      toast.error('Failed to start interview');
    }
  };

  const setupMediaRecording = async () => {
    try {
      const constraints = {
        audio: true,
        video: currentInterview?.type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        // Handle recording stop
      };

    } catch (error) {
      console.error('Error setting up media recording:', error);
      toast.error('Could not access camera/microphone');
    }
  };

  const startRecording = async () => {
    if (!mediaRecorder) {
      await setupMediaRecording();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      setRecordedChunks([]);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() && !recordedChunks.length) {
      toast.error('Please provide an answer');
      return;
    }

    const answerData = {
      questionIndex: currentQuestionIndex,
      answer: answer.trim(),
      duration: recordingTime,
      audioUrl: recordedChunks.length > 0 ? 'recorded_audio_url' : null,
      videoUrl: currentInterview?.type === 'video' && recordedChunks.length > 0 ? 'recorded_video_url' : null
    };

    try {
      const result = await dispatch(submitAnswer({ interviewId: id, answerData }));
      
      if (result.type === 'interview/submitAnswer/fulfilled') {
        setAnswer('');
        setRecordedChunks([]);
        
        if (!result.payload.data.nextQuestion) {
          // Interview completed
          handleCompleteInterview();
        } else {
          toast.success('Answer submitted successfully!');
        }
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < currentInterview?.questions?.length - 1) {
      const nextQuestion = currentInterview.questions[currentQuestionIndex + 1];
      dispatch(setCurrentQuestion({ question: nextQuestion, index: currentQuestionIndex + 1 }));
      setAnswer('');
      setRecordedChunks([]);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      const result = await dispatch(completeInterview(id));
      if (result.type === 'interview/complete/fulfilled') {
        toast.success('Interview completed!');
        navigate(`/results/${id}`);
      }
    } catch (error) {
      toast.error('Failed to complete interview');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (!currentInterview || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / currentInterview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {formatTime(timeElapsed)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {currentInterview.questions.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card mb-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                        {currentQuestion.category}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {currentQuestion.question}
                    </h2>
                  </div>
                  <button
                    onClick={() => speakQuestion(currentQuestion.question)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Listen to question"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Answer Input */}
                {currentInterview.type === 'text' && (
                  <div className="space-y-4">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {answer.length} characters
                      </span>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSkipQuestion}
                          className="btn-secondary flex items-center"
                          disabled={currentQuestionIndex >= currentInterview.questions.length - 1}
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </button>
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={loading || !answer.trim()}
                          className="btn-primary flex items-center disabled:opacity-50"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio/Video Recording */}
                {(currentInterview.type === 'audio' || currentInterview.type === 'video') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      {isRecording ? (
                        <div className="text-center">
                          <div className="animate-pulse bg-red-500 w-4 h-4 rounded-full mx-auto mb-2"></div>
                          <p className="text-lg font-medium text-gray-900">Recording...</p>
                          <p className="text-sm text-gray-600">{formatTime(recordingTime)}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Mic className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-lg font-medium text-gray-900">Ready to record</p>
                          <p className="text-sm text-gray-600">Click start when you're ready to answer</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center"
                        >
                          <Mic className="h-5 w-5 mr-2" />
                          Start Recording
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center"
                        >
                          <MicOff className="h-5 w-5 mr-2" />
                          Stop Recording
                        </button>
                      )}
                    </div>

                    {recordedChunks.length > 0 && !isRecording && (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-800">Recording completed</span>
                        </div>
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={loading}
                          className="btn-primary"
                        >
                          Submit Answer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            {/* Video Preview */}
            {currentInterview.type === 'video' && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h3>
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full rounded-lg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user"
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Live
                  </div>
                </div>
              </div>
            )}

            {/* Interview Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Job Role</p>
                  <p className="font-medium text-gray-900">{currentInterview.jobRole}</p>
                </div>
                {currentInterview.company && (
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium text-gray-900">{currentInterview.company}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900 capitalize">{currentInterview.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-medium text-gray-900 capitalize">{currentInterview.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p>Take your time to think before answering</p>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p>Use the STAR method for behavioral questions</p>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p>Speak clearly and maintain eye contact</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
