import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  footer,
}) => {
  const panelRef = useRef(null);
  useOutsideClick(panelRef, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${sizes[size] || sizes.md}
          bg-white/70 backdrop-blur-2xl
          rounded-2xl border border-white/40
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          animate-scale-in flex flex-col max-h-[90vh]
        `}
      >

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-white/30 flex-shrink-0">
            {title && (
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] tracking-tight">
                {title}
              </h3>
            )}

            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#1A1A1A]/60
                           hover:text-[#16423C]
                           hover:bg-white/50 hover:shadow-sm
                           hover:-translate-y-[1px]
                           transition-all duration-200 ml-auto"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/30 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;