import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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
    setError('');

    if (!isValidEmail(formData.email)) {
      setError('Please provide a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.programId) {
      setError('Please select your program');
      return;
    }

    if (!agreedToTerms) {
      setError('You must read and agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!termsScrolled) {
      setError('Please scroll through the Terms and Privacy Policy before agreeing');
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
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.status === 429) {
        setError(err.response?.data?.message || 'Too many registration attempts. Please try again later.');
      } else {
        setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <img 
              src="/mut-logo.png" 
              alt="MUT Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-mut-primary hover:text-green-700">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
            disabled={loading || !agreedToTerms || !termsScrolled}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
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
