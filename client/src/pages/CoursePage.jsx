import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schoolsAPI, resourcesAPI } from '../services/api';
import { useAuth } from '../utils/authContext';
import ResourceCard from '../components/ResourceCard';
import UploadModal from '../components/UploadModal';
import { getCategoryDisplayName } from '../utils/helpers';

const CoursePage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const categories = ['notes', 'past_paper', 'cat', 'practical_manual', 'quiz'];

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    fetchResources();
  }, [id, activeTab]);

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
      const response = await resourcesAPI.getResourcesByCourse(id, { category: activeTab });
      setResources(response.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchResources();
  };

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
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Resource
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === category
                    ? 'border-mut-primary text-mut-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Resources Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resourcesLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No {getCategoryDisplayName(activeTab)} Available
            </h3>
            <p className="mt-1 text-gray-500">
              Be the first to contribute resources for this category!
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="mt-4 btn-primary"
              >
                Upload Resource
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        courseId={id}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default CoursePage;
