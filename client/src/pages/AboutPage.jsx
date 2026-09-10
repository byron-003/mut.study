import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { Users, CheckCircle, BookOpen, Shield, TrendingUp, Award } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About MUT Study Hub</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Empowering students through collaborative learning and resource sharing
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop" 
                alt="Students studying" 
                className="rounded-lg shadow-md w-full h-64 object-cover"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                MUT Study Hub is a centralized platform designed to help Mangosuthu University of Technology 
                students access and share academic resources seamlessly. We believe in the power of collaborative 
                learning and aim to make quality educational materials accessible to every student.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our platform connects students across all programs, enabling them to share lecture notes, 
                past papers, practical manuals, and other study materials in a secure and organized environment.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Resource Sharing</h3>
              <p className="text-gray-600 text-sm">
                Upload and share lecture notes, past papers, CATs, and study materials with your peers across all programs.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Quality Assurance</h3>
              <p className="text-gray-600 text-sm">
                Class representatives and admins review all materials before approval, ensuring high-quality content for everyone.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Community Driven</h3>
              <p className="text-gray-600 text-sm">
                Built by students, for students. Join a growing community of learners helping each other succeed.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Easy Access</h3>
              <p className="text-gray-600 text-sm">
                Find resources by school, program, course, or use our powerful search to locate exactly what you need.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">
                Monitor your uploads, downloads, and contributions. See how your resources help fellow students.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Recognition System</h3>
              <p className="text-gray-600 text-sm">
                Top contributors get recognized for their efforts in building our academic community.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-mut-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">
                Create your account using your MUT email address and join the community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-mut-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Share & Access</h3>
              <p className="text-gray-600 text-sm">
                Upload your notes or browse resources from your courses and programs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-mut-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Collaborate</h3>
              <p className="text-gray-600 text-sm">
                Help others succeed and build a stronger academic community together.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of MUT students who are already using Study Hub to excel in their academics.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              to="/register" 
              className="px-8 py-3 bg-mut-primary text-white rounded-lg hover:bg-mut-secondary transition-colors font-medium"
            >
              Create Account
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
