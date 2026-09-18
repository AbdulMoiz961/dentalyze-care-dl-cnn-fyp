
import React from 'react';
import { ParsedAnalysisReport, DetectedConditionReport } from '../types';
import { XRayViewer } from './XRayViewer'; // Import XRayViewer
import { AlertMessage } from './AlertMessage'; // For share fallback

interface ReportDisplayProps {
  report: ParsedAnalysisReport;
  reportTitle?: string;
  containerId?: string; 
  companyName?: string;
  companyLogoBase64?: string;
  imageBase64?: string | null; // To pass to XRayViewer
  imageMimeType?: string | null; // To pass to XRayViewer
}

const ConditionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className="w-5 h-5 text-purple-400 mr-2.5 shrink-0">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V8.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L6.2 9.74a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
  </svg>
);

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.044.588.05H11.25c.977 0 1.909-.422 2.56-.971L16.5 9.25m-9.283 3.842A2.252 2.252 0 007.5 15.692M15 14.25v.75a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25V15m3.75-3.75H16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5h-6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);


const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-xl md:text-2xl font-display font-semibold text-purple-300 mb-4 border-b border-slate-700 pb-3">{children}</h4>
);

const Section: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({title, children, className=""}) => (
    <div className={`mb-8 p-5 sm:p-6 bg-slate-700/40 rounded-xl shadow-lg border border-slate-600/70 ${className}`}>
      <SectionTitle>{title}</SectionTitle>
      <div className="text-slate-200 space-y-3 text-sm md:text-base leading-relaxed">{children}</div>
    </div>
);

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  report, 
  reportTitle = "Dental Analysis Report", 
  containerId,
  companyName,
  companyLogoBase64,
  imageBase64,
  imageMimeType
}) => {
  const [shareFeedback, setShareFeedback] = React.useState<string | null>(null);

  if (!report) return null;

  const detectedConditions = Array.isArray(report.detectedConditions) ? report.detectedConditions : [];

  const handleShareReport = async () => {
    setShareFeedback(null);
    const shareData = {
      title: `${companyName || 'Dentalyze Care'} - ${reportTitle}`,
      text: `X-Ray Analysis Summary:\n${report.summary || 'No summary available.'}\n\nDetected Conditions:\n${detectedConditions.map(c => `- ${c.conditionName}: ${c.description.substring(0,50)}...`).join('\n') || 'None specified.'}\n\nRecommendations:\n${report.recommendations || 'None specified.'}`,
      // url: window.location.href, // Can be complex for client-side state
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        setShareFeedback('Sharing failed or was cancelled.');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareData.text);
        setShareFeedback('Report summary copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        setShareFeedback('Failed to copy summary. Please copy manually.');
      }
    }
  };


  return (
    <div id={containerId} className="mt-10 p-4 sm:p-8 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/80 text-slate-100">
      {(companyName || companyLogoBase64) && (
        <div className="mb-10 pb-8 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
          {companyLogoBase64 && (
            <img 
              src={companyLogoBase64} 
              alt="Company Logo" 
              className="max-h-20 sm:max-h-24 w-auto max-w-[220px] object-contain bg-white p-2.5 rounded-lg shadow-md"
            />
          )}
          {companyName && <h2 className="text-2xl sm:text-3xl font-display font-bold text-white text-center sm:text-right flex-grow">{companyName}</h2>}
        </div>
      )}

      <h3 className="text-3xl sm:text-4xl font-display font-bold text-purple-400 mb-10 text-center tracking-tight">{reportTitle}</h3>
      
      {/* This is where the image should be displayed within the report */}
      {imageBase64 && imageMimeType && (
        <Section title="X-Ray Image Analysis" className="mb-10">
            <XRayViewer 
                imageBase64={imageBase64} 
                imageMimeType={imageMimeType} 
                altText="Analyzed X-Ray"
                containerClassName="w-full aspect-video max-h-[50vh] sm:max-h-[60vh] bg-slate-950/50 rounded-lg overflow-hidden shadow-xl border border-slate-600 mx-auto"
                conditions={detectedConditions}
                imageDimensions={report.imageDimensions}
            />
        </Section>
      )}
       {(!imageBase64 || !imageMimeType) && (
           <Section title="X-Ray Image Analysis" className="mb-10">
            <div className="text-center text-slate-400 p-5 border border-dashed border-slate-600 rounded-md">
                No image available for this report section.
            </div>
           </Section>
       )}


      {report.imageQuality && (
        <Section title="Image Quality Assessment">
          <p className="italic text-slate-300">{report.imageQuality}</p>
        </Section>
      )}

      {report.summary && (
        <Section title="Analysis Summary">
          <p className="whitespace-pre-wrap">{report.summary}</p>
        </Section>
      )}

      {detectedConditions.length > 0 && (
        <Section title="Detected Conditions & Observations">
          <div className="space-y-5">
            {detectedConditions.map((condition: DetectedConditionReport, index: number) => (
              <div 
                key={index} 
                className="p-4 sm:p-5 bg-slate-700/70 rounded-lg shadow-lg border border-slate-600/80 transition-all hover:shadow-purple-500/20 hover:border-purple-600/70"
                style={condition.color ? { borderLeft: `4px solid ${condition.color}` } : undefined}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center">
                    {condition.color ? (
                      <span 
                        className="w-3.5 h-3.5 rounded-full mr-2.5 shrink-0 shadow-sm inline-block"
                        style={{ backgroundColor: condition.color }} 
                      />
                    ) : (
                      <ConditionIcon />
                    )}
                    <h5 className="text-lg font-display font-semibold text-purple-300">{condition.conditionName}</h5>
                  </div>
                  {condition.confidence !== undefined && (
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: condition.color || '#8B5CF6' }}
                    >
                      {Math.round(condition.confidence * 100)}% Confidence
                    </span>
                  )}
                </div>
                <div className="pl-6 space-y-1.5 mt-1 text-slate-300">
                    {condition.location && <p><strong className="font-medium text-slate-400">Location:</strong> {condition.location}</p>}
                    {condition.severity && <p><strong className="font-medium text-slate-400">Severity:</strong> {condition.severity}</p>}
                    <p className="whitespace-pre-wrap"><strong className="font-medium text-slate-400">Description:</strong> {condition.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      
      {report.recommendations && (
         <Section title="Further Considerations">
          <p className="whitespace-pre-wrap">{report.recommendations}</p>
        </Section>
      )}

      {!report.imageQuality && !report.summary && detectedConditions.length === 0 && !report.recommendations && (
        <Section title="Analysis Result">
            <p>The AI analysis did not return specific sections. This might occur if the image was unclear or not a dental X-ray, or if the model's response was unexpected.</p>
        </Section>
      )}

      <div className="mt-10 pt-6 border-t border-slate-700 flex justify-end">
        <button 
            onClick={handleShareReport}
            className="flex items-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-colors duration-150 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            title="Share Report Summary"
        >
            <ShareIcon className="w-4 h-4 mr-2" /> Share Report
        </button>
      </div>
      {shareFeedback && <AlertMessage type={shareFeedback.includes("copied") ? "success" : "info"} message={shareFeedback} onClose={() => setShareFeedback(null)} className="mt-4 text-xs"/>}
    </div>
  );
};