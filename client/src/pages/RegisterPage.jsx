import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/authContext';
import { schoolsAPI } from '../services/api';
import { isValidEmail } from '../utils/helpers';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    programId: ''
  });
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [programSearch, setProgramSearch] = useState('');
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
    score: 0
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    // Filter programs based on search
    if (programSearch.trim()) {
      const filtered = programs.filter(program => 
        program.name.toLowerCase().includes(programSearch.toLowerCase()) ||
        program.code.toLowerCase().includes(programSearch.toLowerCase()) ||
        program.school.name.toLowerCase().includes(programSearch.toLowerCase())
      );
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms(programs);
    }
  }, [programSearch, programs]);

  useEffect(() => {
    // Check password strength
    const password = formData.password;
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;
    
    setPasswordStrength({
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      score
    });
  }, [formData.password]);

  const fetchPrograms = async () => {
    try {
      const response = await schoolsAPI.getAllPrograms();
      setPrograms(response.data.data);
      setFilteredPrograms(response.data.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProgramSelect = (program) => {
    setFormData({ ...formData, programId: program.id });
    setProgramSearch(program.name);
    setShowProgramDropdown(false);
  };

  const handleProgramSearchChange = (e) => {
    setProgramSearch(e.target.value);
    setShowProgramDropdown(true);
    if (!e.target.value) {
      setFormData({ ...formData, programId: '' });
    }
  };

  const handleTermsScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !termsScrolled) {
      setTermsScrolled(true);
    }
  };

  const openTermsModal = () => {
    setShowTermsModal(true);
    setTermsScrolled(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      toast.error('Please provide a valid email address', { icon: '📧' });
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long', { icon: '🔑' });
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Password is too weak. Please include at least 3 of: uppercase, lowercase, number, or symbol', { 
        icon: '⚠️',
        duration: 5000 
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match', { icon: '❌' });
      return;
    }

    if (!formData.programId) {
      toast.error('Please select your program', { icon: '📚' });
      return;
    }

    if (!agreedToTerms) {
      toast.error('You must read and agree to the Terms of Service and Privacy Policy', { 
        icon: '📄',
        duration: 5000 
      });
      return;
    }

    if (!termsScrolled) {
      toast.error('Please scroll through the Terms and Privacy Policy before agreeing', { 
        icon: '⬇️',
        duration: 5000 
      });
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        programId: formData.programId || null
      });
      
      toast.success('Account created successfully! Redirecting...', {
        icon: '🎉',
        duration: 2000,
      });
      
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.status === 429) {
        toast.error(err.response?.data?.message || 'Too many registration attempts. Please try again later.', {
          icon: '🔒',
          duration: 6000,
        });
      } else if (err.response?.status === 409) {
        toast.error('This email is already registered. Please login or use a different email.', {
          icon: '📧',
          duration: 5000,
        });
      } else {
        toast.error(err.response?.data?.error?.message || 'Registration failed. Please try again.', {
          icon: '❌',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <img 
              src="/mut-logo.png" 
              alt="MUT Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 ">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 ">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-mut-primary hover:text-green-700 ">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your.email@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">Use any valid email address</p>
            </div>

            <div>
              <label htmlFor="programId" className="block text-sm font-medium text-gray-700 mb-1">
                Program <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={programSearch}
                  onChange={handleProgramSearchChange}
                  onFocus={() => setShowProgramDropdown(true)}
                  className="input-field"
                  placeholder="Search for your program..."
                  required
                />
                
                {showProgramDropdown && filteredPrograms.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPrograms.map(program => (
                      <button
                        key={program.id}
                        type="button"
                        onClick={() => handleProgramSelect(program)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{program.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {program.code} • {program.level} • {program.school.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Start typing to search (e.g., "Computer Science", "BSC-CS")
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700  mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
                className="input-field"
                placeholder="Create a strong password"
              />
              
              {/* Password Strength Indicator */}
              {showPasswordRequirements && formData.password && (
                <div className="mt-3 p-4 bg-gray-50  border border-gray-200  rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 ">Password Strength:</span>
                    <span className={`text-sm font-semibold ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score === 3 ? 'text-yellow-600' :
                      passwordStrength.score === 4 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.score <= 2 ? 'Weak' :
                       passwordStrength.score === 3 ? 'Fair' :
                       passwordStrength.score === 4 ? 'Good' :
                       'Strong'}
                    </span>
                  </div>
                  
                  {/* Strength Bar */}
                  <div className="w-full bg-gray-200  rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' :
                        passwordStrength.score === 3 ? 'bg-yellow-500' :
                        passwordStrength.score === 4 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  
                  {/* Requirements Checklist */}
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${passwordStrength.hasMinLength ? 'text-green-600 ' : 'text-gray-500 '}`}>
                      {passwordStrength.hasMinLength ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${passwordStrength.hasUppercase ? 'text-green-600 ' : 'text-gray-500 '}`}>
                      {passwordStrength.hasUppercase ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>Uppercase letter (A-Z)</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${passwordStrength.hasLowercase ? 'text-green-600 ' : 'text-gray-500 '}`}>
                      {passwordStrength.hasLowercase ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>Lowercase letter (a-z)</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600 ' : 'text-gray-500 '}`}>
                      {passwordStrength.hasNumber ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>Number (0-9)</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${passwordStrength.hasSymbol ? 'text-green-600 ' : 'text-gray-500 '}`}>
                      {passwordStrength.hasSymbol ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>Special symbol (!@#$%^&*)</span>
                    </div>
                  </div>
                  
                  {passwordStrength.score < 3 && (
                    <p className="text-xs text-amber-600  mt-2">
                      ⚠️ Include at least 3 requirements for a strong password
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700  mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
              />
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.password === formData.confirmPassword ? (
                    <p className="text-sm text-green-600  flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-sm text-red-600  flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms and Privacy Agreement */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={openTermsModal}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left hover:border-mut-primary transition-colors"
            >
              <p className="font-medium text-gray-900">📄 Read Terms & Privacy Policy</p>
              <p className="text-sm text-gray-600 mt-1">Click to view and scroll through the documents</p>
            </button>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreedToTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={!termsScrolled}
                className="mt-1 w-4 h-4 text-mut-primary border-gray-300 rounded focus:ring-mut-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="agreedToTerms" className={`text-sm ${!termsScrolled ? 'text-gray-400' : 'text-gray-700'}`}>
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-mut-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-mut-primary hover:underline">
                  Privacy Policy
                </Link>
                {!termsScrolled && (
                  <span className="block text-xs text-amber-600 mt-1">
                    ⚠️ Please read the documents above first (scroll to bottom)
                  </span>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms || !termsScrolled || passwordStrength.score < 3}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>

          {/* Security Info */}
          <div className="text-center text-xs text-gray-500  pt-2">
            <p>🔒 Rate limit: 3 registrations per 15 minutes</p>
          </div>
        </form>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Terms of Service & Privacy Policy</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6"
              onScroll={handleTermsScroll}
            >
              {/* Terms Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">📌 Please scroll to the bottom of this document</p>
                <p className="text-sm text-blue-800">You must read through both Terms of Service and Privacy Policy before you can agree and continue with registration.</p>
              </div>

              {/* Terms Content */}
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Terms of Service - Summary</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>You must be a MUT student/staff to use this platform</li>
                  <li>You are responsible for maintaining your account security</li>
                  <li>Do not upload copyrighted materials without permission</li>
                  <li>Respect academic integrity policies</li>
                  <li>No harassment, discrimination, or offensive content</li>
                  <li>We may remove content that violates our policies</li>
                  <li>Full terms available at: <Link to="/terms" target="_blank" className="text-mut-primary hover:underline">MUT Study Hub Terms</Link></li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy Policy - Summary</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>We collect: name, email, program info, and uploaded content</li>
                  <li>Your data is used to provide platform services</li>
                  <li>We use secure encryption (HTTPS, bcrypt passwords)</li>
                  <li>Your profile info is visible to other registered users</li>
                  <li>We will NEVER sell your personal information</li>
                  <li>You can request account deletion at any time</li>
                  <li>Full policy available at: <Link to="/privacy" target="_blank" className="text-mut-primary hover:underline">MUT Study Hub Privacy</Link></li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>Access and download your personal data</li>
                  <li>Correct or update your information</li>
                  <li>Request account deletion</li>
                  <li>Opt out of non-essential communications</li>
                  <li>Report privacy concerns to: privacy@mutstudy.ac.za</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Contact & Support</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  <p><strong>Email:</strong> support@mutstudy.ac.za</p>
                  <p><strong>Location:</strong> Muranga University of Technology, Muranga County, Kenya</p>
                  <p className="mt-2">For detailed information, please visit our full <Link to="/terms" target="_blank" className="text-mut-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-mut-primary hover:underline">Privacy Policy</Link> pages.</p>
                </div>
              </section>

              {/* Scroll indicator */}
              {!termsScrolled && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                  <p className="text-amber-800 font-medium">⬇️ Keep scrolling to enable the agreement checkbox</p>
                </div>
              )}

              {termsScrolled && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-800 font-medium">✅ Thank you for reading! You can now close this and agree to continue.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full px-6 py-3 bg-mut-primary text-white rounded-lg hover:bg-mut-secondary transition-colors font-medium"
              >
                {termsScrolled ? 'Close and Continue' : 'Close (Please scroll first)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
