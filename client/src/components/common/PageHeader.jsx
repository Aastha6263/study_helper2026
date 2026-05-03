const PageHeader = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div
    className={`
      flex flex-col sm:flex-row sm:items-center sm:justify-between
      gap-4 mb-8
      ${className}
    `}
  >
    <div className="space-y-1">

      <h1 className="text-[22px] sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">
          {subtitle}
        </p>
      )}

    </div>

    {actions && (
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Optional wrapper for better visual grouping */}
        <div className="flex items-center gap-2
                        bg-white/50 backdrop-blur-md
                        border border-white/40
                        rounded-2xl px-2 py-1.5
                        shadow-sm">
          {actions}
        </div>

      </div>
    )}
  </div>
);

export default PageHeader;