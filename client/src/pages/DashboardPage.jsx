import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolsAPI, searchAPI, resourceAPI, aiAPI, authAPI } from '../services/api';
import { progressAPI } from '../services/progressAPI';
import { useAuth } from '../utils/authContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import FileViewer from '../components/FileViewer';
import AddCourseModal from '../components/AddCourseModal';
import { useAlert } from '../hooks/useAlert';
import { useConfirm } from '../hooks/useConfirm.jsx';
import CustomAlert from '../components/CustomAlert';
import { 
  Search, Upload, FileText, ChevronDown, ChevronRight, 
  Download, Eye, Filter, Calendar, User, BookOpen, 
  Video, Image as ImageIcon, File, X, ExternalLink,
  Clock, CheckCircle, XCircle, AlertCircle, Play, RotateCcw, Plus
} from 'lucide-react';

// Helper function to get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed
  
  // Academic year typically starts in September (month 9)
  // If we're in Jan-Aug, we're in the second half of the academic year
  if (currentMonth < 9) {
    return `${currentYear - 1}/${currentYear}`;
  } else {
    return `${currentYear}/${currentYear + 1}`;
  }
};

// Generate list of valid academic years (current and past 5 years)
const getAcademicYearOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Determine the current academic year
  const startYear = currentMonth < 9 ? currentYear - 1 : currentYear;
  
  const years = [];
  for (let i = 0; i <= 5; i++) {
    const year = startYear - i;
    years.push(`${year}/${year + 1}`);
  }
  
  return years;
};

