import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  rows = 3,
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

    <textarea
      ref={ref}
      rows={rows}
      className={`
        w-full rounded-2xl
        bg-white/60 backdrop-blur-md
        border border-white/40
        shadow-sm

        text-[14px] text-[#1A1A1A]
        placeholder:text-[#1A1A1A]/40

        focus:outline-none
        focus:ring-2 focus:ring-[#16423C]/30
        focus:border-[#16423C]

        transition-all duration-200

        ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-500' : ''}

        px-3 py-2.5
        resize-none

        ${className}
      `}
      {...props}
    />

    {error && (
      <p className="text-[11px] text-red-500 mt-1">
        {error}
      </p>
    )}

    {!error && hint && (
      <p className="text-[11px] text-[#1A1A1A]/50 mt-1">
        {hint}
      </p>
    )}

  </div>
));

Textarea.displayName = 'Textarea';
export default Textarea;