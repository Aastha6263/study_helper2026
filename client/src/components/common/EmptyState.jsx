const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`
      flex flex-col items-center justify-center text-center
      bg-white/60 backdrop-blur-xl
      border border-white/40
      rounded-2xl
      shadow-[0_8px_30px_rgba(0,0,0,0.05)]
      px-6 py-10
      ${className}
    `}
  >
    {icon && (
      <div className="w-16 h-16 rounded-2xl
                      bg-gradient-to-br from-[#16423C]/10 to-[#6A9C89]/20
                      flex items-center justify-center
                      text-[#6A9C89]
                      shadow-inner mb-4">
        {icon}
      </div>
    )}

    <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1 tracking-tight">
      {title}
    </h3>

    {description && (
      <p className="text-sm text-[#1A1A1A]/60 max-w-xs leading-relaxed">
        {description}
      </p>
    )}

    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
);

export default EmptyState;