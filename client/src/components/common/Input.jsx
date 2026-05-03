import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  required,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${wrapperClassName}`}>

      {label && (
        <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1.5 tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">

        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center
                          pointer-events-none text-[#6A9C89]">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
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

            ${leftIcon  ? 'pl-9'  : 'pl-3'}
            ${rightIcon ? 'pr-9'  : 'pr-3'}
            py-2.5

            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center
                          pointer-events-none text-[#6A9C89]">
            {rightIcon}
          </div>
        )}
      </div>

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
  );
});

Input.displayName = 'Input';
export default Input;