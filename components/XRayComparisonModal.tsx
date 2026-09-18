
import React, { useState, useEffect } from 'react';
import { AnalysisHistoryItem, User } from '../types';
import { XRayViewer } from './XRayViewer';

interface XRayComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisHistory: AnalysisHistoryItem[];
  patientName: string;
  currentUser?: User | null; // For company branding on report snippets
}

const CloseButtonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const XRayComparisonModal: React.FC<XRayComparisonModalProps> = ({
  isOpen,
  onClose,
  analysisHistory,
  patientName,
  currentUser: _currentUser
}) => {
  const [selectedItem1Id, setSelectedItem1Id] = useState<string>('');
  const [selectedItem2Id, setSelectedItem2Id] = useState<string>('');

  const item1 = analysisHistory.find(item => item.id === selectedItem1Id);
  const item2 = analysisHistory.find(item => item.id === selectedItem2Id);

  // Reset selections when modal opens or history changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItem1Id(analysisHistory.length > 0 ? analysisHistory[0].id : '');
      setSelectedItem2Id(analysisHistory.length > 1 ? analysisHistory[1].id : '');
    } else {
      setSelectedItem1Id('');
      setSelectedItem2Id('');
    }
  }, [isOpen, analysisHistory]);

  if (!isOpen) return null;

  const handleSelect1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId === selectedItem2Id && newId !== '') { 
      setSelectedItem2Id(''); 
    }
    setSelectedItem1Id(newId);
  };

  const handleSelect2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
     if (newId === selectedItem1Id && newId !== '') { 
      setSelectedItem1Id(''); 
    }
    setSelectedItem2Id(newId);
  };

  const availableForSelect2 = analysisHistory.filter(item => item.id !== selectedItem1Id);
  const availableForSelect1 = analysisHistory.filter(item => item.id !== selectedItem2Id);


  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-lg flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out overflow-y-auto">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl border border-slate-700 transform transition-all duration-300 ease-out scale-100 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h2 id="comparison-modal-title" className="text-2xl sm:text-3xl font-display font-semibold text-purple-300">
            Compare X-Rays for {patientName}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close modal"
          >
            <CloseButtonIcon />
          </button>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="select-item1" className="block text-sm font-medium text-slate-300 mb-1.5">Analysis 1:</label>
            <select
              id="select-item1"
              value={selectedItem1Id}
              onChange={handleSelect1}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">-- Select First X-Ray --</option>
              {availableForSelect1.map(item => (
                <option key={item.id} value={item.id}>
                  {new Date(item.date).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="select-item2" className="block text-sm font-medium text-slate-300 mb-1.5">Analysis 2:</label>
            <select
              id="select-item2"
              value={selectedItem2Id}
              onChange={handleSelect2}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">-- Select Second X-Ray --</option>
              {availableForSelect2.map(item => (
                <option key={item.id} value={item.id}>
                  {new Date(item.date).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison View */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto custom-scrollbar pr-2">
          {/* Column 1 */}
          <div className="border border-slate-700 rounded-lg p-3 flex flex-col bg-slate-800/50">
            {item1 ? (
              <>
                <h4 className="text-lg font-semibold text-purple-400 mb-2 text-center">{new Date(item1.date).toLocaleString()}</h4>
                <div className="mb-3 h-64 md:h-80 lg:h-96">
                    <XRayViewer
                    imageBase64={item1.imageBase64 || null}
                    imageMimeType={item1.imageMimeType || null}
                    containerClassName="w-full h-full"
                    />
                </div>
                <div className="text-xs text-slate-300 space-y-1 overflow-y-auto max-h-48 custom-scrollbar p-2 bg-slate-700/30 rounded">
                    <p><strong className="text-slate-400">Summary:</strong> {item1.report.summary || 'N/A'}</p>
                    <p><strong className="text-slate-400">Conditions:</strong> {item1.report.detectedConditions.map(c => c.conditionName).join(', ') || 'None'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Select first X-ray for comparison.</div>
            )}
          </div>

          {/* Column 2 */}
           <div className="border border-slate-700 rounded-lg p-3 flex flex-col bg-slate-800/50">
            {item2 ? (
              <>
                <h4 className="text-lg font-semibold text-purple-400 mb-2 text-center">{new Date(item2.date).toLocaleString()}</h4>
                 <div className="mb-3 h-64 md:h-80 lg:h-96">
                    <XRayViewer
                    imageBase64={item2.imageBase64 || null}
                    imageMimeType={item2.imageMimeType || null}
                    containerClassName="w-full h-full"
                    />
                </div>
                <div className="text-xs text-slate-300 space-y-1 overflow-y-auto max-h-48 custom-scrollbar p-2 bg-slate-700/30 rounded">
                    <p><strong className="text-slate-400">Summary:</strong> {item2.report.summary || 'N/A'}</p>
                    <p><strong className="text-slate-400">Conditions:</strong> {item2.report.detectedConditions.map(c => c.conditionName).join(', ') || 'None'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Select second X-ray for comparison.</div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-right">
            <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
                Close Comparison
            </button>
        </div>
      </div>
    </div>
  );
};
