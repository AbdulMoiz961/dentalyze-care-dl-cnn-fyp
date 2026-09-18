
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { AnalysisHistoryItem } from '../types.ts';
import { ReportDisplay } from '../components/ReportDisplay.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { ShareReportModal } from '../components/ShareReportModal.tsx'; 
import { apiGetHistory, apiDeleteAnalysis } from '../services/serviceService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.094m7.096-1.226c-.74-.09-1.407-.162-2.048-.222M7.84 4.852A48.09 48.09 0 0112 4.5c2.291 0 4.514.397 6.917.986M2.25 12h19.5M12 4.5v.75m0 15c5.523 0 10-4.477 10-10S17.523 2.25 12 2.25 2 6.727 2 12s4.477 10 10 10z" />
    </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.044.588.05H11.25c.977 0 1.909-.422 2.56-.971L16.5 9.25m-9.283 3.842A2.252 2.252 0 007.5 15.692M15 14.25v.75a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25V15m3.75-3.75H16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5h-6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);


const NoHistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

interface HistoryPageProps {
  patientIdForFilter?: string | null; 
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ patientIdForFilter }) => {
  const { currentUser } = useAuth();
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [isGeneratingPdfForItem, setIsGeneratingPdfForItem] = useState<string | null>(null); 
  const [pageTitle, setPageTitle] = useState("Your Analysis History");
  const [showShareModal, setShowShareModal] = useState(false);
  const [itemToShare, setItemToShare] = useState<AnalysisHistoryItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getPatientNameById = useCallback((patientId: string): string | null => {
    if (currentUser?.role === 'dentist' && currentUser.patients) {
      const patient = currentUser.patients.find(p => p.id === patientId);
      return patient ? patient.name : null;
    }
    return null;
  }, [currentUser]);

  const loadHistory = useCallback(async (page: number = 1) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGetHistory(page, itemsPerPage, patientIdForFilter || undefined);
      
      // Convert API response to frontend AnalysisHistoryItem format
      const items: AnalysisHistoryItem[] = response.items.map(item => ({
        id: item.id,
        date: item.date,
        imageMimeType: item.imageMimeType || null,
        imageBase64: item.imageBase64 || null,
        report: item.report,
        patientId: item.patientId,
      }));

      setHistoryItems(items);
      setTotalItems(response.total);
      setCurrentPage(response.page);

      // Set page title
      if (patientIdForFilter && currentUser.role === 'dentist') {
        const patientName = getPatientNameById(patientIdForFilter);
        setPageTitle(patientName ? `Analysis History for ${patientName}` : "Patient Analysis History");
      } else if (currentUser.role === 'dentist') {
        setPageTitle("Clinic Analysis History");
      } else {
        setPageTitle("Your Analysis History");
      }
    } catch (e: any) {
      console.error("Error loading history:", e);
      setError(`Could not load history: ${e.message}.`);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, patientIdForFilter, getPatientNameById]);

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const toggleAccordion = (itemId: string) => setExpandedReportId(prevId => prevId === itemId ? null : itemId);
  
  const handleDeleteHistoryItem = async (itemId: string) => {
    if (!currentUser) return;
    setError(null);
    try {
      await apiDeleteAnalysis(itemId);
      // Re-fetch after delete
      await loadHistory(currentPage);
      if (expandedReportId === itemId) setExpandedReportId(null);
    } catch (e: any) { 
      console.error("Error deleting item:", e); 
      setError(`Failed to delete history item: ${e.message}.`); 
    }
  };
  
  const generatePdfForItem = useCallback(async (item: AnalysisHistoryItem): Promise<{blob: Blob, filename: string} | null> => {
    const reportContentId = `history-report-display-content-${item.id}`; 
    const pdfContentElement = document.getElementById(reportContentId);
    if (!pdfContentElement || !item.report) { 
      setError(`Report content for item ${item.id} not found. Ensure the report is expanded.`); 
      return null;
    }
    setIsGeneratingPdfForItem(item.id); setError(null);
    try {
      const canvas = await html2canvas(pdfContentElement, { scale: 2, useCORS: true, backgroundColor: '#020617',
         onclone: (clonedDoc: Document) => {
            const contentElement = clonedDoc.getElementById(reportContentId);
            contentElement?.style.setProperty('color', '#e2e8f0', 'important');
            contentElement?.querySelectorAll<HTMLElement>('*').forEach(el => { 
                if(el.classList.contains('bg-slate-800')) el.style.backgroundColor = '#1e2937'; 
                if(el.classList.contains('bg-slate-800/90')) el.style.backgroundColor = 'rgba(30, 41, 55, 0.9)';
                if(el.classList.contains('bg-slate-700/40')) el.style.backgroundColor = 'rgba(51, 65, 85, 0.4)';
                if(el.classList.contains('bg-slate-700/70')) el.style.backgroundColor = 'rgba(51, 65, 85, 0.7)';
            });
        }
      } as any);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({orientation: 'p', unit: 'px', format: [canvas.width, canvas.height]});
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      let filename = `DentalAnalysis_${new Date(item.date).toLocaleDateString().replace(/\//g, '-')}.pdf`;
      if (currentUser?.companyName) filename = `${currentUser.companyName.replace(/\s+/g, '_')}_${filename}`;
      
      const blob = pdf.output('blob');
      return { blob, filename };

    } catch (e: any) { 
        console.error("Error PDF from history:", e); 
        setError(`Could not generate PDF for this item: ${e.message}.`);
        return null;
    } finally { 
        setIsGeneratingPdfForItem(null); 
    }
  }, [currentUser]);

  const handleDownloadPdfFromHistory = async (item: AnalysisHistoryItem) => {
    const pdfData = await generatePdfForItem(item);
    if (pdfData) {
        const url = URL.createObjectURL(pdfData.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfData.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };

  const handleSharePdfFromHistory = async (item: AnalysisHistoryItem) => {
    setItemToShare(item); 
    setShowShareModal(true);
  };
  
  const handleShareReportText = async (item: AnalysisHistoryItem) => {
    setShareFeedback(null);
    const report = item.report;
    const shareData = {
      title: `${currentUser?.companyName || 'Dentalyze Care'} - Analysis from ${new Date(item.date).toLocaleDateString()}`,
      text: `X-Ray Analysis Summary (${new Date(item.date).toLocaleDateString()}):\n${report.summary || 'No summary.'}\n\nDetected Conditions:\n${(report.detectedConditions || []).map(c => `- ${c.conditionName}: ${c.description.substring(0,50)}...`).join('\n') || 'None.'}\n\nRecommendations:\n${report.recommendations || 'None.'}`,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } 
      catch (error) { console.error('Error sharing:', error); setShareFeedback('Sharing failed/cancelled.'); }
    } else {
      try { await navigator.clipboard.writeText(shareData.text); setShareFeedback('Report summary copied!'); } 
      catch (error) { console.error('Error copying:', error); setShareFeedback('Failed to copy summary.'); }
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (isLoading) return <div className="py-10 flex items-center justify-center"><LoadingSpinner size="lg"/> <p className="ml-4 text-xl text-white font-display">Loading History...</p></div>;
  if (!currentUser) return <div className="py-10 flex flex-col items-center justify-center text-white p-6 text-center"><p className="text-xl font-display mb-2">Access Denied</p><p className="text-slate-400">Please login to view analysis history.</p><a href="#/login" className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md transition-colors duration-150">Login</a></div>;
  
  return (
    <div className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-center text-purple-300 mb-12 tracking-tight">
          {pageTitle}
        </h2>
        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} className="mb-8"/>}
        {shareFeedback && <AlertMessage type={shareFeedback.includes("copied") ? "success" : "info"} message={shareFeedback} onClose={() => setShareFeedback(null)} className="mb-4 text-center max-w-md mx-auto"/>}

        {historyItems.length === 0 && !isLoading && (
          <div className="text-center p-10 bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/80">
            <NoHistoryIcon className="h-20 w-20 mx-auto text-slate-500 mb-6" />
            <p className="text-2xl font-display text-white mb-3">No analysis history found {patientIdForFilter ? "for this patient" : "matching criteria"}.</p>
            <p className="text-slate-300/90 mb-8"> {patientIdForFilter ? "This patient doesn't have any analyses yet." : "It looks like you haven't analyzed any X-rays yet, or none match the current filter."}</p>
            {!patientIdForFilter && (
                <a href="#/analyzer" className="mt-6 inline-block px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 text-lg transform hover:scale-105">
                Analyze First X-Ray
                </a>
            )}
             {patientIdForFilter && ( 
                <a href={`#/analyzer?patientId=${patientIdForFilter}&fromPatientsPage=true`} className="mt-6 inline-block px-8 py-3.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 text-lg transform hover:scale-105">
                Analyze New X-Ray for this Patient
                </a>
            )}
          </div>
        )}
        {historyItems.length > 0 && (
          <div className="space-y-6">
            {historyItems.map((item) => {
              const patientName = item.patientId ? getPatientNameById(item.patientId) : null;
              const isExpanded = expandedReportId === item.id;
              return (
              <div key={item.id} className="bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-slate-700/80 transition-all duration-300 hover:shadow-purple-500/30 hover:border-slate-600/70">
                <button onClick={() => toggleAccordion(item.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-700/50 focus:outline-none focus:bg-slate-700/60 transition-colors duration-150"
                  aria-expanded={isExpanded} aria-controls={`report-content-${item.id}`}>
                  <div className="flex items-center space-x-4 overflow-hidden">
                    {item.imageBase64 && item.imageMimeType ? (
                        <img src={`data:${item.imageMimeType};base64,${item.imageBase64}`} alt="X-ray thumbnail" className="h-16 w-20 sm:h-20 sm:w-24 object-cover rounded-md border-2 border-purple-600/70 flex-shrink-0 shadow-md p-0.5 bg-slate-700"/>
                    ) : (
                         <div className="h-16 w-20 sm:h-20 sm:w-24 flex-shrink-0 bg-slate-700 rounded-md border-2 border-slate-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                     )}
                    <div className="overflow-hidden flex-grow">
                        <p className="text-md sm:text-lg font-display font-semibold text-purple-300 truncate transition-colors group-hover:text-purple-200">
                            Analysis: {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-400 transition-colors group-hover:text-slate-300">
                            Time: {new Date(item.date).toLocaleTimeString()} 
                            {currentUser?.role === 'dentist' && patientName && <span className="ml-2 font-medium text-green-400">(Patient: {patientName})</span>}
                            {!item.imageBase64 && <span className="ml-2 italic text-slate-500">(Preview N/A)</span>}
                        </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUpIcon className="w-7 h-7 text-purple-400 flex-shrink-0 ml-2 transition-transform duration-200"/> : <ChevronDownIcon className="w-7 h-7 text-purple-400 flex-shrink-0 ml-2 transition-transform duration-200"/>}
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-700/80 bg-slate-800/40 transition-max-height duration-500 ease-in-out overflow-hidden max-h-[3000px]">
                    <ReportDisplay 
                        report={item.report} 
                        reportTitle={`Full Report - ${new Date(item.date).toLocaleDateString()}${patientName ? ` (Patient: ${patientName})` : ''}`} 
                        containerId={`history-report-display-content-${item.id}`}
                        companyName={currentUser?.companyName} 
                        companyLogoBase64={currentUser?.companyLogoBase64}
                        imageBase64={item.imageBase64} 
                        imageMimeType={item.imageMimeType}
                    />
                    <div className="p-5 sm:p-6 bg-slate-800/30 border-t border-slate-700/70 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-end">
                        <button onClick={() => handleShareReportText(item)} disabled={isGeneratingPdfForItem === item.id} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md transition-all duration-150 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                            <ShareIcon className="w-4 h-4 mr-2"/> Share Summary
                        </button>
                        <button onClick={() => handleDownloadPdfFromHistory(item)} disabled={isGeneratingPdfForItem === item.id || (!!isGeneratingPdfForItem && isGeneratingPdfForItem !== item.id)} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-all duration-150 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                            {isGeneratingPdfForItem === item.id ? <LoadingSpinner size="sm" /> : <DownloadIcon className="w-5 h-5 mr-2"/>}
                            {isGeneratingPdfForItem === item.id ? 'Preparing PDF...' : 'Download PDF'}
                        </button>
                        <button onClick={() => handleSharePdfFromHistory(item)} disabled={isGeneratingPdfForItem === item.id || (!!isGeneratingPdfForItem && isGeneratingPdfForItem !== item.id)} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all duration-150 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                            <ShareIcon className="w-4 h-4 mr-2"/> Share PDF
                        </button>
                        <button onClick={() => handleDeleteHistoryItem(item.id)} disabled={!!isGeneratingPdfForItem} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-all duration-150 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                            <TrashIcon className="w-5 h-5 mr-2"/> Delete Report
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center space-x-4">
            <button
              onClick={() => loadHistory(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-slate-400 text-sm">
              Page {currentPage} of {totalPages} ({totalItems} total)
            </span>
            <button
              onClick={() => loadHistory(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      {showShareModal && itemToShare && (
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => { setShowShareModal(false); setItemToShare(null); }}
          historyItem={itemToShare}
          onInitiatePdfDownload={generatePdfForItem}
          reportSummary={itemToShare.report.summary || "Dental X-ray analysis report."}
        />
      )}
    </div>
  );
};
