
import React, { useState, useCallback, useRef, DragEvent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertMessage } from './AlertMessage';
import { ParsedAnalysisReport } from '../types';
import { ReportDisplay } from './ReportDisplay';
import { useAuth } from '../contexts/AuthContext.tsx';
import { XRayViewer } from './XRayViewer'; 
import { ShareReportModal } from './ShareReportModal';
import { apiAnalyzeXray } from '../services/serviceService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ImageAnalyzerProps {
  servicePrompt?: string; // No longer used, kept for backward compat
  id?: string; 
  reportDisplayId: string; 
  patientIdForAnalysis?: string | null; 
}

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 11.09A4.5 4.5 0 0112 21.75H6.75z" />
  </svg>
);

const AnalyzeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L18 14.25l-.25-2.25a4.5 4.5 0 013.09-3.09L23.75 9l-2.846-.813a4.5 4.5 0 01-3.09-3.09L18 1.25l-.25 2.25a4.5 4.5 0 01-3.09 3.09L11.75 9l2.846.813a4.5 4.5 0 013.09 3.09z" />
  </svg>
);

const DownloadReportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ id, reportDisplayId, patientIdForAnalysis }: ImageAnalyzerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [structuredAnalysisResult, setStructuredAnalysisResult] = useState<ParsedAnalysisReport | null>(null);
  const [analysisMethod, setAnalysisMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null); 
  const [pdfFilename, setPdfFilename] = useState<string>('');
  const [invalidImageUserMessage, setInvalidImageUserMessage] = useState<string | null>(null);


  const resetState = () => {
    setSelectedFile(null); setImageBase64(null); setMimeType(null);
    setStructuredAnalysisResult(null); setAnalysisMethod(null); setError(null);
    setShowShareModal(false); setPdfBlobUrl(null); setPdfFilename('');
    setInvalidImageUserMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const processFile = async (file: File) => {
    setInvalidImageUserMessage(null); 
    if (!file.type.startsWith('image/')) { setError('Invalid file. Please upload an image (JPEG, PNG, WEBP).'); resetState(); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size exceeds 10MB. Please upload a smaller image.'); resetState(); return; }
    setSelectedFile(file); 
    try {
      const { base64, mimeType: detectedMimeType } = await fileToBase64(file);
      setImageBase64(base64); setMimeType(detectedMimeType); setError(null); setStructuredAnalysisResult(null);
    } catch (e) { console.error("Error processing file:", e); setError("Failed to process image. Please try again."); resetState(); }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && processFile(event.target.files[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); event.dataTransfer.files?.[0] && processFile(event.dataTransfer.files[0]); };
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); };
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); };

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64 || !mimeType) { setError('Please upload an image.'); return; }
    if (currentUser?.role === 'dentist' && !patientIdForAnalysis) { setError('Please select or add a patient before analyzing.'); return; }
    
    setIsLoading(true); setError(null); setStructuredAnalysisResult(null); setInvalidImageUserMessage(null);
    try {
      // Call the backend API — the backend handles CNN inference + Gemini fallback + saving to DB
      const response = await apiAnalyzeXray({
        imageBase64,
        mimeType,
        patientId: patientIdForAnalysis || undefined,
      });

      const report = response.report;
      setAnalysisMethod(response.method);

      if (report.imageQuality === 'Not a dental X-ray' || report.imageQuality === 'Invalid image format or corrupted') {
        setInvalidImageUserMessage(`The uploaded image appears to be: ${report.imageQuality}. Please upload a clear dental X-ray for analysis.`);
      }
      setStructuredAnalysisResult(report);
      // No need to save to history — the backend does this automatically
    } catch (e: any) { setError(`Failed to analyze: ${e.message || 'Unknown error'}`); }
    finally { setIsLoading(false); }
  }, [imageBase64, mimeType, currentUser, patientIdForAnalysis]); 

  const handleExportPdf = useCallback(async () => {
    const pdfContentElement = document.getElementById(reportDisplayId); 
    if (!pdfContentElement || !structuredAnalysisResult) { setError("No report content to export."); return null; }
    setIsGeneratingPdf(true);
    setShowShareModal(false); 
    setPdfBlobUrl(null);
    let generatedPdfBlob: Blob | null = null;
    let generatedFilename: string = '';

    try {
      const canvas = await html2canvas(pdfContentElement, { scale: 2, useCORS: true, backgroundColor: '#020617',
        onclone: (doc: Document) => {
          const contentElement = doc.getElementById(reportDisplayId);
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
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      generatedFilename = `DentalAnalysis_${new Date().toISOString().split('T')[0]}.pdf`;
      if (currentUser?.companyName) generatedFilename = `${currentUser.companyName.replace(/\s+/g, '_')}_${generatedFilename}`;
      generatedPdfBlob = pdf.output('blob');
      if (generatedPdfBlob) {
        const blobUrl = URL.createObjectURL(generatedPdfBlob);
        setPdfBlobUrl(blobUrl);
        setPdfFilename(generatedFilename);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = generatedFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setShowShareModal(true); 
      return { blob: generatedPdfBlob, filename: generatedFilename };

    } catch (e) { 
        console.error("Error PDF:", e); setError("Could not generate PDF."); 
        return null;
    } finally { setIsGeneratingPdf(false); }
  }, [structuredAnalysisResult, currentUser, reportDisplayId]);

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl); 
        setPdfBlobUrl(null);
    }
  };

  return (
    <section id={id} className="py-10 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-10 rounded-xl shadow-2xl border border-slate-700/70">
          {!selectedFile ? (
            <div
              onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-8 p-8 sm:p-12 border-4 ${isDragging ? 'border-purple-500 bg-purple-900/40 ring-4 ring-purple-500/30' : 'border-dashed border-slate-600 hover:border-purple-500'} rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out group hover:bg-slate-700/30`}
            >
              <input ref={fileInputRef} id="xray-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" disabled={isLoading || isGeneratingPdf} />
              <UploadIcon className={`w-16 h-16 mx-auto mb-5 ${isDragging ? 'text-purple-400 scale-110' : 'text-slate-500 group-hover:text-purple-400'} transition-all duration-300`} />
              <p className="text-xl font-display font-semibold text-slate-200 mb-2 group-hover:text-white">
                Drag & drop X-ray image here
              </p>
              <p className="text-slate-400 text-sm group-hover:text-slate-300">(JPEG, PNG, WEBP, max 10MB)</p>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-slate-700/60 rounded-lg shadow-lg border border-slate-600/70">
              <h3 className="text-xl font-display font-semibold text-purple-300 mb-5">Selected X-Ray Preview:</h3>
              <XRayViewer 
                imageBase64={imageBase64} 
                imageMimeType={mimeType}
                altText="X-Ray Preview"
                containerClassName="w-full aspect-video max-h-[60vh] sm:max-h-[70vh] bg-slate-950/50 rounded-lg overflow-hidden shadow-xl border border-slate-600"
              />
              <div className="text-slate-300 text-sm mt-4 space-y-1.5 text-center">
                  <p><strong className="text-slate-400 font-medium">File:</strong> {selectedFile.name}</p>
                  <p><strong className="text-slate-400 font-medium">Type:</strong> {selectedFile.type}</p>
                  <p><strong className="text-slate-400 font-medium">Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={resetState} disabled={isLoading || isGeneratingPdf}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-md transition-all duration-150 text-sm disabled:bg-slate-500 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-700">
                    Clear / Change Image
                  </button>
              </div>
            </div>
          )}
          {error && <AlertMessage type={error.startsWith("INFO:") ? "info" : (error.startsWith("ERROR:") ? "error" : "warning")} message={error.replace(/^(INFO:|ERROR:)\s*/, '')} onClose={() => setError(null)} className="my-6" />}
          {invalidImageUserMessage && (
            <AlertMessage type="warning" message={invalidImageUserMessage} onClose={() => setInvalidImageUserMessage(null)} className="my-6"/>
          )}
          <button onClick={handleAnalyze} disabled={!selectedFile || isLoading || !imageBase64 || isGeneratingPdf || (currentUser?.role === 'dentist' && !patientIdForAnalysis) || !!invalidImageUserMessage}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 ease-in-out disabled:from-slate-600 disabled:to-slate-500 disabled:cursor-not-allowed disabled:opacity-80 flex items-center justify-center text-lg hover:shadow-green-500/50 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-slate-800 transform hover:scale-[1.02]"
            aria-label="Analyze uploaded X-Ray image">
            {isLoading ? <LoadingSpinner size="md" color="text-white" /> : <AnalyzeIcon className="w-6 h-6 mr-2.5"/>}
            <span className="mx-1">{isLoading ? 'AI Analyzing...' : 'Analyze X-Ray'}</span>
          </button>
          {isLoading && <p className="text-center text-purple-300 mt-4 text-sm italic">AI is analyzing, please wait... This may take a moment.</p>}
          {analysisMethod && structuredAnalysisResult && !isLoading && (
            <p className="text-center text-xs text-slate-500 mt-2">
              Analysis method: <span className="font-medium text-slate-400">{analysisMethod === 'cnn' ? 'CNN Model' : 'Gemini AI (Fallback)'}</span>
            </p>
          )}
          
          <div className="mt-10">
            {structuredAnalysisResult && (
              <ReportDisplay 
                report={structuredAnalysisResult} 
                containerId={reportDisplayId} 
                companyName={currentUser?.companyName} 
                companyLogoBase64={currentUser?.companyLogoBase64}
                imageBase64={imageBase64} 
                imageMimeType={mimeType}  
              />
            )}
            {structuredAnalysisResult && !isLoading && (
              <button onClick={handleExportPdf} disabled={isGeneratingPdf || isLoading || !!invalidImageUserMessage}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 ease-in-out disabled:from-slate-600 disabled:to-slate-500 disabled:opacity-80 flex items-center justify-center text-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-slate-800 transform hover:scale-[1.02]"
                aria-label="Download analysis report as PDF & Share">
                {isGeneratingPdf ? <LoadingSpinner size="md" color="text-white"/> : <DownloadReportIcon className="w-6 h-6 mr-2.5" />}
                <span className="mx-1">{isGeneratingPdf ? 'Generating PDF...' : 'Download Report & Share'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {showShareModal && (
        <ShareReportModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          pdfBlobUrl={pdfBlobUrl}
          pdfFilename={pdfFilename}
          reportSummary={structuredAnalysisResult?.summary || "Dental X-ray analysis report."}
        />
      )}
    </section>
  );
};