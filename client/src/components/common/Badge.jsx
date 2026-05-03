const variants = {
  blue:    'badge-blue',
  green:   'badge-green',
  yellow:  'badge-yellow',
  red:     'badge-red',
  slate:   'badge-slate',
  // Priority
  low:     'priority-low',
  medium:  'priority-medium',
  high:    'priority-high',
  urgent:  'priority-urgent',
  // Status
  todo:        'status-todo',
  in_progress: 'status-in_progress',
  completed:   'status-completed',
  overdue:     'status-overdue',
  cancelled:   'status-cancelled',
};

const Badge = ({ children, variant = 'slate', className = '', dot = false }) => (
  <span
    className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      rounded-full text-[11px] font-medium
      backdrop-blur-md border border-white/40
      shadow-sm
      ${variants[variant] || 'badge-slate'}
      ${className}
    `}
  >
    {dot && (
      <span
        className={`w-1.5 h-1.5 rounded-full inline-block
        ${variant === 'green' || variant === 'completed' ? 'bg-[#6A9C89]' : ''}
        ${variant === 'red'   || variant === 'overdue'   ? 'bg-red-500'  : ''}
        ${variant === 'blue'  || variant === 'in_progress'? 'bg-[#16423C]': ''}
        ${variant === 'yellow'|| variant === 'high'      ? 'bg-yellow-500' : ''}
        ${variant === 'slate' || variant === 'todo'      ? 'bg-gray-400'   : ''}
      `}
      />
    )}

    {children}
  </span>
);

export default Badge;