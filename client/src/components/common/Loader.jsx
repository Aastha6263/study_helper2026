const sizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-4',
};

const colors = {
  blue:  'border-[#16423C] border-t-transparent',
  white: 'border-white border-t-transparent',
  slate: 'border-[#6A9C89] border-t-transparent',
};

const Loader = ({ size = 'md', color = 'blue', className = '', fullPage = false }) => {
  const spinner = (
    <div
      className={`
        rounded-full animate-spin flex-shrink-0
        shadow-sm
        ${sizes[size]  || sizes.md}
        ${colors[color]|| colors.blue}
        ${className}
      `}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center
                      bg-[#E9EFEC]/70 backdrop-blur-xl z-50">
        <div className="flex flex-col items-center gap-4
                        bg-white/60 backdrop-blur-xl
                        border border-white/40
                        rounded-2xl px-6 py-5
                        shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default Loader;