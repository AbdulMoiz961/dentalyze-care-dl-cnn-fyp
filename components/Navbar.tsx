
import React, { useState, useEffect } from 'react';
import { APP_NAME } from '../constants.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

const ToothIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.754 2.863a2.25 2.25 0 00-1.508 0L7.142 5.327A2.25 2.25 0 006 7.277V12.64c0 .591.224 1.148.616 1.587l3.118 3.508a2.25 2.25 0 003.532 0l3.118-3.508A2.25 2.25 0 0018 12.639V7.277a2.25 2.25 0 00-1.142-1.95L12.754 2.863zM12 4.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V5.25A.75.75 0 0112 4.5z" />
    <path fillRule="evenodd" d="M10.523 18.406c.338.379.793.63 1.29.727c.06.012.12.028.187.039a2.25 2.25 0 001.142-.766l3.118-3.508A2.25 2.25 0 0018 12.64V10.5a.75.75 0 00-1.5 0v2.139a.75.75 0 01-.205.53l-3.118 3.507a.75.75 0 01-1.177 0L8.884 13.17a.75.75 0 01-.205-.53V10.5a.75.75 0 00-1.5 0v2.14a2.25 2.25 0 00.616 1.587l2.728 3.18z" clipRule="evenodd" />
  </svg>
);

const HamburgerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-3.75 5.25h-16.5" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const NavLink: React.FC<{ href: string; onClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void; children: React.ReactNode; isActive?: boolean; ariaLabel?: string; className?: string; isMobile?: boolean }> = 
  ({ href, onClick, children, isActive, ariaLabel, className, isMobile }) => (
  <a
    href={href}
    onClick={(e) => onClick(e, href)}
    className={`transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                ${isMobile 
                  ? `block px-3 py-3 rounded-md text-base font-medium ${isActive ? 'bg-purple-700 text-white' : 'text-slate-200 hover:bg-slate-700 hover:text-white'}`
                  : `px-4 py-2.5 rounded-md text-sm font-medium ${isActive ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:bg-purple-700/70 hover:text-white'}`
                } ${className || ''}`}
    aria-label={ariaLabel || String(children)}
  >
    {children}
  </a>
);

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const currentHash = window.location.hash.split('?')[0] || '#/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { // Cleanup on component unmount
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const mainNavLinks = [
    { name: 'Home', href: '#/' },
    { name: 'About', href: '#about' }, 
    { name: 'Features', href: '#features' }, 
    { name: 'FAQ', href: '#/faq' }, // Added FAQ link
  ];
  
  const analyzerLink = { name: 'Analyzer', href: '#/analyzer' };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    try {
      await logout();
      window.location.hash = '#/login';
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };
  
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    const currentBaseHash = window.location.hash.split('?')[0] || '#/';
    const targetPathOnly = path.split('?')[0];

    if (targetPathOnly.startsWith('#/') || targetPathOnly === '#') { 
        window.location.hash = path; 
        if (targetPathOnly === '#/' || targetPathOnly === '#/home') { 
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        }
    } else if (targetPathOnly.startsWith('#') && targetPathOnly.length > 1) { 
        const sectionId = targetPathOnly.substring(1);
        if (currentBaseHash !== '#/' && currentBaseHash !== '#/home') {
            window.location.hash = '#/'; 
            setTimeout(() => { 
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150); 
        } else { 
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    setIsMobileMenuOpen(false); // Close mobile menu on any navigation
  };

  const renderNavLinks = (isMobile: boolean) => (
    <>
      {mainNavLinks.map((item) => (
        <NavLink 
          key={item.name} 
          href={item.href} 
          onClick={handleNavigation}
          isActive={item.href === '#/' ? (currentHash === '#/' || currentHash === '#/home') : currentHash.startsWith(item.href)}
          isMobile={isMobile}
        >
          {item.name}
        </NavLink>
      ))}
      <NavLink 
        key={analyzerLink.name} 
        href={analyzerLink.href} 
        onClick={handleNavigation}
        isActive={currentHash === analyzerLink.href}
        isMobile={isMobile}
      >
        {analyzerLink.name}
      </NavLink>
      {currentUser && (
        <>
          {currentUser.role === 'dentist' && (
            <NavLink href="#/patients" onClick={handleNavigation} isActive={currentHash === '#/patients' || currentHash.startsWith('#/patient-detail')} isMobile={isMobile}>Patients</NavLink>
          )}
          <NavLink href="#/history" onClick={handleNavigation} isActive={currentHash === '#/history'} isMobile={isMobile}>History</NavLink>
          <NavLink href="#/profile" onClick={handleNavigation} isActive={currentHash === '#/profile'} isMobile={isMobile}>Profile</NavLink>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-slate-900/80 backdrop-blur-lg shadow-xl sticky top-0 z-50 font-display border-b border-slate-800/70">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#/" onClick={(e) => handleNavigation(e, '#/')} className="flex items-center text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-sm">
              <ToothIcon className="h-9 w-9 mr-2.5 text-purple-400" />
              <span className="font-bold text-3xl tracking-tight">{APP_NAME}</span>
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-2">
            {renderNavLinks(false)}
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-150 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Logout
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <NavLink 
                  href="#/login" 
                  onClick={handleNavigation} 
                  className="hover:bg-purple-800/60"
                  isActive={currentHash === '#/login'}
                >
                  Login
                </NavLink>
                <a
                  href="#/signup"
                  onClick={(e) => handleNavigation(e, '#/signup')}
                  className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-150 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${currentHash === '#/signup' ? 'ring-2 ring-purple-300 ring-offset-0' : ''}`}
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <CloseIcon className="block h-7 w-7" /> : <HamburgerIcon className="block h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel (Side Slide) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden" // Increased overlay z-index
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full w-3/4 max-w-xs bg-slate-800 shadow-xl z-[60] transform transition-transform duration-300 ease-in-out md:hidden border-r border-slate-700
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} // Increased panel z-index
      >
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center mb-4">
             <a href="#/" onClick={(e) => handleNavigation(e, '#/')} className="flex items-center text-white">
                <ToothIcon className="h-8 w-8 mr-2 text-purple-400" />
                <span className="font-bold text-2xl">{APP_NAME}</span>
            </a>
            <button
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          {renderNavLinks(true)}
          <div className="pt-4 mt-4 border-t border-slate-700">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-3 rounded-md text-base font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink href="#/login" onClick={handleNavigation} isMobile={true} className="bg-purple-600 hover:bg-purple-700 text-white text-center block mb-2">Login</NavLink>
                <NavLink href="#/signup" onClick={handleNavigation} isMobile={true} className="bg-transparent border border-purple-500 hover:bg-purple-500/20 text-purple-300 text-center block">Sign Up</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};