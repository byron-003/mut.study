import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolsAPI, searchAPI, resourceAPI } from '../services/api';
import { progressAPI } from '../services/progressAPI';
import { useAuth } from '../utils/authContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import FileViewer from '../components/FileViewer';
import { 
  Search, Upload, FileText, ChevronDown, ChevronRight, 
  Download, Eye, Filter, Calendar, User, BookOpen, 
  Video, Image as ImageIcon, File, X, ExternalLink,
  Clock, CheckCircle, XCircle, AlertCircle, Play, RotateCcw
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Main Data
  const [userProgram, setUserProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourceProgress, setResourceProgress] = useState({}); // Store progress for all resources
  
  // UI State
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadsEnabled, setDownloadsEnabled] = useState(false); // Track if downloads are enabled by admin
  
  // File Viewer State
  const [showViewer, setShowViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  
  // Progress Tracking State
  const [currentProgress, setCurrentProgress] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

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
      
      alert('Resource marked as complete! 🎉');
    } catch (error) {
      console.error('Error marking as complete:', error);
      alert('Failed to mark as complete');
    }
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProgram) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Program Not Found</h2>
          <p className="text-gray-600 mb-4">
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
    <div className="min-h-screen bg-gray-50">
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
            <button
              onClick={() => navigate('/my-uploads')}
              className="bg-white text-mut-primary px-4 py-2 rounded-lg hover:bg-green-50 flex items-center gap-2 font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Resources
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title or description..."
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
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

        {/* Quick Period Info & Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-mut-primary" />
                <span className="text-sm font-medium text-gray-700">Viewing:</span>
                <span className="px-3 py-1 bg-mut-primary text-white rounded-full text-sm font-medium">
                  Year {selectedYear} • Semester {selectedSemester}
                </span>
              </div>
              {user.currentYear && user.currentSemester && (
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-mut-primary hover:text-green-700 font-medium"
                >
                  Change Period →
                </button>
              )}
            </div>
            
            {/* Resource Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-sm"
            >
              <option value="all">All Resources</option>
              <option value="notes">Lecture Notes</option>
              <option value="assignment">Assignments</option>
              <option value="pastpaper">Past Papers</option>
              <option value="video">Video Lectures</option>
            </select>
          </div>
        </div>

        {/* Main Content - Courses and Resources */}
        <div>
          {courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Courses Available
                </h3>
                <p className="text-gray-500">
                  There are no courses for Year {selectedYear}, Semester {selectedSemester} yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => {
                  const courseResources = getResourcesForCourse(course.id);
                  
                  return (
                    <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Course Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {course.unitCode} - {course.unitTitle}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                                {course.credits} Credits
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {courseResources.length} Resources
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="text-mut-primary hover:text-green-700 flex items-center gap-1 text-sm font-medium"
                          >
                            View Details
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Resources List */}
                      <div className="p-6">
                        {courseResources.length === 0 ? (
                          <div className="text-center py-8">
                            <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                              No resources available for this course yet.
                            </p>
                            <button
                              onClick={() => navigate('/my-uploads')}
                              className="mt-3 text-mut-primary hover:text-green-700 text-sm font-medium"
                            >
                              Be the first to upload
                            </button>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courseResources.map((resource) => {
                              const progress = resourceProgress[resource.id];
                              const hasProgress = progress && progress.progress > 0;
                              const isCompleted = progress && progress.completed;
                              
                              return (
                              <div
                                key={resource.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-mut-primary hover:shadow-md transition-all relative"
                              >
                                {/* Completion Badge */}
                                {isCompleted && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                  <div className={`p-2 rounded-lg ${getFileTypeColor(resource.type)}`}>
                                    {getFileIcon(resource.type)}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${getFileTypeColor(resource.type)}`}>
                                    {getResourceTypeLabel(resource.type)}
                                  </span>
                                </div>

                                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {resource.title}
                                </h4>

                                {resource.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {resource.description}
                                  </p>
                                )}

                                {/* Progress Bar */}
                                {hasProgress && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-gray-600">Your Progress</span>
                                      <span className="font-semibold text-mut-primary">
                                        {progress.progress}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          isCompleted ? 'bg-green-500' : 'bg-mut-primary'
                                        }`}
                                        style={{ width: `${progress.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                  <User className="w-3 h-3" />
                                  <span>{resource.uploadedBy?.name || 'Anonymous'}</span>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                  {resource.status && resource.status !== 'approved' && (
                                    <>
                                      <span>•</span>
                                      <span className={`
                                        px-2 py-0.5 rounded text-xs font-medium
                                        ${resource.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                                        ${resource.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                                      `}>
                                        {resource.status === 'pending' && 'Pending Review'}
                                        {resource.status === 'rejected' && 'Rejected'}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewFile(resource)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                                      hasProgress
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-mut-primary hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {hasProgress ? (
                                      <>
                                        <BookOpen className="w-4 h-4" />
                                        {isCompleted ? 'Read Again' : 'Continue Reading'}
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="w-4 h-4" />
                                        Read
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )})}
                          </div>
                        )}
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
                <span className="text-sm text-gray-600">Progress:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {savedProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-mut-primary h-2 rounded-full transition-all"
                  style={{ width: `${savedProgress.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
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
    </div>
  );
};

export default DashboardPage;
