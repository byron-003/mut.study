import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolsAPI } from '../services/api';
import { GraduationCap, BookOpen, ChevronRight } from 'lucide-react';

const ProgramsPage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const schoolThumbnails = {
    'SAES': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop',
    'SBE': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    'SCIT': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
    'SOEHSS': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
    'SET': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop',
    'SHTM': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
    'SNS': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
    'SPAHS': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop',
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Programs</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Explore our diverse range of programs across 8 schools and 18+ departments
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-mut-primary mb-2">8</div>
            <div className="text-gray-600">Schools</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-mut-primary mb-2">18+</div>
            <div className="text-gray-600">Departments</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-mut-primary mb-2">62+</div>
            <div className="text-gray-600">Programs</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-mut-primary mb-2">1000+</div>
            <div className="text-gray-600">Resources</div>
          </div>
        </div>

        {/* Schools Grid */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Browse by School</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => navigate(`/school/${school.id}`)}
                  className="card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={schoolThumbnails[school.code] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop'} 
                      alt={school.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-mut-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {school.code}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {school.name}
                    </h3>
                    {school.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {school.description}
                      </p>
                    )}
                    <div className="flex items-center text-mut-primary text-sm font-medium">
                      <span>View Programs</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramsPage;
