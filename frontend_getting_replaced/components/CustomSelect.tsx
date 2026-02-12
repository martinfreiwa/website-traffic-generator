import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[#f9fafb] border ${isOpen ? 'border-[#ff4d00]' : 'border-gray-200'} p-3 text-sm font-bold text-gray-900 outline-none flex justify-between items-center transition-all duration-200 rounded-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-[#ff4d00]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] z-50 max-h-60 overflow-y-auto mt-1 animate-in fade-in zoom-in-95 duration-100 rounded-sm">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#ff4d00] hover:text-white flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && <Check size={14} className="flex-shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;