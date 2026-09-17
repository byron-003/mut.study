import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Footer from '../components/Footer';
import { schoolsAPI } from '../services/api';

const HomePage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);

  // School thumbnail mapping with relevant Unsplash images
  const schoolThumbnails = {
    'SAES': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop', // Agriculture
    'SBE': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop', // Business
    'SCIT': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop', // Computing/IT
    'SOEHSS': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop', // Education
    'SET': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop', // Engineering
    'SHTM': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', // Hospitality
    'SNS': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop', // Nursing
    'SPAHS': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop', // Sciences
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await schoolsAPI.getAllSchools();
      setSchools(response.data.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white  ">
      {/* Hero Section with Natural Background Image */}
      <div 
        className="relative text-white py-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/mut-background image.jfif')"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-shadow">
              MUT Study Hub
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-shadow">
              Murang'a University of Technology
            </p>
            <p className="text-lg text-shadow">
              Your Academic Resource Portal
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl bg-white  rounded-2xl p-2 shadow-2xl">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-mut-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 ">Lecture Notes</h3>
            <p className="text-gray-600 ">Access comprehensive lecture notes for all your courses</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-mut-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 ">Past Papers & CATs</h3>
            <p className="text-gray-600 ">Practice with previous examination papers and CATs</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-mut-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 ">Practical Manuals</h3>
            <p className="text-gray-600">Download lab manuals and practical guides</p>
          </div>
        </div>

        {/* Schools Section */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">Browse by School</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedSchool(school)}
                >
                  {/* Thumbnail Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={schoolThumbnails[school.code] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop'} 
                      alt={school.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {/* School Code Badge */}
                    <div className="absolute top-3 right-3 bg-mut-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {school.code}
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {school.name}
                    </h3>
                    {school.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {school.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link 
              to="/programs" 
              className="inline-block px-8 py-3 bg-mut-primary text-white rounded-lg hover:bg-mut-secondary transition-colors font-medium"
            >
              View All Programs
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-gradient-to-r from-mut-primary to-mut-secondary rounded-2xl p-8 text-white">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">8</div>
              <div className="text-green-100">Schools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">18+</div>
              <div className="text-green-100">Departments</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">62+</div>
              <div className="text-green-100">Programs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-red-100">Resources</div>
            </div>
          </div>
        </div>


      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;
