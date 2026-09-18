
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { DetectedConditionReport } from '../types';

interface XRayViewerProps {
  imageBase64?: string | null;
  imageMimeType?: string | null;
  altText?: string;
  containerClassName?: string;
  conditions?: DetectedConditionReport[];
  imageDimensions?: { width: number; height: number };
  showAnnotationsByDefault?: boolean;
}

// Icons
const ZoomInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>);
const ZoomOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" /></svg>);
const ResetZoomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>);
const FullscreenEnterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>);
const FullscreenExitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" /></svg>);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EyeSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>);

export const XRayViewer: React.FC<XRayViewerProps> = ({
  imageBase64,
  imageMimeType,
  altText = "X-Ray Image",
  containerClassName = "w-full max-w-2xl mx-auto",
  conditions = [],
  imageDimensions,
  showAnnotationsByDefault = true,
}) => {
  const [showAnnotations, setShowAnnotations] = useState(showAnnotationsByDefault);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 });
  const [initialFitScale, setInitialFitScale] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const MAX_ZOOM_FACTOR = 8;
  const MIN_ZOOM_FACTOR = 1; // Represents the initial fit-to-screen scale
  const ZOOM_STEP = 0.2;

  const resetViewerState = useCallback(() => {
    setZoom(1); // Zoom factor relative to initial fit
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
    setImageLoaded(false);
    setNaturalImageSize({ width: 0, height: 0 });
    setInitialFitScale(0);
    setError(null);
    if (imageRef.current) {
      imageRef.current.src = ""; // Clear src to ensure new image loads correctly
    }
  }, []);
  
  const _calculateFitAndSetLoadStatus = useCallback((currentNaturalSize: {width: number, height: number}) => {
    let fitScale = 0;
    if (currentNaturalSize.width > 0 && currentNaturalSize.height > 0 && viewerContainerRef.current) {
      const container = viewerContainerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth > 0 && containerHeight > 0) {
        const scaleX = containerWidth / currentNaturalSize.width;
        const scaleY = containerHeight / currentNaturalSize.height;
        fitScale = Math.min(scaleX, scaleY);
      }
    }
    setInitialFitScale(fitScale);
    setImageLoaded(currentNaturalSize.width > 0 && fitScale > 0);
    return fitScale; // Return calculated fitScale
  }, []);


  useEffect(() => {
    resetViewerState(); 

    if (imageBase64 && imageMimeType) {
      const tempImg = new Image();
      tempImg.onload = () => {
        const newNaturalSize = { width: tempImg.naturalWidth, height: tempImg.naturalHeight };
        if (newNaturalSize.width > 0 && newNaturalSize.height > 0) {
          setNaturalImageSize(newNaturalSize);
          const calculatedFitScale = _calculateFitAndSetLoadStatus(newNaturalSize); 
          // Only set DOM image src if we have valid dimensions and fit scale
          if (imageRef.current && calculatedFitScale > 0) { 
            imageRef.current.src = `data:${imageMimeType};base64,${imageBase64}`;
          } else if (calculatedFitScale <= 0) { // If fit scale is not valid, don't load
             setError("Could not determine initial image fit. Container might be too small or image invalid.");
             setImageLoaded(false); // Ensure imageLoaded is false
          }
        } else {
          setError("Image has invalid dimensions (0x0).");
          resetViewerState();
        }
      };
      tempImg.onerror = () => {
        setError("Failed to load X-ray image data. The image might be corrupted or in an unsupported format.");
        resetViewerState();
      };
      tempImg.src = `data:${imageMimeType};base64,${imageBase64}`;
    }
  }, [imageBase64, imageMimeType, resetViewerState, _calculateFitAndSetLoadStatus]);
  
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
        if (naturalImageSize.width > 0) { 
            _calculateFitAndSetLoadStatus(naturalImageSize);
        }
    });
    resizeObserver.observe(container);
    
    if (naturalImageSize.width > 0) { // Recalculate on initial mount if naturalImageSize is already there
        _calculateFitAndSetLoadStatus(naturalImageSize);
    }

    return () => {
      if (container) resizeObserver.unobserve(container);
    };
  }, [naturalImageSize, _calculateFitAndSetLoadStatus]);


  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomChange = (newZoomFactor: number) => {
    const newZoom = Math.max(MIN_ZOOM_FACTOR, Math.min(zoom * newZoomFactor, MAX_ZOOM_FACTOR / initialFitScale)); // Adjust max zoom based on initial fit
    setZoom(newZoom);
    if (newZoom <= MIN_ZOOM_FACTOR && newZoomFactor < 1) { // If zooming out to min, reset pan
      setPan({ x: 0, y: 0 });
    }
  };
  
  const resetZoomAndPan = () => {
    setZoom(MIN_ZOOM_FACTOR); // Reset zoom factor relative to initial fit
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 && zoom > MIN_ZOOM_FACTOR) { 
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      if (transformWrapperRef.current) transformWrapperRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !transformWrapperRef.current) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
    if (transformWrapperRef.current) transformWrapperRef.current.style.cursor = zoom > MIN_ZOOM_FACTOR ? 'grab' : 'default';
  };
  
  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newZoomFactor = e.deltaY < 0 ? (1 + ZOOM_STEP) : (1 - ZOOM_STEP);
    handleZoomChange(newZoomFactor);
  };

  const toggleFullscreen = () => {
    const elem = viewerContainerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`, err));
    } else {
      document.exitFullscreen().catch(err => console.error(`Exit fullscreen error: ${err.message}`, err));
    }
  };
  
  const controlButtonClasses = "p-2 bg-slate-700/80 hover:bg-purple-600 text-slate-200 rounded-md shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50";

  if (error) return <div className={`${containerClassName} p-4 bg-red-800/30 border border-red-700 rounded-lg text-red-300 text-center flex items-center justify-center`}>{error}</div>;
  if (!imageBase64 || !imageMimeType) return <div className={`${containerClassName} p-10 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-400 text-center flex items-center justify-center`}>No X-ray image provided.</div>;
  
  const effectiveScale = initialFitScale * zoom;
  const displayCondition = imageLoaded && naturalImageSize.width > 0 && initialFitScale > 0;

  return (
    <div 
      ref={viewerContainerRef} 
      className={`${containerClassName} relative group bg-slate-900 rounded-lg shadow-lg border-2 border-slate-700 flex items-center justify-center overflow-hidden`}
      onWheel={handleWheelZoom}
      style={{ touchAction: 'none' }} // For better touch interactions on mobile, preventing page scroll
    >
      {!displayCondition && !error && ( // Show loading only if no error and not yet ready
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50 z-20">
          <LoadingSpinner size="md" />
          <p className="mt-3 text-slate-300">Loading X-ray...</p>
        </div>
      )}
      <div
        ref={transformWrapperRef}
        className="absolute select-none" 
        style={{
          // Dimensions are set to natural image size, actual display size controlled by scale
          width: naturalImageSize.width, 
          height: naturalImageSize.height,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
          cursor: zoom > MIN_ZOOM_FACTOR ? 'grab' : 'default',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
          transformOrigin: 'center center', 
          display: displayCondition ? 'block' : 'none', // Controlled by imageLoaded and valid scales
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <img
          ref={imageRef}
          // src is set in useEffect after dimensions are known
          alt={altText}
          className="block pointer-events-none" // Image itself doesn't need pointer events for pan
          style={{ width: '100%', height: '100%' }} // Image fills the transformWrapper
          draggable={false}
        />

        {/* Visual Bounding Box Overlays */}
        {showAnnotations && conditions.map((condition, idx) => {
          if (!condition.box || condition.box.length !== 4) return null;
          const [x1, y1, x2, y2] = condition.box;
          const refW = imageDimensions?.width || naturalImageSize.width;
          const refH = imageDimensions?.height || naturalImageSize.height;
          if (refW <= 0 || refH <= 0) return null;

          const left = (x1 / refW) * 100;
          const top = (y1 / refH) * 100;
          const width = Math.max(0.5, ((x2 - x1) / refW) * 100);
          const height = Math.max(0.5, ((y2 - y1) / refH) * 100);
          const color = condition.color || '#F59E0B';

          return (
            <div
              key={idx}
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                border: `2.5px solid ${color}`,
                backgroundColor: `${color}22`,
                borderRadius: '3px',
                boxShadow: `0 0 10px ${color}60`,
              }}
            >
              {/* Floating Badge above box */}
              <div
                className="absolute left-0 -top-6 px-1.5 py-0.5 rounded text-[11px] font-semibold text-white whitespace-nowrap shadow-md flex items-center gap-1 leading-tight"
                style={{ backgroundColor: color }}
              >
                <span>{condition.conditionName}</span>
                {condition.confidence !== undefined && (
                  <span className="opacity-90 font-mono text-[10px]">
                    {Math.round(condition.confidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls - always visible if image is displayed */}
      {displayCondition && (
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
          {conditions.some(c => c.box && c.box.length === 4) && (
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`${controlButtonClasses} ${showAnnotations ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-slate-700/80 text-slate-300'}`}
              title={showAnnotations ? "Hide Detections (Clean X-Ray)" : "Show Detections (Annotated View)"}
            >
              {showAnnotations ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => handleZoomChange(1 + ZOOM_STEP)} className={controlButtonClasses} title="Zoom In"><ZoomInIcon className="w-5 h-5" /></button>
          <button onClick={() => handleZoomChange(1 - ZOOM_STEP)} className={controlButtonClasses} title="Zoom Out"><ZoomOutIcon className="w-5 h-5" /></button>
          <button onClick={resetZoomAndPan} className={controlButtonClasses} title="Reset View"><ResetZoomIcon className="w-5 h-5" /></button>
          <button onClick={toggleFullscreen} className={controlButtonClasses} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <FullscreenExitIcon className="w-5 h-5" /> : <FullscreenEnterIcon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Detection Legend Pill in Bottom-Left */}
      {displayCondition && conditions.some(c => c.box && c.box.length === 4) && (
        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 flex items-center gap-2 z-10 shadow-lg pointer-events-none">
          <span className={`inline-block w-2 h-2 rounded-full ${showAnnotations ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-medium">
            {conditions.filter(c => c.box && c.box.length === 4).length} Finding{conditions.filter(c => c.box && c.box.length === 4).length > 1 ? 's' : ''} Detected
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            {showAnnotations ? 'Boxes Visible' : 'Boxes Hidden'}
          </span>
        </div>
      )}
    </div>
  );
};