import React, { useState, useEffect } from 'react';
import './DatePickerModal.css';

export interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate?: string; // ISO 8601 format: YYYY-MM-DD
  minDate?: string;
  maxDate?: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

/**
 * Modal component with interactive calendar for date selection
 */
export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  selectedDate,
  minDate,
  maxDate,
  onDateSelect,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setCurrentDate(date);
    } else {
      setCurrentDate(new Date());
    }
  }, [selectedDate, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleYearClick = () => {
    setViewMode('year');
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth()));
    setViewMode('month');
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!isDateDisabled(date)) {
      const dateStr = date.toISOString().split('T')[0];
      onDateSelect(dateStr);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderMonthView = () => (
    <div className="date-picker-modal__calendar">
      <div className="date-picker-modal__header">
        <button
          type="button"
          className="date-picker-modal__nav-button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <button
          type="button"
          className="date-picker-modal__month-year"
          onClick={handleYearClick}
        >
          {monthName} {year}
        </button>
        <button
          type="button"
          className="date-picker-modal__nav-button"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="date-picker-modal__weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="date-picker-modal__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="date-picker-modal__days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="date-picker-modal__day--empty"></div>;
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);

          return (
            <button
              key={day}
              type="button"
              className={`date-picker-modal__day ${selected ? 'date-picker-modal__day--selected' : ''} ${
                disabled ? 'date-picker-modal__day--disabled' : ''
              }`}
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              aria-label={`${monthName} ${day}, ${year}`}
              {...(selected && { 'aria-pressed': 'true' })}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderYearView = () => {
    const startYear = Math.floor(year / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="date-picker-modal__year-picker">
        <div className="date-picker-modal__header">
          <button
            type="button"
            className="date-picker-modal__nav-button"
            onClick={() => setCurrentDate(new Date(startYear - 10, currentDate.getMonth()))}
            aria-label="Previous decade"
          >
            ‹
          </button>
          <span className="date-picker-modal__year-range">
            {startYear} - {startYear + 11}
          </span>
          <button
            type="button"
            className="date-picker-modal__nav-button"
            onClick={() => setCurrentDate(new Date(startYear + 10, currentDate.getMonth()))}
            aria-label="Next decade"
          >
            ›
          </button>
        </div>

        <div className="date-picker-modal__years">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={`date-picker-modal__year ${y === year ? 'date-picker-modal__year--selected' : ''}`}
              onClick={() => handleYearSelect(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="date-picker-modal__backdrop" onClick={handleBackdropClick}>
      <div className="date-picker-modal">
        <div className="date-picker-modal__close-button">
          <button
            type="button"
            className="date-picker-modal__close"
            onClick={onClose}
            aria-label="Close date picker"
          >
            ✕
          </button>
        </div>

        {viewMode === 'month' ? renderMonthView() : renderYearView()}
      </div>
    </div>
  );
};
