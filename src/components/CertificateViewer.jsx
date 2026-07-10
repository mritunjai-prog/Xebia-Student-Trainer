import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, X } from 'lucide-react';

const CertificateViewer = ({ certificate, studentName, assessmentTitle, onClose }) => {
  const certificateRef = useRef(null);

  const score = certificate.finalScore || 0;
  
  // Theme selection based on score tier
  let theme = {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    accent: 'text-gray-800',
    sealBg: 'bg-gray-200',
    sealText: 'text-gray-600',
    tierName: 'Core Passing Tier'
  };

  if (score >= 90) {
    theme = {
      bg: 'bg-slate-900',
      border: 'border-indigo-500',
      accent: 'text-indigo-400',
      sealBg: 'bg-gradient-to-br from-yellow-300 to-yellow-600',
      sealText: 'text-yellow-900',
      tierName: 'Elite Tier',
      textMain: 'text-white'
    };
  } else if (score >= 75) {
    theme = {
      bg: 'bg-slate-800',
      border: 'border-slate-600',
      accent: 'text-slate-300',
      sealBg: 'bg-slate-600',
      sealText: 'text-white',
      tierName: 'Merit Tier',
      textMain: 'text-gray-100'
    };
  } else {
    theme = {
      bg: 'bg-white',
      border: 'border-gray-300',
      accent: 'text-gray-800',
      sealBg: 'bg-gray-100',
      sealText: 'text-gray-600',
      tierName: 'Core Passing Tier',
      textMain: 'text-gray-900'
    };
  }

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate_${certificate.serialNumber}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex flex-col items-center max-w-5xl w-full">
        {/* Controls */}
        <div className="flex w-full justify-between mb-4 bg-white/10 p-4 rounded-lg backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Certificate Preview</h2>
          <div className="flex gap-4">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              <Download size={18} /> Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-md transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Certificate Container for Export */}
        <div 
          className="overflow-hidden w-full overflow-x-auto flex justify-center"
        >
            {/* Aspect ratio 1.414 for A4 landscape roughly */}
          <div 
            ref={certificateRef}
            className={`w-[1000px] h-[707px] p-12 flex flex-col relative ${theme.bg} ${theme.textMain} border-[16px] ${theme.border} shadow-2xl`}
            style={{ boxSizing: 'border-box' }}
          >
            {/* Decorative Corner Accents */}
            <div className={`absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 ${theme.border} opacity-50`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 ${theme.border} opacity-50`}></div>
            <div className={`absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 ${theme.border} opacity-50`}></div>
            <div className={`absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 ${theme.border} opacity-50`}></div>

            {/* Header */}
            <div className="text-center mt-8 mb-6">
              <h1 className={`text-4xl font-black tracking-widest uppercase ${theme.accent}`}>Xebia</h1>
              <p className="text-sm tracking-[0.2em] uppercase mt-2 opacity-80">Software Engineering Academy</p>
            </div>

            {/* Title */}
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <h2 className="text-5xl font-serif tracking-wide mb-6 uppercase">Certificate of Completion</h2>
              <p className="text-lg opacity-80 mb-6 italic">This is to certify that</p>
              <h3 className="text-6xl font-bold mb-6 font-serif">{studentName}</h3>
              <p className="text-lg opacity-80 max-w-2xl leading-relaxed">
                has successfully completed the assessment for <strong className="font-semibold">{assessmentTitle}</strong> and has demonstrated proficiency meeting the passing criteria.
              </p>
            </div>

            {/* Verification Matrix */}
            <div className="grid grid-cols-3 gap-8 my-8 px-12 text-center">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Assessment</p>
                <p className="font-semibold text-lg">{assessmentTitle}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Date of Completion</p>
                <p className="font-semibold text-lg">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Final Score</p>
                <p className="font-semibold text-lg">{score}%</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-current border-opacity-20 flex justify-between items-end">
              {/* Left: ID */}
              <div className="pb-2">
                <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Certificate ID</p>
                <p className="font-mono text-sm">{certificate.serialNumber}</p>
              </div>

              {/* Center: Seal */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme.sealBg} ${theme.sealText} shadow-lg relative transform translate-y-4`}>
                <div className="text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider">Official</span>
                  <span className="block text-xl font-serif">Seal</span>
                </div>
              </div>

              {/* Right: Signature */}
              <div className="text-center pb-2">
                <div className="w-48 h-12 border-b border-current border-opacity-40 flex items-end justify-center pb-2 mb-2">
                  <span className={`font-signature text-3xl ${theme.accent}`}>Xebia Admin</span>
                </div>
                <p className="text-xs uppercase tracking-wider opacity-60">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
