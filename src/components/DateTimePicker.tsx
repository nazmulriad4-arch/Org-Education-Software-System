import React, { useState, useEffect, useRef } from 'react';

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function parseDateTimeString(val?: string) {
  if (!val || !val.trim()) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
      hour: 12,
      minute: 0,
      ampm: 'AM' as 'AM' | 'PM',
      hasValue: false
    };
  }

  const clean = val.trim();

  // Pattern 1: YYYY-MM-DD hh:mm AM/PM or YYYY-MM-DD h:mm A
  const ampmMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (ampmMatch) {
    const year = parseInt(ampmMatch[1], 10);
    const month = parseInt(ampmMatch[2], 10) - 1;
    const date = parseInt(ampmMatch[3], 10);
    let hour = parseInt(ampmMatch[4], 10);
    const minute = parseInt(ampmMatch[5], 10);
    let ampm: 'AM' | 'PM' = 'AM';

    if (ampmMatch[6]) {
      ampm = ampmMatch[6].toUpperCase() as 'AM' | 'PM';
      if (hour === 0) hour = 12;
      if (hour > 12) hour = hour % 12 || 12;
    } else {
      if (hour >= 12) {
        ampm = 'PM';
        if (hour > 12) hour -= 12;
      } else {
        ampm = 'AM';
        if (hour === 0) hour = 12;
      }
    }

    return { year, month, date, hour, minute, ampm, hasValue: true };
  }

  // Pattern 2: YYYY-MM-DDTHH:mm
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{2})/i);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const date = parseInt(isoMatch[3], 10);
    const h24 = parseInt(isoMatch[4], 10);
    const minute = parseInt(isoMatch[5], 10);
    const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let hour = h24 % 12;
    if (hour === 0) hour = 12;

    return { year, month, date, hour, minute, ampm, hasValue: true };
  }

  // Pattern 3: YYYY-MM-DD
  const dateOnlyMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const date = parseInt(dateOnlyMatch[3], 10);
    return { year, month, date, hour: 12, minute: 0, ampm: 'AM' as const, hasValue: true };
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const h24 = d.getHours();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      date: d.getDate(),
      hour: (h24 % 12) || 12,
      minute: d.getMinutes(),
      ampm: (h24 >= 12 ? 'PM' : 'AM') as 'AM' | 'PM',
      hasValue: true
    };
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate(),
    hour: 12,
    minute: 0,
    ampm: 'AM' as const,
    hasValue: false
  };
}

