import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schoolsAPI, resourcesAPI } from '../services/api';
import { progressAPI } from '../services/progressAPI';
import { useAuth } from '../utils/authContext';
import FileViewer from '../components/FileViewer';
import UploadModal from '../components/UploadModal';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import { 
  BookOpen, FileText, Download, Eye, Clock, CheckCircle, 
  User, ChevronRight, Play, RotateCcw, X, AlertCircle,
  Video, Image as ImageIcon, File, Plus
} from 'lucide-react';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isClassRep } = useAuth();
  const { alertState, showAlert, closeAlert } = useAlert();
  const [course, setCourse] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  
  // Category tabs
  const [activeCategory, setActiveCategory] = useState('all');
  const categories = [
    { id: 'all', label: 'All Resources', icon: BookOpen },
    { id: 'notes', label: 'Lecture Notes', icon: BookOpen },
    { id: 'assignment', label: 'Assignments', icon: FileText },
    { id: 'cat', label: 'CATs', icon: FileText },
    { id: 'practical', label: 'Practicals', icon: File }
  ];
  
  // Progress tracking
  const [resourceProgress, setResourceProgress] = useState({});
  
  // File Viewer
  const [showViewer, setShowViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    fetchResources();
  }, [id]);

  // Fetch downloads enabled status
  useEffect(() => {
    const fetchDownloadsStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/downloads-enabled`);
        const data = await response.json();
        setDownloadsEnabled(data.data.downloads_enabled);
      } catch (error) {
        console.error('Error fetching downloads status:', error);
        setDownloadsEnabled(false);
      }
    };
    fetchDownloadsStatus();
  }, []);

  const fetchCourseDetails = async () => {
    try {
      const response = await schoolsAPI.getCourseById(id);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    setResourcesLoading(true);
    try {
      const response = await resourcesAPI.getResourcesByCourse(id);
      const resourcesData = response.data.data || [];
      setResources(resourcesData);
      
      // Load progress for resources
      if (resourcesData.length > 0) {
        loadResourceProgress(resourcesData);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadResourceProgress = async (resources) => {
    try {
      const progressMap = {};
      await Promise.all(
        resources.map(async (resource) => {
          try {
            const response = await progressAPI.getProgress(resource.id);
            if (response.data.data) {
              progressMap[resource.id] = response.data.data;
            }
          } catch (error) {
            console.debug(`No progress for resource ${resource.id}`);
          }
        })
      );
      setResourceProgress(progressMap);
    } catch (error) {
      console.error('Error loading resource progress:', error);
    }
  };

  const handleUploadSuccess = () => {
    fetchResources(); // Refresh the resource list
  };

  // Progress tracking functions
  const calculateProgress = (timeSpentInSeconds, currentProgress = 0) => {
    const maxAutoProgress = 95;
    const calculatedProgress = maxAutoProgress * (1 - Math.exp(-timeSpentInSeconds / 600));
    const newProgress = Math.floor(calculatedProgress);
    return Math.max(currentProgress, newProgress);
  };

  const saveProgress = async (resourceId, progressPercentage, additionalTime = 0) => {
    try {
      const timeSpent = sessionStartTime 
        ? Math.floor((Date.now() - sessionStartTime) / 1000) + additionalTime
        : additionalTime;

      const finalProgress = Math.min(progressPercentage, 100);

      const response = await progressAPI.updateProgress(resourceId, {
        progressPercentage: finalProgress,
        lastPosition: finalProgress.toString(),
        timeSpent
      });

      if (response.data.data) {
        setResourceProgress(prev => ({
          ...prev,
          [resourceId]: response.data.data
        }));
      }

      console.log('📊 Progress saved:', { resourceId, progress: finalProgress, timeSpent });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const markAsComplete = async () => {
    if (!viewerFile) return;
    
    try {
      const timeSpent = sessionStartTime 
        ? Math.floor((Date.now() - sessionStartTime) / 1000)
        : 0;

      await saveProgress(viewerFile.id, 100, timeSpent);
      showAlert('Success', 'Resource marked as complete! 🎉', 'success');
    } catch (error) {
      console.error('Error marking as complete:', error);
      showAlert('Error', 'Failed to mark as complete', 'error');
    }
  };

  const handleViewFile = async (resource) => {
    try {
      const progressResponse = await progressAPI.getProgress(resource.id);
      const progressData = progressResponse.data.data;
      
      if (progressData && progressData.progress > 0 && progressData.progress < 100) {
        setSavedProgress(progressData);
        setShowResumePrompt(true);
        setViewerFile(resource);
      } else {
        openViewer(resource);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      openViewer(resource);
    }
  };

  const openViewer = (resource) => {
    setViewerFile(resource);
    setShowViewer(true);
    setSessionStartTime(Date.now());
  };

  const closeViewer = async () => {
    if (viewerFile && sessionStartTime) {
      const currentProgressValue = resourceProgress[viewerFile.id]?.progress || 0;
      
      if (currentProgressValue < 100) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
        const newProgress = calculateProgress(timeSpent, currentProgressValue);
        
        try {
          await saveProgress(viewerFile.id, newProgress, timeSpent);
        } catch (error) {
          console.error('Error saving progress on close:', error);
        }
      }
    }
    
    setShowViewer(false);
    setViewerFile(null);
    setSessionStartTime(null);
    setSavedProgress(null);
  };

  const handleResumeFromSaved = () => {
    if (savedProgress && viewerFile) {
      openViewer(viewerFile);
    }
    setShowResumePrompt(false);
  };

  const handleStartFromBeginning = () => {
    if (viewerFile) {
      openViewer(viewerFile);
    }
    setShowResumePrompt(false);
  };

  const handleDownloadFile = async (resource) => {
    try {
      const urlParts = resource.fileUrl.split('/');
      const cloudinaryFilename = urlParts[urlParts.length - 1];
      
      let extension = '';
      if (resource.fileType) {
        const mimeToExt = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.ms-powerpoint': 'ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'video/mp4': 'mp4',
          'video/webm': 'webm',
          'text/plain': 'txt'
        };
        extension = mimeToExt[resource.fileType] || '';
      }
      
      const sanitizedTitle = resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = extension ? `${sanitizedTitle}.${extension}` : sanitizedTitle;
      
      const response = await fetch(resource.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      window.open(resource.fileUrl, '_blank');
    }
  };

  // Helper functions
  const getFileIcon = (type) => {
    const icons = {
      notes: BookOpen,
      assignment: FileText,
      cat: FileText,
      practical: File,
      pastpaper: File,
      video: Video,
      other: File
    };
    return icons[type] || File;
  };

  const getFileTypeColor = (type) => {
    const colors = {
      notes: 'bg-blue-100 text-blue-700',
      assignment: 'bg-orange-100 text-orange-700',
      cat: 'bg-red-100 text-red-700',
      practical: 'bg-green-100 text-green-700',
      pastpaper: 'bg-purple-100 text-purple-700',
      video: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  const getResourceTypeLabel = (type) => {
    const labels = {
      notes: 'Lecture Notes',
      assignment: 'Assignment',
      pastpaper: 'Past Paper',
      video: 'Video Lecture',
      cat: 'CAT',
      practical: 'Practical',
      other: 'Other'
    };
    return labels[type] || type;
  };

  // Filter resources by active category
  const filteredResources = activeCategory === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <Link to="/" className="text-mut-primary hover:underline mt-4 inline-block">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Link to="/" className="text-gray-500 hover:text-mut-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <span className="px-3 py-1 bg-mut-primary text-white text-sm font-medium rounded">
                  {course.unitCode}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.unitTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span>Year {course.academicYear}, Semester {course.semester}</span>
                <span>•</span>
                <span>{course.credits} Credits</span>
                <span>•</span>
                <Link
                  to={`/program/${course.program.id}`}
                  className="text-mut-primary hover:underline"
                >
                  {course.program.name}
                </Link>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {course.department} • {course.school}
              </div>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="w-12 h-12 bg-mut-primary text-white rounded-full hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                title="Upload Resource"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const count = category.id === 'all' 
                ? resources.length 
                : resources.filter(r => r.type === category.id).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? 'bg-mut-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resources Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resourcesLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const progress = resourceProgress[resource.id];
              const hasProgress = progress && progress.progress > 0;
              const isCompleted = progress && progress.completed;
              const TypeIcon = getFileIcon(resource.type);
              
              return (
                <div
                  key={resource.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-mut-primary hover:shadow-lg transition-all relative"
                >
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}

                  {/* Type Badge and Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getFileTypeColor(resource.type)}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getFileTypeColor(resource.type)}`}>
                      {getResourceTypeLabel(resource.type)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                    {resource.title}
                  </h4>

                  {/* Description */}
                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  {hasProgress && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">Your Progress</span>
                        <span className="font-bold text-mut-primary">
                          {progress.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-mut-primary'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    {resource.downloads > 0 && (
                      <>
                        <span>•</span>
                        <Download className="w-3 h-3" />
                        <span>{resource.downloads}</span>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleViewFile(resource)}
                    className={`w-full px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      hasProgress
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-mut-primary hover:bg-green-700 text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {isCompleted ? 'Read Again' : hasProgress ? 'Continue Reading' : 'Read'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <File className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeCategory === 'all' 
                ? 'No Resources Available' 
                : `No ${categories.find(c => c.id === activeCategory)?.label || 'Resources'} Available`}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeCategory === 'all'
                ? 'Be the first to contribute resources for this course!'
                : `No ${categories.find(c => c.id === activeCategory)?.label.toLowerCase()} have been uploaded yet.`}
            </p>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {showViewer && viewerFile && (
        <FileViewer
          file={viewerFile}
          onClose={closeViewer}
          onDownload={() => handleDownloadFile(viewerFile)}
          onMarkComplete={markAsComplete}
          downloadsEnabled={downloadsEnabled}
        />
      )}

      {/* Resume Prompt Modal */}
      {showResumePrompt && savedProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Continue Reading?</h3>
                <p className="text-sm text-gray-600">You've already started this resource</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-lg font-bold text-mut-primary">{savedProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-mut-primary"
                  style={{ width: `${savedProgress.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Last accessed: {new Date(savedProgress.lastAccessed).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResumeFromSaved}
                className="flex-1 bg-mut-primary text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume ({savedProgress.progress}%)
              </button>
              <button
                onClick={handleStartFromBeginning}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Resource Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        courseId={id}
        onSuccess={handleUploadSuccess}
      />
      
      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default CoursePage;
