import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/authContext';
import { resourcesAPI, schoolsAPI } from '../services/api';
import { 
  Upload, FileText, Trash2, Edit, Eye, Download, 
  Filter, Search, X, Plus, Save, AlertCircle,
  Clock, CheckCircle, XCircle, Book, File, Video,
  ImageIcon, BookOpen, Calendar
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

const MyUploadsPage = () => {
  const { user } = useAuth();
  
  // Data State
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [filterType, setFilterType] = useState('all'); // all, notes, assignment, pastpaper, video
  
  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  
  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'notes',
    unitCode: '',
    unitName: '',
    yearOfStudy: '1',
    semester: '1',
    academicYear: getCurrentAcademicYear(),
    file: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'notes'
  });

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const fetchMyUploads = async () => {
    try {
      setLoading(true);
      const response = await resourcesAPI.getMyUploads();
      setUploads(response.data.data);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    if (!uploadForm.unitCode || !uploadForm.unitName) {
      setUploadError('Please provide both unit code and unit name');
      return;
    }
    
    // Validate academic year format
    if (!uploadForm.academicYear.match(/^\d{4}\/\d{4}$/)) {
      setUploadError('Academic year must be in format YYYY/YYYY (e.g., 2026/2027)');
      return;
    }
    
    try {
      setUploading(true);
      setUploadError('');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('type', uploadForm.type);
      formData.append('unitCode', uploadForm.unitCode);
      formData.append('unitName', uploadForm.unitName);
      formData.append('yearOfStudy', uploadForm.yearOfStudy);
      formData.append('semester', uploadForm.semester);
      formData.append('academicYear', uploadForm.academicYear);
      
      // Upload with progress tracking
      const response = await resourcesAPI.uploadResource(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      setUploads([response.data.data, ...uploads]);
      setShowUploadModal(false);
      resetUploadForm();
      
      alert('Resource uploaded successfully! It will be visible after approval.');
    } catch (error) {
      console.error('Error uploading resource:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await resourcesAPI.updateResource(selectedResource.id, editForm);
      
      setUploads(uploads.map(u => 
        u.id === selectedResource.id ? { ...u, ...editForm } : u
      ));
      
      setShowEditModal(false);
      setSelectedResource(null);
      alert('Resource updated successfully!');
    } catch (error) {
      console.error('Error updating resource:', error);
      alert(error.response?.data?.message || 'Failed to update resource');
    }
  };

  const handleDelete = async () => {
    try {
      await resourcesAPI.deleteResource(selectedResource.id);
      setUploads(uploads.filter(u => u.id !== selectedResource.id));
      setShowDeleteConfirm(false);
      setSelectedResource(null);
      alert('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  const openEditModal = (resource) => {
    setSelectedResource(resource);
    setEditForm({
      title: resource.title,
      description: resource.description || '',
      type: resource.type
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (resource) => {
    setSelectedResource(resource);
    setShowDeleteConfirm(true);
  };

  const handleViewFile = (resource) => {
    setViewerFile(resource);
    setShowViewer(true);
  };

  const handleDownloadFile = async (resource) => {
    try {
      // Extract filename from URL or use title
      const filename = resource.fileUrl.split('/').pop() || `${resource.title}.pdf`;
      
      // Fetch the file
      const response = await fetch(resource.fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      type: 'notes',
      unitCode: '',
      unitName: '',
      yearOfStudy: '1',
      semester: '1',
      academicYear: getCurrentAcademicYear(),
      file: null
    });
    setUploadError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
      setUploadError('');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, text: 'Pending Review', class: 'bg-yellow-100 text-yellow-800' },
      approved: { icon: CheckCircle, text: 'Approved', class: 'bg-green-100 text-green-800' },
      rejected: { icon: XCircle, text: 'Rejected', class: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      notes: BookOpen,
      assignment: FileText,
      pastpaper: File,
      video: Video,
      other: File
    };
    return icons[type] || File;
  };

  const getTypeColor = (type) => {
    const colors = {
      notes: 'bg-blue-100 text-blue-700',
      assignment: 'bg-orange-100 text-orange-700',
      pastpaper: 'bg-purple-100 text-purple-700',
      video: 'bg-red-100 text-red-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  const filteredUploads = uploads.filter(upload => {
    // Status filter
    if (filterStatus !== 'all' && upload.status !== filterStatus) return false;
    
    // Type filter
    if (filterType !== 'all' && upload.type !== filterType) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        upload.title.toLowerCase().includes(query) ||
        upload.description?.toLowerCase().includes(query) ||
        upload.course?.unitCode.toLowerCase().includes(query) ||
        upload.course?.unitTitle.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const stats = {
    total: uploads.length,
    pending: uploads.filter(u => u.status === 'pending').length,
    approved: uploads.filter(u => u.status === 'approved').length,
    rejected: uploads.filter(u => u.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your uploads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Uploads</h1>
              <p className="text-gray-600 mt-1">Manage your uploaded resources</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-mut-primary text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Upload Resource
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Uploads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
              >
                <option value="all">All Types</option>
                <option value="notes">Lecture Notes</option>
                <option value="assignment">Assignments</option>
                <option value="pastpaper">Past Papers</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources List */}
        {filteredUploads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {uploads.length === 0 ? 'No uploads yet' : 'No matching resources'}
            </h3>
            <p className="text-gray-600 mb-4">
              {uploads.length === 0 
                ? 'Start sharing knowledge with your classmates by uploading resources.'
                : 'Try adjusting your filters or search query.'
              }
            </p>
            {uploads.length === 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-mut-primary text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Upload Your First Resource
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUploads.map((resource) => {
              const TypeIcon = getTypeIcon(resource.type);
              
              return (
                <div key={resource.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(resource.status)}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded ${getTypeColor(resource.type)} text-xs font-medium`}>
                              {resource.type ? (resource.type.charAt(0).toUpperCase() + resource.type.slice(1)) : 'Unknown'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Book className="w-4 h-4" />
                              {resource.course?.unitCode || 'N/A'} - {resource.course?.unitTitle || 'Unknown Course'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(resource.createdAt).toLocaleDateString()}
                            </span>
                            {resource.downloads > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Download className="w-4 h-4" />
                                  {resource.downloads} downloads
                                </span>
                              </>
                            )}
                          </div>
                          
                          {resource.status === 'rejected' && resource.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                                  <p className="text-sm text-red-700">{resource.rejectionReason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewFile(resource)}
                          className="p-2 text-gray-600 hover:text-mut-primary hover:bg-green-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(resource)}
                          className="p-2 text-gray-600 hover:text-mut-primary hover:bg-green-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(resource)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(resource)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upload Resource</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6">
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    required
                    placeholder="e.g., Week 5 Lecture Notes - Data Structures"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows="3"
                    placeholder="Brief description of the resource..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Type *
                    </label>
                    <select
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    >
                      <option value="notes">Lecture Notes</option>
                      <option value="assignment">Assignment</option>
                      <option value="pastpaper">Past Paper</option>
                      <option value="video">Video Lecture</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Code *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.unitCode}
                      onChange={(e) => setUploadForm({ ...uploadForm, unitCode: e.target.value.toUpperCase() })}
                      required
                      placeholder="e.g., CSC 2101"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.unitName}
                    onChange={(e) => setUploadForm({ ...uploadForm, unitName: e.target.value })}
                    required
                    placeholder="e.g., Data Structures and Algorithms"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Study *
                    </label>
                    <select
                      value={uploadForm.yearOfStudy}
                      onChange={(e) => setUploadForm({ ...uploadForm, yearOfStudy: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester *
                    </label>
                    <select
                      value={uploadForm.semester}
                      onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year *
                    </label>
                    <select
                      value={uploadForm.academicYear}
                      onChange={(e) => setUploadForm({ ...uploadForm, academicYear: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    >
                      {getAcademicYearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File * (Max 10MB)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-mut-primary text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Resource
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Resource</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type *
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                  >
                    <option value="notes">Lecture Notes</option>
                    <option value="assignment">Assignment</option>
                    <option value="pastpaper">Past Paper</option>
                    <option value="video">Video Lecture</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-mut-primary text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Resource?
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{selectedResource.title}"? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {showViewer && viewerFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900">{viewerFile.title}</h3>
                <p className="text-sm text-gray-600">
                  {viewerFile.type ? (viewerFile.type.charAt(0).toUpperCase() + viewerFile.type.slice(1)) : 'Document'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile(viewerFile)}
                  className="bg-mut-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setShowViewer(false);
                    setViewerFile(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {viewerFile.fileUrl.match(/\.(pdf)$/i) ? (
                <iframe
                  src={viewerFile.fileUrl}
                  className="w-full h-full min-h-[600px]"
                  title={viewerFile.title}
                />
              ) : viewerFile.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={viewerFile.fileUrl}
                  alt={viewerFile.title}
                  className="max-w-full h-auto mx-auto"
                />
              ) : viewerFile.fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={viewerFile.fileUrl}
                  controls
                  className="max-w-full h-auto mx-auto"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Preview not available for this file type</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Click the download button to view this file
                  </p>
                  <button
                    onClick={() => handleDownloadFile(viewerFile)}
                    className="bg-mut-primary text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyUploadsPage;
