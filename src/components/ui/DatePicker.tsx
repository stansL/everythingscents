'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  disabled?: boolean;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Select date...",
  minDate,
  maxDate,
  disabled = false,
  className = ""
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      placeholderText={placeholder}
      dateFormat="dd/MM/yyyy"
      className={`w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 hover:border-gray-400 dark:hover:border-gray-500
                 transition-colors cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      showPopperArrow={false}
      popperClassName="z-[60]"
      calendarClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
    />
  );
};