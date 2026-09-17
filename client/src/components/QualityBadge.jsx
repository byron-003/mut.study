import React from 'react';
import { Award, Trophy, Medal, Star } from 'lucide-react';

/**
 * QualityBadge Component - Display quality badge based on reputation
 * @param {string} badge - Badge level: 'none', 'bronze', 'silver', 'gold', 'platinum'
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Show badge label text
 * @param {boolean} showTooltip - Show tooltip on hover
 */
const QualityBadge = ({ 
  badge = 'none', 
  size = 'md', 
  showLabel = true,
  showTooltip = true 
}) => {
  if (badge === 'none' || !badge) {
    return null;
  }

  const badgeConfig = {
    bronze: {
      label: 'Bronze Contributor',
      icon: Medal,
      colors: 'bg-orange-100  text-orange-700  border-orange-300 ',
      iconColor: 'text-orange-600 ',
      description: 'Consistent quality contributions'
    },
    silver: {
      label: 'Silver Contributor',
      icon: Award,
      colors: 'bg-gray-100  text-gray-700  border-gray-300 ',
      iconColor: 'text-gray-600 ',
      description: 'High-quality resource provider'
    },
    gold: {
      label: 'Gold Contributor',
      icon: Trophy,
      colors: 'bg-yellow-100  text-yellow-700  border-yellow-300 ',
      iconColor: 'text-yellow-600 ',
      description: 'Outstanding contributions & ratings'
    },
    platinum: {
      label: 'Platinum Contributor',
      icon: Star,
      colors: 'bg-purple-100  text-purple-700  border-purple-300 ',
      iconColor: 'text-purple-600 ',
      description: 'Elite contributor - Exceptional quality'
    }
  };

  const config = badgeConfig[badge.toLowerCase()];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="relative inline-block group">
      <div
        className={`
          flex items-center gap-1.5 rounded-full border-2 font-medium
          ${config.colors} ${sizes.container}
          transition-all duration-200 hover:shadow-md
        `}
      >
        <Icon className={`${sizes.icon} ${config.iconColor}`} />
        {showLabel && (
          <span className={sizes.text}>{config.label}</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                      bg-gray-900  text-white text-xs rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                      whitespace-nowrap z-10 shadow-lg">
          <div className="font-semibold mb-0.5">{config.label}</div>
          <div className="text-gray-300">{config.description}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1
                        border-4 border-transparent border-t-gray-900 " />
        </div>
      )}
    </div>
  );
};

export default QualityBadge;
