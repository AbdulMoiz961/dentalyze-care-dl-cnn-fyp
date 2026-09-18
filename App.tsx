
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyzerPage } from './pages/AnalyzerPage'; 
import { HomePageContent } from './components/HomePageContent'; 
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { FAQPage } from './pages/FAQPage'; // Added FAQPage import

const getCleanHashRoute = () => {
  const hash = window.location.hash;
  let path = hash.split('?')[0];
  if (!path || path === '#') {
    return '#/';
  }
  return path;
};

const getQueryParam = (param: string): string | null => {
  const hash = window.location.hash;
  const queryPart = hash.split('?')[1];
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    return params.get(param);
  }
  return null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallbackUI;
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState(getCleanHashRoute());
  const [currentPatientIdQuery, setCurrentPatientIdQuery] = useState<string | null>(getQueryParam('patientId'));
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getCleanHashRoute());
      setCurrentPatientIdQuery(getQueryParam('patientId'));
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  useEffect(() => {
    if (!isLoading) { 
      const cleanRoute = getCleanHashRoute();
      const protectedRoutes = ['#/profile', '#/history', '#/analyzer', '#/patients', '#/patient-detail']; 
      const authPages = ['#/login', '#/signup'];

      if (currentUser && authPages.includes(cleanRoute)) {
        window.location.hash = '#/analyzer'; 
      } else if (!currentUser && protectedRoutes.some(pr => cleanRoute.startsWith(pr))) {
         window.location.hash = '#/login'; 
      } else if (currentUser && currentUser.role === 'dentist' && cleanRoute === '#/analyzer' && (currentUser.patients?.length ?? 0) === 0 && getQueryParam('fromPatientsPage') !== 'true') {
        const currentHash = window.location.hash; 
        const targetHash = '#/patients?firstPatientSetup=true';
        if (currentHash !== targetHash) { 
             window.location.hash = targetHash;
        }
      }
    }
  }, [currentRoute, currentUser, isLoading]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center p-8 rounded-lg">
          <svg className="animate-spin h-12 w-12 text-purple-500 mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-2xl font-display tracking-wide">Loading Application...</p> 
        </div>
      </div>
    );
  }
  
  const renderPage = () => {
    if (currentRoute === '#/login') return <LoginPage />;
    if (currentRoute === '#/signup') return <SignupPage />;
    if (currentRoute === '#/faq') return <FAQPage />; // Added FAQPage route

    if (currentUser) {
        if (currentRoute === '#/profile') return <ProfilePage />;
        if (currentRoute === '#/history') return <HistoryPage patientIdForFilter={currentPatientIdQuery} />;
        if (currentRoute === '#/analyzer') return <AnalyzerPage patientIdFromQuery={currentPatientIdQuery} />;
        if (currentUser.role === 'dentist') {
            if (currentRoute === '#/patients') return <PatientsPage />;
            if (currentRoute.startsWith('#/patient-detail')) {
                 const patientId = currentRoute.split('/')[2];
                 return patientId ? <PatientDetailPage patientId={patientId} /> : <PatientsPage />; 
            }
        }
    }
    
    if (currentRoute === '#/' || 
        currentRoute === '#/home' || 
        currentRoute.startsWith('#about') || 
        currentRoute.startsWith('#features') ||
        currentRoute.startsWith('#contact') ||
        (currentUser && (currentRoute === '#/login' || currentRoute === '#/signup')))
       {
      return <HomePageContent />;
    }
    
    if (!currentUser && (currentRoute !== '#/login' && currentRoute !== '#/signup' && currentRoute !== '#/faq')) {
      window.location.hash = '#/login';
      return <LoginPage />; 
    }
    
    // Allow access to FAQ page even if not logged in
    if (currentRoute === '#/faq') return <FAQPage />;

    return <HomePageContent />; 
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/70 text-gray-100 font-sans">
      <Navbar />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const fallbackUI = (
    <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#cbd5e1', // slate-300
        backgroundColor: '#020617', // slate-950
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
      <h1 style={{ fontSize: '2.5rem', color: '#a78bfa', marginBottom: '20px' }}>Application Error</h1> {/* purple-400 */}
      <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>We're sorry, something went wrong.</p>
      <p style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '30px' }}> {/* slate-400 */}
        Please try refreshing the page. If the problem persists, contact support.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#7c3aed', // purple-600
          color: 'white',
          padding: '12px 25px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6d28d9')} // purple-700
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
      >
        Refresh Page
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallbackUI={fallbackUI}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;