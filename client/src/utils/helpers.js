/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category) => {
  const categories = {
    notes: 'Lecture Notes',
    past_paper: 'Past Papers',
    cat: 'CAT Papers',
    practical_manual: 'Practical Manuals',
    quiz: 'Quizzes',
  };
  return categories[category] || category;
};

/**
 * Get category color for badges
 */
export const getCategoryColor = (category) => {
  const colors = {
    notes: 'bg-green-100 text-green-800',
    past_paper: 'bg-emerald-100 text-emerald-800',
    cat: 'bg-teal-100 text-teal-800',
    practical_manual: 'bg-green-100 text-green-800',
    quiz: 'bg-lime-100 text-lime-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return regex.test(email);
};

/**
 * Extract file extension from filename
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get Cloudinary URL for viewing document
 */
export const getViewUrl = (fileUrl) => {
  // Cloudinary URLs are already optimized for viewing
  return fileUrl;
};

/**
 * Debounce function for search
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
