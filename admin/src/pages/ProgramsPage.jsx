import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  Search, Plus, Edit, Trash2, GraduationCap, BookOpen, Building2,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

const ProgramsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 20,
  });
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration_years: 4,
    department_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchDepartments();
  }, [filters]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPrograms(filters);
      setPrograms(response.data.data.programs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedProgram(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      duration_years: 4,
      department_id: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (program) => {
    setModalMode('edit');
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      code: program.code,
      description: program.description || '',
      duration_years: program.duration_years,
      department_id: program.department_id,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Program name is required';
    if (!formData.code.trim()) errors.code = 'Program code is required';
    if (!formData.department_id) errors.department_id = 'Department is required';
    if (formData.duration_years < 1 || formData.duration_years > 7) {
      errors.duration_years = 'Duration must be between 1 and 7 years';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      
      if (modalMode === 'create') {
        await adminAPI.createProgram(formData);
        alert('Program created successfully!');
      } else {
        await adminAPI.updateProgram(selectedProgram.id, formData);
        alert('Program updated successfully!');
      }
      
      setShowModal(false);
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      alert(error.response?.data?.message || 'Failed to save program');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (program) => {
    if (!window.confirm(`Are you sure you want to delete "${program.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.deleteProgram(program.id);
      setPrograms(programs.filter(p => p.id !== program.id));
      alert('Program deleted successfully!');
    } catch (error) {
      console.error('Error deleting program:', error);
      alert(error.response?.data?.message || 'Failed to delete program');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs Management</h1>
          <p className="text-gray-600 mt-1">Manage academic programs</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Add Program
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search programs by name or code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
          />
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No programs found
          </div>
        ) : (
          programs.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{program.code}</h3>
                    <p className="text-sm text-gray-500">{program.school_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(program)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(program)}
                    disabled={actionLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{program.name}</h4>
              
              {program.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {program.course_count} courses
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {program.duration_years} years
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {program.department_name}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pagination.page === pageNum
                        ? 'bg-admin-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Create New Program' : 'Edit Program'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary ${
                    formErrors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., BSC-CS"
                />
                {formErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary ${
                    formErrors.department_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.school_name} - {dept.name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.department_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Years) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary ${
                    formErrors.duration_years ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.duration_years && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.duration_years}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  placeholder="Brief description of the program..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Saving...' : modalMode === 'create' ? 'Create Program' : 'Update Program'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
