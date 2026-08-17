import React from 'react';
import type { StatCardProps } from '../types/widget';
import './StatCard.css';

/**
 * Stat card component for displaying key metrics
 * 
 * @example
 * ```tsx
 * <StatCard
 *   id="users-stat"
 *   title="Total Users"
 *   value={1234}
 *   subtitle="Active users"
 *   icon="👥"
 *   variant="success"
 *   trend={{ value: 12, direction: 'up', label: '+12% from last month' }}
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  color,
  trend,
  onClick,
  loading = false,
  formatValue,
  className = '',
  style = {},
  hoverable = true
}) => {
  const formattedValue = formatValue ? formatValue(value) : value.toString();

  const cardClassName = [
    'stat-card',
    `stat-card--${variant}`,
    hoverable && onClick ? 'stat-card--clickable' : '',
    loading ? 'stat-card--loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const cardStyle: React.CSSProperties = {
    ...style,
    ...(color ? { borderLeftColor: color } : {})
  } as any;

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && !loading && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  if (loading) {
    return (
      <div className={cardClassName} style={cardStyle}>
        <div className="stat-card__skeleton">
          <div className="stat-card__skeleton-icon"></div>
          <div className="stat-card__skeleton-content">
            <div className="stat-card__skeleton-title"></div>
            <div className="stat-card__skeleton-value"></div>
            <div className="stat-card__skeleton-subtitle"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cardClassName}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...(onClick ? { role: 'button' } : {})}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${formattedValue}` : undefined}
    >
      {icon && <div className="stat-card__icon">{icon}</div>}
      
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <p className="stat-card__value">{formattedValue}</p>
        
        {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
        
        {trend && (
          <div className={`stat-card__trend stat-card__trend--${trend.direction}`}>
            <span className="stat-card__trend-icon">
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
            <span className="stat-card__trend-value">
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="stat-card__trend-label">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Format number with K/M suffixes
 */
export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);

  // Shorten large values
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return formatted;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return `${value.toFixed(decimals)}%`;
}
