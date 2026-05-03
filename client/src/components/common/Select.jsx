import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  wrapperClassName = '',
  required,
  ...props
}, ref) => (
  <div className={`w-full ${wrapperClassName}`}>

    {label && (
      <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1.5 tracking-tight">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}

    <div className="relative">

      <select
        ref={ref}
        className={`
          w-full rounded-2xl
          bg-white/60 backdrop-blur-md
          border border-white/40
          shadow-sm

          text-[14px] text-[#1A1A1A]
          appearance-none

          focus:outline-none
          focus:ring-2 focus:ring-[#16423C]/30
          focus:border-[#16423C]

          transition-all duration-200

          ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-500' : ''}

          px-3 py-2.5 pr-9
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2
                   text-[#6A9C89] pointer-events-none"
      />

    </div>

    {error && (
      <p className="text-[11px] text-red-500 mt-1">
        {error}
      </p>
    )}

  </div>
));

Select.displayName = 'Select';
export default Select;