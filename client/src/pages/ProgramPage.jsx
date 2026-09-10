import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schoolsAPI } from '../services/api';

const ProgramPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgramDetails();
  }, [id]);

  const fetchProgramDetails = async () => {
    try {
      const response = await schoolsAPI.getProgramById(id);
      setProgram(response.data.data);
    } catch (error) {
      console.error('Error fetching program:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Program not found</h2>
          <Link to="/" className="text-mut-primary hover:underline mt-4 inline-block">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const yearNumbers = Object.keys(program.courses).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Program Header */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/" className="text-white hover:text-red-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded">
              {program.code}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{program.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-green-100">
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded">{program.level}</span>
            <span>{program.durationYears} Years</span>
            <span>•</span>
            <span>{program.department.name}</span>
            <span>•</span>
            <span>{program.school.name}</span>
          </div>
        </div>
      </div>

      {/* Courses by Year */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Course Units</h2>

        {yearNumbers.length > 0 ? (
          <div className="space-y-8">
            {yearNumbers.map((year) => (
              <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">
                    Year {year}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {/* Semester 1 */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                        Semester 1
                      </span>
                    </h4>
                    {program.courses[year].semester1.length > 0 ? (
                      <div className="space-y-3">
                        {program.courses[year].semester1.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-mut-primary hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">
                                  {course.unitCode}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {course.unitTitle}
                                </div>
                              </div>
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                {course.credits} Credits
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No courses available</p>
                    )}
                  </div>

                  {/* Semester 2 */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                        Semester 2
                      </span>
                    </h4>
                    {program.courses[year].semester2.length > 0 ? (
                      <div className="space-y-3">
                        {program.courses[year].semester2.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-mut-primary hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">
                                  {course.unitCode}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {course.unitTitle}
                                </div>
                              </div>
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                {course.credits} Credits
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No courses available</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No courses available for this program yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramPage;
