'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import { CalenderIcon } from '@/icons';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "Select date",
  className = "",
  disabled = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = "MM/dd/yyyy"
}) => {
  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        className={`
          w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          ${className}
        `}
        wrapperClassName="w-full"
        popperClassName="z-50"
        popperPlacement="bottom-start"
      />
      <CalenderIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
};