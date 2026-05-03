import { forwardRef } from 'react';
import Loader from './Loader';

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
  link:      'btn-link',
};

const sizes = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

const Button = forwardRef(({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth= false,
  leftIcon = null,
  rightIcon= null,
  className= '',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-2xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#16423C]/30

        hover:shadow-md hover:-translate-y-[1px]
        active:scale-[0.98]

        disabled:opacity-60 disabled:cursor-not-allowed

        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading
        ? <Loader size="sm" color={variant === 'primary' ? 'white' : 'blue'} />
        : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {leftIcon}
              </span>
            )}

            <span className="whitespace-nowrap">{children}</span>

            {rightIcon && (
              <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {rightIcon}
              </span>
            )}
          </>
        )
      }
    </button>
  );
});

Button.displayName = 'Button';
export default Button;