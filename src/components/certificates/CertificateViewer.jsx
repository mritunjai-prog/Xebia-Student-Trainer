import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, ShieldCheck, Award } from 'lucide-react';

export const CertificateViewer = ({ certificate, studentName, assessmentTitle, onClose }) => {
  const certificateRef = useRef(null);

  const getThemeClasses = (score) => {
    if (score >= 90) {
      return {
        wrapper: "from-indigo-950 via-slate-900 to-indigo-950 text-indigo-50 border-indigo-500/30",
        accent: "text-amber-400",
        border: "border-indigo-800/50",
        seal: "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]"
      };
    } else if (score >= 75) {
      return {
        wrapper: "from-slate-900 via-neutral-900 to-slate-900 text-slate-100 border-slate-700/50",
        accent: "text-emerald-400",
        border: "border-slate-700/50",
        seal: "text-emerald-500"
      };
    } else {
      return {
        wrapper: "from-white via-slate-50 to-white text-slate-900 border-slate-200",
        accent: "text-[#6C1D5F]",
        border: "border-slate-200",
        seal: "text-slate-400"
      };
    }
  };

  const theme = getThemeClasses(certificate.finalScore);
  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High fidelity
        useCORS: true,
        logging: false,
        backgroundColor: null
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${certificate.serialNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl flex flex-col items-center">
        
        {/* Toolbar */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-bold text-sm">Verified Credential</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-sm font-bold rounded-xl shadow-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Container (aspect-video enforces 16:9 ratio, similar to landscape A4) */}
        <div 
          className="w-full aspect-[1.414/1] max-h-[80vh] overflow-hidden rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center relative bg-white"
        >
          {/* A4 Target Element for html2canvas */}
          <div 
            ref={certificateRef}
            className={`w-full h-full p-1 sm:p-2 md:p-4 bg-gradient-to-br ${theme.wrapper} flex flex-col relative`}
          >
            {/* Inner Border Frame */}
            <div className={`flex-1 border-2 md:border-4 ${theme.border} p-6 md:p-12 flex flex-col relative overflow-hidden`}>
              
              {/* Background Watermark/Pattern (Subtle) */}
              <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
                <Award className="w-96 h-96" />
              </div>

              {/* Header */}
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <h1 className={`text-2xl md:text-4xl font-black tracking-tighter ${theme.accent}`}>XEBIA</h1>
                  <p className="text-[10px] md:text-xs font-semibold tracking-widest uppercase opacity-70 mt-1">Software Engineering Academy</p>
                </div>
                <Award className={`w-12 h-12 md:w-16 md:h-16 ${theme.seal}`} />
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-4 md:px-16 mt-4">
                <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase opacity-70 mb-4 md:mb-6">
                  Certificate of Completion
                </p>
                <p className="text-sm md:text-base mb-2 md:mb-4">This is to proudly certify that</p>
                
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black capitalize tracking-tight mb-4 md:mb-6 leading-none">
                  {studentName || "Xebia Scholar"}
                </h2>
                
                <p className="text-xs md:text-sm max-w-2xl opacity-80 leading-relaxed mb-6 md:mb-10">
                  has successfully completed the comprehensive assessment requirements for the designated curriculum and demonstrated exceptional proficiency in the subject matter.
                </p>

                {/* Verification Matrix */}
                <div className={`grid grid-cols-3 gap-4 md:gap-8 p-4 md:p-6 rounded-xl border ${theme.border} bg-black/5 dark:bg-white/5 backdrop-blur-sm w-full max-w-3xl`}>
                  <div className="flex flex-col items-center border-r border-inherit">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-60 mb-1">Assessment</span>
                    <span className="text-xs md:text-sm font-bold truncate w-full px-2">{assessmentTitle || "Final Examination"}</span>
                  </div>
                  <div className="flex flex-col items-center border-r border-inherit">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-60 mb-1">Completion Date</span>
                    <span className="text-xs md:text-sm font-bold">{formattedDate}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-60 mb-1">Final Score</span>
                    <span className={`text-sm md:text-lg font-black ${theme.accent}`}>{certificate.finalScore}%</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end z-10 mt-8">
                <div className="flex flex-col">
                  <p className="text-[9px] md:text-[10px] font-mono opacity-50 mb-1">CREDENTIAL ID</p>
                  <p className="text-[10px] md:text-xs font-bold tracking-wider">{certificate.serialNumber}</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className={`w-32 md:w-48 h-px ${theme.border} mb-2`} />
                  <p className="text-xs md:text-sm font-bold tracking-wide">Authorized Signature</p>
                  <p className="text-[9px] md:text-[10px] opacity-60 mt-0.5">Xebia Examination Board</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
