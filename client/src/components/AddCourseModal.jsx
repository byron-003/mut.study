import React, { useState } from 'react';
import { classRepAPI } from '../services/api';
import { X, BookOpen } from 'lucide-react';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from './CustomAlert';

const AddCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const [formData, setFormData] = useState({
    unit_code: '',
    unit_title: '',
    level: '1',
    semester: '1',
    credits: '3',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.unit_code.trim()) {
      setError('Please enter a unit code');
      return;
    }

    if (!formData.unit_title.trim()) {
      setError('Please enter a unit title');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await classRepAPI.createCourse({
        unit_code: formData.unit_code.trim().toUpperCase(),
        unit_title: formData.unit_title.trim(),
        level: parseInt(formData.level),
        semester: parseInt(formData.semester),
        credits: parseInt(formData.credits)
      });

      const createdCourse = response.data?.data?.course || {
        unitCode: formData.unit_code.trim().toUpperCase(),
        unitTitle: formData.unit_title.trim(),
        academicYear: parseInt(formData.level),
        semester: parseInt(formData.semester),
        credits: parseInt(formData.credits)
      };
      
      // Reset form
      setFormData({
        unit_code: '',
        unit_title: '',
        level: '1',
        semester: '1',
        credits: '3',
        description: ''
      });
      
      // Call success callback with the new course so the list can refresh immediately
      if (onSuccess) onSuccess(createdCourse);
      
      // Show success message
      showAlert('Success', 'Course created successfully! 🎉', 'success');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Create course error:', err);
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        'Failed to create course. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        unit_code: '',
        unit_title: '',
        level: '1',
        semester: '1',
        credits: '3',
        description: ''
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mut-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-mut-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Add New Course
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Unit Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unit_code"
                  value={formData.unit_code}
                  onChange={handleInputChange}
                  placeholder="e.g., CSE 2101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent uppercase"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Unit Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unit_title"
                  value={formData.unit_title}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures and Algorithms"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Level (Year of Study) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year of Study <span className="text-red-500">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                </select>
              </div>

              {/* Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-mut-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                As a class representative, you can create courses for your program.
              </p>
            </form>
          </div>
        </div>
      </div>
      
      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default AddCourseModal;
