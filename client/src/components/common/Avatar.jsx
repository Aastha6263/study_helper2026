import { getInitials } from '../../utils/formatters';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizeClass = sizes[size] || sizes.md;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`rounded-full object-cover flex-shrink-0
                    ring-2 ring-white/60 shadow-sm
                    ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        font-semibold flex-shrink-0 select-none
        bg-gradient-to-br from-[#16423C] to-[#6A9C89]
        text-white shadow-md shadow-[#16423C]/20
        ring-2 ring-white/60
        ${sizeClass} ${className}
      `}
    >
      {getInitials(user?.name)}
    </div>
  );
};

export default Avatar;