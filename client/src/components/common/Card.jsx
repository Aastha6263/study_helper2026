const Card = ({
  children,
  className = '',
  hover     = false,
  padding   = 'md',
  onClick,
}) => {
  const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-8', none: '' };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white/60 backdrop-blur-xl
        rounded-2xl border border-white/40
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]

        ${paddings[padding] || paddings.md}

        ${
          hover
            ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] hover:bg-white/70 transition-all duration-200 cursor-pointer'
            : ''
        }

        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;