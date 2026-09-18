
import React from 'react';
import { APP_NAME } from '../constants';

const SocialIcon: React.FC<{ href: string; children: React.ReactNode; label: string }> = ({ href, children, label }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-slate-400 hover:text-purple-400 transition-colors duration-200 transform hover:scale-110"
    aria-label={label}
  >
    {children}
  </a>
);

const LinkedInIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path></svg>;
const TwitterIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>;
const GithubIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.09.682-.218.682-.484 0-.238-.009-.868-.013-1.703-2.782.602-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.891 1.529 2.341 1.088 2.91.832.091-.647.349-1.088.635-1.338-2.22-.252-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.548 9.548 0 0112 6.836c.85.004 1.705.114 2.505.336 1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.203 2.394.1 2.647.64.698 1.028 1.591 1.028 2.682 0 3.842-2.338 4.687-4.565 4.935.358.307.678.917.678 1.85 0 1.336-.012 2.415-.012 2.741 0 .269.18.579.688.481A10.005 10.005 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>;

const ToothIconSimple: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.754 2.863a2.25 2.25 0 00-1.508 0L7.142 5.327A2.25 2.25 0 006 7.277V12.64c0 .591.224 1.148.616 1.587l3.118 3.508a2.25 2.25 0 003.532 0l3.118-3.508A2.25 2.25 0 0018 12.639V7.277a2.25 2.25 0 00-1.142-1.95L12.754 2.863z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    const currentBaseHash = window.location.hash.split('?')[0] || '#/';
    if (path.startsWith('#/') || path === '#') {
        const targetPath = path === '#' ? '#/' : path;
        window.location.hash = targetPath;
         if (targetPath === '#/' || targetPath === '#/home') {
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        }
    } else if (path.startsWith('#') && path.length > 1) {
        const sectionId = path.substring(1);
        if (currentBaseHash !== '#/' && currentBaseHash !== '#/home') {
            window.location.hash = '#/';
            setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  };

  const footerLinkClasses = "text-sm text-slate-400 hover:text-purple-300 transition-colors duration-200 hover:underline";

  return (
    <footer id="contact" className="bg-slate-950 border-t-2 border-slate-800/70 font-sans">
      <div className="max-w-screen-xl mx-auto py-16 px-6 sm:px-8 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 xl:gap-12 mb-12">
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-5">
              <ToothIconSimple className="h-8 w-8 mr-2.5 text-purple-400" />
              <h3 className="text-2xl font-display font-bold text-white">{APP_NAME}</h3>
            </div>
            <p className="text-sm text-slate-400/90 leading-relaxed">
              Precision Diagnostics for Better Dental Health. Leveraging AI to empower dental professionals and enhance patient care.
            </p>
            <div className="mt-8 flex space-x-6">
              <SocialIcon href="#" label="LinkedIn"><LinkedInIcon /></SocialIcon>
              <SocialIcon href="#" label="Twitter"><TwitterIcon /></SocialIcon>
              <SocialIcon href="#" label="GitHub"><GithubIcon /></SocialIcon>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-display font-semibold text-white mb-5">Quick Links</h3>
            <ul className="space-y-3.5">
              <li><a href="#/analyzer" onClick={(e)=>handleNav(e, '#/analyzer')} className={footerLinkClasses}>Analyze X-Ray</a></li>
              <li><a href="#features" onClick={(e)=>handleNav(e, '#features')} className={footerLinkClasses}>Features</a></li>
              <li><a href="#about" onClick={(e)=>handleNav(e, '#about')} className={footerLinkClasses}>About Us</a></li>
              <li><a href="#/faq" onClick={(e)=>handleNav(e, '#/faq')} className={footerLinkClasses}>FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-display font-semibold text-white mb-5">Legal</h3>
            <ul className="space-y-3.5">
              <li><a href="#" onClick={(e)=>handleNav(e, '#')} className={footerLinkClasses}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e)=>handleNav(e, '#')} className={footerLinkClasses}>Terms of Service</a></li>
              <li><a href="#" onClick={(e)=>handleNav(e, '#')} className={footerLinkClasses}>Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-display font-semibold text-white mb-5">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="mailto:info@dentalyze.care" className="hover:text-purple-300 transition-colors">info@dentalyze.care</a></li>
              <li>DHA Suffa University, Karachi</li>
              <li>(123) 456-7890</li> {/* Placeholder phone */}
            </ul>
          </div>
        </div>
        
        <div className="text-center text-xs text-slate-500 pt-10 border-t border-slate-800/70">
          <p>&copy; {currentYear} {APP_NAME}. All Rights Reserved. AI-powered dental insights for a brighter smile.</p>
        </div>
      </div>
    </footer>
  );
};