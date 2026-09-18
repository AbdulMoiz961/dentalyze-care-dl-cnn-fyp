
import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { APP_NAME } from '../constants.ts';

const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L18 14.25l-.25-2.25a4.5 4.5 0 013.09-3.09L23.75 9l-2.846-.813a4.5 4.5 0 01-3.09-3.09L18 1.25l-.25 2.25a4.5 4.5 0 01-3.09 3.09L11.75 9l2.846.813a4.5 4.5 0 013.09 3.09z" />
    </svg>
);


export const CallToActionFooter: React.FC = () => {
  const { currentUser } = useAuth();

  const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentUser) {
      window.location.hash = '#/analyzer';
    } else {
      window.location.hash = '#/login';
    }
  };
  
  return (
    <section className="py-20 md:py-28 bg-slate-800/80 backdrop-blur-sm border-t-2 border-slate-700/70">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 tracking-tight">
          Experience The Future Of Dental Diagnostics With <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{APP_NAME}</span>
        </h2>
        <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join dental professionals leveraging AI for superior diagnostics. Try {APP_NAME} and elevate your patient care with cutting-edge technology designed for precision and efficiency.
        </p>
        <a
          href={currentUser ? "#/analyzer" : "#/login"}
          onClick={handleCTAClick}
          className="inline-flex items-center justify-center group bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-10 py-4 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/60 text-xl focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50"
        >
          <SparkleIcon className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:rotate-12" />
          {currentUser ? 'Open Analyzer' : 'Get Started Now'}
        </a>
      </div>
    </section>
  );
};
