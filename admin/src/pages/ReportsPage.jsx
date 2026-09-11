import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import {
  FileText, Download, Calendar, Filter, Users, BookOpen,
  FileBarChart, TrendingUp, Clock, CheckCircle
} from 'lucide-react';

const ReportsPage = () => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showAlert('Warning', 'No data available to export', 'warning');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateUsersReport = async () => {
    try {
      setExportLoading(true);
      const response = await adminAPI.getUsers({ limit: 1000 });
      const users = response.data.data.users;
      
      // Format data for export
      const exportData = users.map(user => ({
        'First Name': user.first_name,
        'Last Name': user.last_name,
        'Email': user.email,
        'Role': user.role,
        'Status': user.is_active ? 'Active' : 'Inactive',
        'Program': user.program_code || 'N/A',
        'Year': user.current_year || 'N/A',
        'Semester': user.current_semester || 'N/A',
        'Joined Date': new Date(user.created_at).toLocaleDateString(),
      }));

      exportToCSV(exportData, 'users_report');
      showAlert('Success', 'Users report exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating users report:', error);
      showAlert('Error', 'Failed to generate users report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const generateResourcesReport = async () => {
    try {
      setExportLoading(true);
      const response = await adminAPI.getResources({ limit: 1000 });
      const resources = response.data.data.resources;
      
      // Format data for export
      const exportData = resources.map(resource => ({
        'Title': resource.title,
        'Unit Code': resource.unit_code,
        'Unit Title': resource.unit_title,
        'Program': resource.program_code,
        'Type': resource.type,
        'Status': resource.status,
        'File Size (MB)': resource.file_size ? (resource.file_size / (1024 * 1024)).toFixed(2) : 'N/A',
        'Downloads': resource.download_count || 0,
        'Academic Year': resource.academic_year || 'N/A',
        'Uploader': `${resource.uploader_first_name} ${resource.uploader_last_name}`,
        'Upload Date': new Date(resource.created_at).toLocaleDateString(),
      }));

      exportToCSV(exportData, 'resources_report');
      showAlert('Success', 'Resources report exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating resources report:', error);
      showAlert('Error', 'Failed to generate resources report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const generateProgramsReport = async () => {
    try {
      setExportLoading(true);
      const response = await adminAPI.getPrograms({ limit: 1000 });
      const programs = response.data.data.programs;
      
      // Format data for export
      const exportData = programs.map(program => ({
        'Program Code': program.code,
        'Program Name': program.name,
        'Department': program.department_name,
        'School': program.school_name,
        'Duration (Years)': program.duration_years,
        'Number of Courses': program.course_count,
        'Description': program.description || 'N/A',
        'Created Date': new Date(program.created_at).toLocaleDateString(),
      }));

      exportToCSV(exportData, 'programs_report');
      showAlert('Success', 'Programs report exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating programs report:', error);
      showAlert('Error', 'Failed to generate programs report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const generateCoursesReport = async () => {
    try {
      setExportLoading(true);
      const response = await adminAPI.getCourses({ limit: 1000 });
      const courses = response.data.data.courses;
      
      // Format data for export
      const exportData = courses.map(course => ({
        'Unit Code': course.unit_code,
        'Unit Title': course.unit_title,
        'Program Code': course.program_code,
        'Program Name': course.program_name,
        'Level': course.level || 'N/A',
        'Semester': course.semester || 'N/A',
        'Credits': course.credits,
        'Number of Resources': course.resource_count,
        'Created Date': new Date(course.created_at).toLocaleDateString(),
      }));

      exportToCSV(exportData, 'courses_report');
      showAlert('Success', 'Courses report exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating courses report:', error);
      showAlert('Error', 'Failed to generate courses report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const generateSummaryReport = async () => {
    try {
      setExportLoading(true);
      
      const summaryData = [
        {
          'Metric': 'Total Users',
          'Count': stats?.overview.totalUsers || 0,
          'Category': 'Users',
        },
        {
          'Metric': 'Students',
          'Count': stats?.usersByRole.students || 0,
          'Category': 'Users',
        },
        {
          'Metric': 'Class Representatives',
          'Count': stats?.usersByRole.classReps || 0,
          'Category': 'Users',
        },
        {
          'Metric': 'Administrators',
          'Count': stats?.usersByRole.admins || 0,
          'Category': 'Users',
        },
        {
          'Metric': 'Total Resources',
          'Count': stats?.overview.totalResources || 0,
          'Category': 'Resources',
        },
        {
          'Metric': 'Pending Resources',
          'Count': stats?.resourcesByStatus.pending || 0,
          'Category': 'Resources',
        },
        {
          'Metric': 'Approved Resources',
          'Count': stats?.resourcesByStatus.approved || 0,
          'Category': 'Resources',
        },
        {
          'Metric': 'Rejected Resources',
          'Count': stats?.resourcesByStatus.rejected || 0,
          'Category': 'Resources',
        },
        {
          'Metric': 'Total Programs',
          'Count': stats?.overview.totalPrograms || 0,
          'Category': 'Academic',
        },
        {
          'Metric': 'Total Courses',
          'Count': stats?.overview.totalCourses || 0,
          'Category': 'Academic',
        },
        {
          'Metric': 'Total Downloads',
          'Count': stats?.overview.totalDownloads || 0,
          'Category': 'Activity',
        },
        {
          'Metric': 'Recent Uploads (7 days)',
          'Count': stats?.overview.recentUploads || 0,
          'Category': 'Activity',
        },
        {
          'Metric': 'New Users (30 days)',
          'Count': stats?.overview.newUsers || 0,
          'Category': 'Activity',
        },
      ];

      exportToCSV(summaryData, 'summary_report');
      showAlert('Success', 'Summary report exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating summary report:', error);
      showAlert('Error', 'Failed to generate summary report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const reportCards = [
    {
      title: 'Users Report',
      description: 'Export all registered users with their details',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      action: generateUsersReport,
      stats: `${stats?.overview.totalUsers || 0} users`,
    },
    {
      title: 'Resources Report',
      description: 'Export all study materials and their metadata',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      action: generateResourcesReport,
      stats: `${stats?.overview.totalResources || 0} resources`,
    },
    {
      title: 'Programs Report',
      description: 'Export all academic programs and details',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      action: generateProgramsReport,
      stats: `${stats?.overview.totalPrograms || 0} programs`,
    },
    {
      title: 'Courses Report',
      description: 'Export all courses and units information',
      icon: FileBarChart,
      color: 'from-orange-500 to-orange-600',
      action: generateCoursesReport,
      stats: `${stats?.overview.totalCourses || 0} courses`,
    },
    {
      title: 'Summary Report',
      description: 'Export platform overview and key metrics',
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      action: generateSummaryReport,
      stats: 'All statistics',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-gray-600 mt-1">Generate and download platform reports</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Export Information</h3>
            <p className="text-sm text-blue-800">
              All reports are exported in CSV format and include complete data from the platform.
              Files are named with the current date for easy tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.overview.totalUsers || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Resources</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.overview.totalResources || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.resourcesByStatus.pending || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.resourcesByStatus.approved || 0}</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report, index) => {
          const Icon = report.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${report.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${report.color} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{report.stats}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                <button
                  onClick={report.action}
                  disabled={exportLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {exportLoading ? 'Generating...' : 'Export CSV'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Uploads This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview.recentUploads || 0}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New Users This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview.newUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalDownloads || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export History Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Export Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
              <li>• All exports include data up to the current moment</li>
              <li>• Large exports may take a few seconds to generate</li>
              <li>• Reports are not stored on the server - download immediately after generation</li>
            </ul>
          </div>
        </div>
      </div>
      
      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default ReportsPage;