function formatResult(year: number, month: number, date: number, hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  const yyyy = year.toString();
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(date).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} ${ampm}`;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD hh:mm A',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'date' | 'time'>('date');
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  // Parsed components of current value
  const parsed = parseDateTimeString(value);

  // Calendar navigation state (year & month shown)
  const [navYear, setNavYear] = useState(parsed.year);
  const [navMonth, setNavMonth] = useState(parsed.month);

  // Selected date components
  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDate, setSelectedDate] = useState(parsed.date);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedAmpm, setSelectedAmpm] = useState<'AM' | 'PM'>(parsed.ampm);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseDateTimeString(value);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDate(p.date);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedAmpm(p.ampm);
    setNavYear(p.year);
    setNavMonth(p.month);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If there's limited room below and more room above, flip upward
      if (spaceBelow < 330 && spaceAbove > 330) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
    const p = parseDateTimeString(value);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDate(p.date);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedAmpm(p.ampm);
    setNavYear(p.year);
    setNavMonth(p.month);
    setView('date'); // Always start with date view per requirement
    setIsOpen(true);
  };

  // Month navigation in Date view
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear(prev => prev - 1);
    } else {
      setNavMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear(prev => prev + 1);
    } else {
      setNavMonth(prev => prev + 1);
    }
  };

  // Day navigation in Time view
  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = new Date(selectedYear, selectedMonth, selectedDate - 1);
    setSelectedYear(cur.getFullYear());
    setSelectedMonth(cur.getMonth());
    setSelectedDate(cur.getDate());
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = new Date(selectedYear, selectedMonth, selectedDate + 1);
    setSelectedYear(cur.getFullYear());
    setSelectedMonth(cur.getMonth());
    setSelectedDate(cur.getDate());
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
  };

  // Date selection click: sets the date and immediately switches to Time view
  const handleSelectDay = (dayYear: number, dayMonth: number, dayDate: number) => {
    setSelectedYear(dayYear);
    setSelectedMonth(dayMonth);
    setSelectedDate(dayDate);
    setNavYear(dayYear);
    setNavMonth(dayMonth);
    // Transition to Time selection view
    setView('time');
  };

  // Time selection click: sets hour and AM/PM, formats result, notifies onChange and closes
  const handleSelectHour = (hour: number, ampm: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedAmpm(ampm);
    // Clear minutes to 00 upon selecting an exact hour
    setSelectedMinute(0);
    const formatted = formatResult(selectedYear, selectedMonth, selectedDate, hour, 0, ampm);
    onChange(formatted);
    setIsOpen(false);
  };

  // Calendar days grid computation
  const daysInNavMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(navYear, navMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(navYear, navMonth, 0).getDate();

  const calendarDays: Array<{
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isSelected: boolean;
  }> = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = navMonth === 0 ? 11 : navMonth - 1;
    const y = navMonth === 0 ? navYear - 1 : navYear;
    const isSelected = y === selectedYear && m === selectedMonth && d === selectedDate;
    calendarDays.push({
      date: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSelected
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInNavMonth; d++) {
    const isSelected = navYear === selectedYear && navMonth === selectedMonth && d === selectedDate;
    calendarDays.push({
      date: d,
      month: navMonth,
      year: navYear,
      isCurrentMonth: true,
      isSelected
    });
  }

  // Leading days of next month (fill up to 42 cells = 6 rows)
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const m = navMonth === 11 ? 0 : navMonth + 1;
    const y = navMonth === 11 ? navYear + 1 : navYear;
    const isSelected = y === selectedYear && m === selectedMonth && d === selectedDate;
    calendarDays.push({
      date: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSelected
    });
  }

  // Display text in input box
  const displayValue = value || '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Box matching image */}
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={handleOpen}
        disabled={disabled}
        className={className || `w-full border ${isOpen ? 'border-[#3b82f6] ring-2 ring-blue-100' : 'border-gray-300'} rounded px-3 py-1.5 text-[13px] text-gray-700 bg-white focus:outline-none cursor-pointer transition-all font-sans select-none shadow-3xs`}
      />

      {/* Popover */}
      {isOpen && (
        <div 
          className={`absolute ${placement === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} left-0 z-[99999] bg-white border border-gray-300 rounded-lg shadow-2xl p-3 w-[270px] select-none text-gray-800 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Caret pointing toward input */}
          {placement === 'top' ? (
            <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-white border-b border-r border-gray-300 transform rotate-45" />
          ) : (
            <div className="absolute -top-1.5 left-5 w-3 h-3 bg-white border-t border-l border-gray-300 transform rotate-45" />
          )}

          {/* VIEW 1: Date Calendar */}
          {view === 'date' && (
            <div>
              {/* Header: ⬅  Month Year  ➡ */}
              <div className="flex items-center justify-between px-1 mb-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 text-gray-800 rounded transition-colors"
                  title="Previous Month"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                </button>

                <div className="font-bold text-[15px] text-gray-800 font-sans">
                  {MONTH_NAMES[navMonth]} {navYear}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 text-gray-800 rounded transition-colors"
                  title="Next Month"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z" />
                  </svg>
                </button>
              </div>

              {/* Day of Week Headers: Su Mo Tu We Th Fr Sa */}
              <div className="grid grid-cols-7 mb-1 text-center">
                {WEEKDAY_NAMES.map((day) => (
                  <div key={day} className="text-[13px] font-bold text-gray-800 py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {calendarDays.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.year, cell.month, cell.date)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center text-[13.5px] rounded transition-colors ${
                      cell.isSelected
                        ? 'bg-[#0066cc] text-white font-bold rounded-[6px] shadow-sm'
                        : cell.isCurrentMonth
                        ? 'text-gray-800 hover:bg-gray-100 font-normal'
                        : 'text-gray-400 hover:bg-gray-50 font-normal'
                    }`}
                  >
                    {cell.date}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: Time Selector (matches image_72dfc7c7.png) */}
          {view === 'time' && (
            <div>
              {/* Header: ⬅  DD Month YYYY  ➡ */}
              <div className="flex items-center justify-between px-1 mb-2">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1 hover:bg-gray-100 text-gray-800 rounded transition-colors"
                  title="Previous Day"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setView('date')}
                  className="font-bold text-[15px] text-gray-800 font-sans hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to change date from calendar"
                >
                  <span>{selectedDate} {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1 hover:bg-gray-100 text-gray-800 rounded transition-colors"
                  title="Next Day"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z" />
                  </svg>
                </button>
              </div>

              {/* AM SECTION */}
              <div className="mt-1">
                <div className="text-center font-normal text-gray-800 text-[20px] tracking-wide mb-0.5">
                  AM
                </div>
                <div className="border-b border-gray-200 mb-2"></div>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {HOURS.map((hour) => {
                    const isSelected = selectedHour === hour && selectedAmpm === 'AM';
                    return (
                      <button
                        key={`AM-${hour}`}
                        type="button"
                        onClick={() => handleSelectHour(hour, 'AM')}
                        className={`h-8 flex items-center justify-center text-[14px] rounded transition-colors ${
                          isSelected
                            ? 'bg-[#0066cc] text-white font-bold rounded-[6px] shadow-sm'
                            : 'text-gray-800 hover:bg-gray-100 font-normal'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PM SECTION */}
              <div className="mt-2.5">
                <div className="text-center font-normal text-gray-800 text-[20px] tracking-wide mb-0.5">
                  PM
                </div>
                <div className="border-b border-gray-200 mb-2"></div>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {HOURS.map((hour) => {
                    const isSelected = selectedHour === hour && selectedAmpm === 'PM';
                    return (
                      <button
                        key={`PM-${hour}`}
                        type="button"
                        onClick={() => handleSelectHour(hour, 'PM')}
                        className={`h-8 flex items-center justify-center text-[14px] rounded transition-colors ${
                          isSelected
                            ? 'bg-[#0066cc] text-white font-bold rounded-[6px] shadow-sm'
                            : 'text-gray-800 hover:bg-gray-100 font-normal'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Return to calendar footer */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => setView('date')}
                  className="text-xs text-[#0066cc] hover:underline font-semibold"
                >
                  ← Select Another Date
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
