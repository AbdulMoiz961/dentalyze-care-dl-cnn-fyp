
import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);


export const HeroSection: React.FC = () => {
  const { currentUser } = useAuth();

  const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentUser) {
      window.location.hash = '#/analyzer';
    } else {
      window.location.hash = '#/login';
    }
  };
  
  const handleLearnMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth'});
    } else {
        window.location.hash = '#/'; 
        setTimeout(() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth'});
        }, 100);
    }
  };

  return (
    <section className="py-28 md:py-44 bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900 relative overflow-hidden">
        {/* Subtle background glow elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-700/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-2000"></div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold text-white leading-tight mb-8 tracking-tighter">
          Revolutionizing Dental Diagnostics <span className="block md:inline text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">With AI</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-200/90 mb-14 max-w-3xl mx-auto leading-relaxed">
          Experience intelligent X-ray analysis for accurate, efficient dental health assessments. Get insights quickly and make informed decisions for better patient care.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-5 sm:space-y-0 sm:space-x-6">
          <a
            href={currentUser ? "#/analyzer" : "#/login"}
            onClick={handleCTAClick}
            className="inline-flex items-center justify-center group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-10 py-4 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/60 text-lg focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50"
          >
            {currentUser ? 'Go to Analyzer' : 'Scan Your First X-Ray'}
            <ArrowRightIcon className="w-5 h-5 ml-3 transform transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href="#features"
            onClick={handleLearnMoreClick}
            className="inline-flex items-center justify-center group bg-transparent hover:bg-purple-500/10 text-purple-300 hover:text-purple-200 font-semibold px-10 py-4 rounded-lg border-2 border-purple-500/70 hover:border-purple-400 transition-all duration-300 text-lg focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-30"
          >
            <InfoIcon className="w-5 h-5 mr-3 transition-colors duration-300 group-hover:text-purple-300" />
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};