const DashboardPage = () => {
  const { user, isClassRep } = useAuth();
  const navigate = useNavigate();
  const { alertState, showAlert, closeAlert } = useAlert();
  const [ConfirmDialog, confirm] = useConfirm();
  
  // Main Data
  const [userProgram, setUserProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourceProgress, setResourceProgress] = useState({}); // Store progress for all resources
  
  // UI State - Filters
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getCurrentAcademicYear());
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadsEnabled, setDownloadsEnabled] = useState(false); // Track if downloads are enabled by admin
  const [showFilters, setShowFilters] = useState(false); // Filter modal state
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false); // Add Course modal state
  
  // File Viewer State
  const [showViewer, setShowViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  
  // Progress Tracking State
  const [currentProgress, setCurrentProgress] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  
  // AI Summarization State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [advancedFeaturesEnabled, setAdvancedFeaturesEnabled] = useState(false);

  useEffect(() => {
    if (user && user.programId) {
      fetchUserProgram();
    }
  }, [user]);

  // Fetch downloads enabled status
  useEffect(() => {
    const fetchDownloadsStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/downloads-enabled`);
        const data = await response.json();
        setDownloadsEnabled(data.data.downloads_enabled);
      } catch (error) {
        console.error('Error fetching downloads status:', error);
        setDownloadsEnabled(false); // Default to disabled on error
      }
    };
    fetchDownloadsStatus();
  }, []);

  useEffect(() => {
    if (userProgram) {
      // Use user's saved year/semester or default to Year 1, Semester 1
      const year = user?.currentYear || 1;
      const semester = user?.currentSemester || 1;
      setSelectedYear(year);
      setSelectedSemester(semester);
    }
  }, [userProgram, user]);

  useEffect(() => {
    if (userProgram && selectedYear && selectedSemester) {
      loadCoursesAndResources();
    }
  }, [userProgram, selectedYear, selectedSemester]);

  const fetchUserProgram = async () => {
    try {
      setLoading(true);
      const response = await schoolsAPI.getProgramById(user.programId);
      setUserProgram(response.data.data);
    } catch (error) {
      console.error('Error fetching user program:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndResources = async () => {
    if (!userProgram || !userProgram.courses) return;

    try {
      // Get courses for selected year and semester
      const yearCourses = userProgram.courses[selectedYear];
      if (yearCourses) {
        const semesterKey = `semester${selectedSemester}`;
        const currentCourses = yearCourses[semesterKey] || [];
        setCourses(currentCourses);
        
        // Fetch resources for each course
        if (currentCourses.length > 0) {
          const allResources = await Promise.all(
            currentCourses.map(async (course) => {
              try {
                const res = await resourceAPI.getResourcesByCourse(course.id);
                return {
                  courseId: course.id,
                  resources: res.data.data || []
                };
              } catch (error) {
                console.error(`Error fetching resources for course ${course.id}:`, error);
                return { courseId: course.id, resources: [] };
              }
            })
          );
          setResources(allResources);

          // Load progress for all resources
          await loadResourceProgress(allResources);
        } else {
          setResources([]);
          setResourceProgress({});
        }
      } else {
        setCourses([]);
        setResources([]);
        setResourceProgress({});
      }
    } catch (error) {
      console.error('Error loading courses and resources:', error);
    }
  };

  // Load progress for all resources
  const loadResourceProgress = async (allResources) => {
    try {
      const progressMap = {};
      
      // Get all resource IDs
      const resourceIds = [];
      allResources.forEach(courseRes => {
        courseRes.resources.forEach(res => {
          resourceIds.push(res.id);
        });
      });

      // Fetch progress for each resource
      await Promise.all(
        resourceIds.map(async (resourceId) => {
          try {
            const response = await progressAPI.getProgress(resourceId);
            if (response.data.data) {
              progressMap[resourceId] = response.data.data;
            }
          } catch (error) {
            // Ignore errors for individual resources
            console.debug(`No progress for resource ${resourceId}`);
          }
        })
      );

      setResourceProgress(progressMap);
    } catch (error) {
      console.error('Error loading resource progress:', error);
    }
  };

  // Refresh resources for a specific course
  const refreshCourseResources = useCallback(async (courseId) => {
    try {
      const res = await resourceAPI.getResourcesByCourse(courseId);
      setResources(prev => {
        const updated = [...prev];
        const index = updated.findIndex(r => r.courseId === courseId);
        if (index >= 0) {
          updated[index] = {
            courseId: courseId,
            resources: res.data.data || []
          };
        } else {
          updated.push({
            courseId: courseId,
            resources: res.data.data || []
          });
        }
        return updated;
      });
    } catch (error) {
      console.error(`Error refreshing resources for course ${courseId}:`, error);
    }
  }, []);

  // Add new resource to the list in real-time
  const addResourceToList = useCallback((newResource) => {
    setResources(prev => {
      const updated = [...prev];
      const courseIndex = updated.findIndex(r => r.courseId === newResource.courseId);
      
      if (courseIndex >= 0) {
        // Check if resource already exists
        const exists = updated[courseIndex].resources.some(r => r.id === newResource.id);
        if (!exists) {
          updated[courseIndex] = {
            ...updated[courseIndex],
            resources: [newResource, ...updated[courseIndex].resources]
          };
        }
      }
      
      return updated;
    });
  }, []);

  // Update existing resource in the list
  const updateResourceInList = useCallback((updatedResource) => {
    setResources(prev => {
      const updated = [...prev];
      const courseIndex = updated.findIndex(r => 
        r.resources.some(res => res.id === updatedResource.id)
      );
      
      if (courseIndex >= 0) {
        updated[courseIndex] = {
          ...updated[courseIndex],
          resources: updated[courseIndex].resources.map(r =>
            r.id === updatedResource.id ? { ...r, ...updatedResource } : r
          )
        };
      }
      
      return updated;
    });
  }, []);

  // Join course rooms for real-time updates
  const { joinRoom, leaveRoom, isConnected } = useSocket();
  
  useEffect(() => {
    if (!isConnected || courses.length === 0) return;

    // Join all course rooms
    courses.forEach(course => {
      joinRoom('course', course.id);
    });

    // Cleanup: leave all rooms on unmount or when courses change
    return () => {
      courses.forEach(course => {
        leaveRoom('course', course.id);
      });
    };
  }, [courses, isConnected, joinRoom, leaveRoom]);

  // Listen for resource uploaded event
  useSocketEvent('resource:uploaded', (data) => {
    console.log('📥 Real-time: Resource uploaded', data);
    if (data.courseId) {
      refreshCourseResources(data.courseId);
    }
  }, [refreshCourseResources]);

  // Listen for resource approved event
  useSocketEvent('resource:approved', (data) => {
    console.log('✅ Real-time: Resource approved', data);
    updateResourceInList({ ...data, status: 'approved' });
    
    // Reload progress for this resource
    if (data.id) {
      progressAPI.getProgress(data.id)
        .then(response => {
          if (response.data.data) {
            setResourceProgress(prev => ({
              ...prev,
              [data.id]: response.data.data
            }));
          }
        })
        .catch(err => console.debug('No progress for newly approved resource'));
    }
  }, [updateResourceInList]);

  // Listen for resource rejected event (only for own uploads)
  useSocketEvent('resource:rejected', (data) => {
    console.log('❌ Real-time: Resource rejected', data);
    updateResourceInList({ ...data, status: 'rejected' });
  }, [updateResourceInList]);

  const getResourcesForCourse = (courseId) => {
    const courseResources = resources.find(r => r.courseId === courseId);
    if (!courseResources) return [];
    
    // Show approved resources OR user's own uploads (regardless of status)
    let filtered = courseResources.resources.filter(r => 
      r.status === 'approved' || r.isOwnUpload
    );
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const handleViewFile = async (resource) => {
    try {
      // Load progress for this resource
      const progressResponse = await progressAPI.getProgress(resource.id);
      const progressData = progressResponse.data.data;
      
      if (progressData && progressData.progress > 0 && progressData.progress < 100) {
        // Show resume prompt if there's partial progress
        setSavedProgress(progressData);
        setShowResumePrompt(true);
        setViewerFile(resource);
      } else {
        // No progress or completed, start fresh
        openViewer(resource, null);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      // If error loading progress, just open normally
      openViewer(resource, null);
    }
  };

  const openViewer = (resource, resumePosition) => {
    setViewerFile(resource);
    setShowViewer(true);
    setSessionStartTime(Date.now());
    
    if (resumePosition) {
      setScrollPosition(resumePosition);
    } else {
      setScrollPosition(0);
    }
  };

  const handleResumeFromSaved = () => {
    if (savedProgress && viewerFile) {
      openViewer(viewerFile, savedProgress.lastPosition);
      setCurrentProgress(savedProgress);
    }
    setShowResumePrompt(false);
  };

  const handleStartFromBeginning = () => {
    if (viewerFile) {
      openViewer(viewerFile, null);
      setCurrentProgress(null);
    }
    setShowResumePrompt(false);
  };

  const closeViewer = async () => {
    // Save progress before closing (if not already at 100%)
    if (viewerFile && sessionStartTime) {
      const currentProgressValue = resourceProgress[viewerFile.id]?.progress || 0;
      
      if (currentProgressValue < 100) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // Calculate progress using smart formula (caps at 95%)
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
    setScrollPosition(0);
    setCurrentProgress(null);
    setSavedProgress(null);
  };

  const saveProgress = async (resourceId, progressPercentage, additionalTime = 0) => {
    try {
      const timeSpent = sessionStartTime 
        ? Math.floor((Date.now() - sessionStartTime) / 1000) + additionalTime
        : additionalTime;

      // Cap at 100%
      const finalProgress = Math.min(progressPercentage, 100);

      const response = await progressAPI.updateProgress(resourceId, {
        progressPercentage: finalProgress,
        lastPosition: finalProgress.toString(),
        timeSpent
      });

      // Update local progress state
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

  // Calculate progress based on time spent (never auto-completes to 100%)
  const calculateProgress = (timeSpentInSeconds, currentProgress = 0) => {
    // Logarithmic growth: fast at first, then slower
    // Formula: 95 * (1 - e^(-timeSpent/600))
    // This gives smooth progression that caps at 95%
    
    const maxAutoProgress = 95; // Never auto-complete to 100%
    
    // Use logarithmic formula for gradual increase
    // 600 seconds (10 minutes) gets you to about 50%
    // 20 minutes gets you to about 70%
    // 40 minutes gets you to about 85%
    const calculatedProgress = maxAutoProgress * (1 - Math.exp(-timeSpentInSeconds / 600));
    
    // Round to nearest integer
    const newProgress = Math.floor(calculatedProgress);
    
    // Never decrease progress
    return Math.max(currentProgress, newProgress);
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

  // Handle AI Summarization
  const handleSummarize = async () => {
    if (!viewerFile) return;
    
    try {
      setIsSummarizing(true);
      console.log('📄 ===== SUMMARIZATION START =====');
      console.log('📄 viewerFile object:', viewerFile);
      console.log('📄 File ID:', viewerFile.id);
      console.log('📄 File title:', viewerFile.title);
      console.log('📄 File type:', viewerFile.fileType || viewerFile.file_type);
      console.log('📎 fileUrl:', viewerFile.fileUrl);
      console.log('📎 file_url:', viewerFile.file_url);
      console.log('📎 All keys:', Object.keys(viewerFile));
      console.log('📄 ================================');
      
      // Use fileUrl (camelCase) or file_url (snake_case), whichever is available
      const fileUrl = viewerFile.fileUrl || viewerFile.file_url || viewerFile.file_path || viewerFile.url;
      
      if (!fileUrl) {
        showAlert('Error', 'File URL not found. Cannot generate summary.', 'error');
        return;
      }
      
      const response = await aiAPI.summarizeResource(viewerFile.id, fileUrl);
      
      if (response.data.success) {
        const summary = response.data.data.summary;
        const isNew = response.data.data.isNew;
        
        // Show summary in alert with View button
        showAlert(
          isNew ? 'Summary Generated!' : 'Existing Summary',
          `${isNew ? 'AI has generated a summary for this resource.' : 'Using your recent summary from the last 24 hours.'}`,
          'success',
          {
            showViewButton: true,
            viewButtonText: 'View Summaries',
            onView: () => {
              navigate('/summary-history');
            }
          }
        );
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate summary';
      
      if (errorMessage.includes('not enabled')) {
        showAlert('Feature Not Enabled', 'Please enable Advanced Features in Settings to use AI Summarization.', 'warning');
      } else {
        showAlert('Error', errorMessage, 'error');
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  // Fetch advanced features status
  useEffect(() => {
    const fetchAdvancedFeatures = async () => {
      try {
        const response = await authAPI.getSettings();
        const isEnabled = response.data.data.advancedFeaturesEnabled || false;
        setAdvancedFeaturesEnabled(isEnabled);
        console.log('✨ Advanced features status:', isEnabled);
      } catch (error) {
        console.error('Error fetching advanced features status:', error);
        setAdvancedFeaturesEnabled(false);
      }
    };
    
    if (user) {
      fetchAdvancedFeatures();
    }
  }, [user]);

  // Re-fetch advanced features when opening viewer (to catch any changes)
  useEffect(() => {
    const refetchAdvancedFeatures = async () => {
      if (!showViewer || !user) return;
      
      try {
        const response = await authAPI.getSettings();
        const isEnabled = response.data.data.advancedFeaturesEnabled || false;
        setAdvancedFeaturesEnabled(isEnabled);
        console.log('🔄 Refreshed advanced features status:', isEnabled);
      } catch (error) {
        console.error('Error refreshing advanced features:', error);
      }
    };
    
    refetchAdvancedFeatures();
  }, [showViewer, user]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!showViewer || !viewerFile || !sessionStartTime) return;

    const interval = setInterval(() => {
      const currentProgressValue = resourceProgress[viewerFile.id]?.progress || 0;
      
      // Only auto-save if not already at 100%
      if (currentProgressValue < 100) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // Calculate progress using smart formula (caps at 95%)
        const newProgress = calculateProgress(timeSpent, currentProgressValue);
        
        saveProgress(viewerFile.id, newProgress);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [showViewer, viewerFile, sessionStartTime, resourceProgress]);

  const handleDownloadFile = async (resource) => {
    try {
      // Extract filename from URL or use title
      const urlParts = resource.fileUrl.split('/');
      const cloudinaryFilename = urlParts[urlParts.length - 1];
      
      // Get original extension from file type or URL
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
      
      // If no extension from MIME type, try to get from URL
      if (!extension) {
        const urlMatch = cloudinaryFilename.match(/\.([a-zA-Z0-9]+)$/);
        if (urlMatch) {
          extension = urlMatch[1];
        }
      }
      
      // Create a sanitized filename
      const sanitizedTitle = resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = extension ? `${sanitizedTitle}.${extension}` : sanitizedTitle;
      
      // Fetch the file and trigger download
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
      // Fallback to opening in new tab
      window.open(resource.fileUrl, '_blank');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'notes': return <BookOpen className="w-5 h-5" />;
      case 'assignment': return <FileText className="w-5 h-5" />;
      case 'pastpaper': return <File className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'notes': return 'bg-blue-100 text-blue-700';
      case 'assignment': return 'bg-orange-100 text-orange-700';
      case 'pastpaper': return 'bg-purple-100 text-purple-700';
      case 'video': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getResourceTypeLabel = (type) => {
    const labels = {
      notes: 'Lecture Notes',
      assignment: 'Assignment',
      pastpaper: 'Past Paper',
      video: 'Video Lecture',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProgram) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Program Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't load your program information. Please update your profile.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-mut-primary text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Program Info */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{userProgram.name}</h1>
              <div className="flex items-center gap-3 text-sm text-green-100">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {user.name}
                </span>
                <span>•</span>
                <span>{userProgram.code}</span>
                <span>•</span>
                <span>{userProgram.level}</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by name or code..."
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Banner to remind user to set year/semester */}
        {(!user.currentYear || !user.currentSemester) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-yellow-900 mb-1">
                  Complete Your Academic Settings
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You haven't set your current year and semester yet. Update your settings to see personalized courses for your current academic period.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Update Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Filters</span>
              {(filterType !== 'all' || selectedYear !== 1 || selectedSemester !== 1) && (
                <span className="ml-1 px-2 py-0.5 bg-mut-primary text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
            
            {/* Add Course Button for Class Reps */}
            {isClassRep && (
              <button
                onClick={() => setAddCourseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-mut-primary text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Course</span>
              </button>
            )}
          </div>
          
          {/* Active Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterType !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                {filterType}
                <button onClick={() => setFilterType('all')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        <div>
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Courses Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no courses for Year {selectedYear}, Semester {selectedSemester} yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const courseResources = getResourcesForCourse(course.id);
                const resourceCount = courseResources.length;
                
                // Count new resources (uploaded in last 7 days and not yet viewed by user)
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const newResourceCount = courseResources.filter(resource => {
                  const createdDate = new Date(resource.createdAt);
                  const hasProgress = resourceProgress[resource.id];
                  return createdDate > sevenDaysAgo && !hasProgress;
                }).length;
                
                // Calculate overall course progress
                let totalProgress = 0;
                let resourcesWithProgress = 0;
                courseResources.forEach(resource => {
                  const progress = resourceProgress[resource.id];
                  if (progress && progress.progress > 0) {
                    totalProgress += progress.progress;
                    resourcesWithProgress++;
                  }
                });
                const overallProgress = resourcesWithProgress > 0 
                  ? Math.floor(totalProgress / resourceCount) 
                  : 0;
                
                // Get most recent resource activity
                const sortedResources = [...courseResources].sort((a, b) => 
                  new Date(b.createdAt) - new Date(a.createdAt)
                );
                const latestResource = sortedResources[0];
                const getTimeAgo = (date) => {
                  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                  if (seconds < 60) return 'Just now';
                  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
                  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
                  return `${Math.floor(seconds / 86400)} days ago`;
                };
                
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-green-600 p-6">
                      <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                        {course.unitTitle}
                      </h3>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded">
                        {course.unitCode}
                      </span>
                    </div>

                    {/* White Body */}
                    <div className="p-6 bg-white dark:bg-gray-800">
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Course progress bar</span>
                          <span className="text-gray-900 dark:text-white font-bold">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
                            style={{ width: `${overallProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <BookOpen className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">{course.credits} Credits</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">
                            {resourceCount} Resources Available
                            {newResourceCount > 0 && (
                              <span className="ml-1 text-orange-600 font-bold">
                                ({newResourceCount} new)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="w-full bg-teal-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-teal-200 transition-colors flex items-center justify-center gap-2 font-semibold mb-4"
                      >
                        View Details
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Recent Activity */}
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h4>
                        {latestResource ? (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 mt-0.5 text-gray-400" />
                            <span>
                              Last Resource added: {getTimeAgo(latestResource.createdAt)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No recent activity</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {showViewer && viewerFile && (
        <FileViewer
          file={viewerFile}
          onClose={closeViewer}
          onDownload={() => handleDownloadFile(viewerFile)}
          onMarkComplete={markAsComplete}
          onSummarize={handleSummarize}
          advancedFeaturesEnabled={advancedFeaturesEnabled}
          isSummarizing={isSummarizing}
          downloadsEnabled={downloadsEnabled}
        />
      )}

      {/* Resume Prompt Modal */}
      {showResumePrompt && savedProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Continue Reading?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">You've already started this resource</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {savedProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-mut-primary h-2 rounded-full transition-all"
                  style={{ width: `${savedProgress.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
                  >
                    {getAcademicYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
                  >
                    <option value="all">All Types</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="assignment">Assignments</option>
                    <option value="pastpaper">Past Papers</option>
                    <option value="video">Videos</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedYear(1);
                    setSelectedSemester(1);
                    setSelectedAcademicYear(getCurrentAcademicYear());
                    setFilterType('all');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-3 bg-mut-primary text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal (Class Reps Only) */}
      <AddCourseModal
        isOpen={addCourseModalOpen}
        onClose={() => setAddCourseModalOpen(false)}
        onSuccess={() => {
          setAddCourseModalOpen(false);
          // Refresh courses after adding
          if (userProgram) {
            fetchCourses(userProgram.id);
          }
        }}
      />
      
      <CustomAlert {...alertState} onClose={closeAlert} />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default DashboardPage;
