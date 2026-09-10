import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  Users, FileText, GraduationCap, BookOpen, Download,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of MUT Study Hub platform</p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.overview.totalUsers || 0}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={`+${stats?.overview.newUsers || 0} this month`}
        />
        <StatCard
          title="Total Resources"
          value={stats?.overview.totalResources || 0}
          icon={FileText}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend={`+${stats?.overview.recentUploads || 0} this week`}
        />
        <StatCard
          title="Programs"
          value={stats?.overview.totalPrograms || 0}
          icon={GraduationCap}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Courses"
          value={stats?.overview.totalCourses || 0}
          icon={BookOpen}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.resourcesByStatus.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.resourcesByStatus.approved || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.resourcesByStatus.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Resources */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Downloaded Resources</h2>
          <div className="space-y-3">
            {stats?.topResources.length > 0 ? (
              stats.topResources.map((resource, index) => (
                <div key={resource.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-admin-primary rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{resource.title}</p>
                    <p className="text-sm text-gray-500">{resource.unit_code}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Download className="w-4 h-4" />
                    {resource.download_count}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No resources yet</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {stats?.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border-l-4 border-admin-primary bg-gray-50 rounded">
                  <div className={`p-1 rounded ${
                    activity.status === 'approved' ? 'bg-green-100' :
                    activity.status === 'rejected' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {activity.status === 'approved' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     activity.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-600" /> :
                     <Clock className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">by {activity.uploader.name}</p>
                    <p className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Students</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.usersByRole.students || 0}</p>
          </div>
          <div className="p-4 border-2 border-green-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Class Representatives</p>
            <p className="text-2xl font-bold text-green-600">{stats?.usersByRole.classReps || 0}</p>
          </div>
          <div className="p-4 border-2 border-purple-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Administrators</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.usersByRole.admins || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
