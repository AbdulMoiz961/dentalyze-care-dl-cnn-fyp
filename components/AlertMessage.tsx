
import React from 'react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message?: string; // Make message optional if children are used
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode; // Allow children for more complex content
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);
const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);
const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const WarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);


export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message, onClose, className, children }) => {
  const baseClasses = "p-4 text-sm rounded-lg shadow-lg border flex items-start";
  const typeStyles = {
    error: {
      bg: "bg-red-800/70 border-red-700 text-red-100",
      icon: <ErrorIcon className="w-5 h-5 mr-3 shrink-0 text-red-300" />,
      closeHover: "hover:bg-red-700/50",
    },
    success: {
      bg: "bg-green-800/70 border-green-700 text-green-100",
      icon: <SuccessIcon className="w-5 h-5 mr-3 shrink-0 text-green-300" />,
      closeHover: "hover:bg-green-700/50",
    },
    info: {
      bg: "bg-blue-800/70 border-blue-700 text-blue-100",
      icon: <InfoIcon className="w-5 h-5 mr-3 shrink-0 text-blue-300" />,
      closeHover: "hover:bg-blue-700/50",
    },
    warning: {
      bg: "bg-yellow-800/70 border-yellow-700 text-yellow-100",
      icon: <WarningIcon className="w-5 h-5 mr-3 shrink-0 text-yellow-300" />,
      closeHover: "hover:bg-yellow-700/50",
    },
  };

  const currentTypeStyle = typeStyles[type];

  return (
    <div className={`${baseClasses} ${currentTypeStyle.bg} ${className || ''}`} role="alert">
      {currentTypeStyle.icon}
      <div className="flex-grow">
        {children || message}
      </div>
      {onClose && (
        <button
          type="button"
          className={`ml-auto -mx-1.5 -my-1.5 bg-transparent text-current rounded-lg focus:ring-2 focus:ring-current p-1.5 ${currentTypeStyle.closeHover} inline-flex h-8 w-8 transition-colors duration-150`}
          onClick={onClose}
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </button>
      )}
    </div>
  );
};
