import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { debounce } from '../utils/helpers';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ programs: [], courses: [], resources: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const performSearch = debounce(async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults({ programs: [], courses: [], resources: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Performing search for:', searchQuery);
    try {
      const response = await searchAPI.search(searchQuery);
      console.log('✅ Search results:', response.data);
      setResults(response.data.data);
      setShowResults(true);
    } catch (error) {
      console.error('❌ Search error:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    console.log('🔍 Search query:', value);
    performSearch(value);
  };

  const handleProgramClick = (programId) => {
    navigate(`/program/${programId}`);
    setQuery('');
    setShowResults(false);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
    setQuery('');
    setShowResults(false);
  };

  const handleResourceDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const hasResults = results.programs.length > 0 || results.courses.length > 0 || results.resources.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search programs or courses (e.g., 'Computer Science' or 'SCS 2101')..."
          className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent shadow-sm"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mut-primary"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {hasResults ? (
            <>
              {/* Programs Section */}
              {results.programs.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Programs
                  </div>
                  {results.programs.map((program) => (
                    <button
                      key={program.id}
                      onClick={() => handleProgramClick(program.id)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{program.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {program.code} • {program.level}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {program.department} • {program.school}
                          </div>
                        </div>
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Program
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Courses Section */}
              {results.courses.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Courses
                  </div>
                  {results.courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseClick(course.id)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {course.unitCode} - {course.unitTitle}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Year {course.year}, Semester {course.semester} • {course.credits} Credits
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {course.program.name}
                          </div>
                        </div>
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Course
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Resources Section */}
              {results.resources.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Study Materials ({results.resources.length})
                  </div>
                  {results.resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => handleResourceDownload(resource.fileUrl)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {resource.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {resource.course.unitCode} - {resource.course.unitTitle}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="capitalize">{resource.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{(resource.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            {resource.downloadCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{resource.downloadCount} downloads</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Resource
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2">No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
