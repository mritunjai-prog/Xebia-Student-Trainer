import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CheckCircle2, AlertTriangle, Download, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

export const PublicVerifyCertificate = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const details = await apiClient.getCertificateDetails(uuid);
        if (!details || !details.certificate) {
          setError("Certificate not found or invalid UUID.");
        } else if (details.certificate.revoked) {
          setError(`This certificate was revoked by the authorized body. Reason: ${details.certificate.revocationReason || 'No reason provided.'}`);
          setData(details);
        } else {
          setData(details);
        }
      } catch (err) {
        console.error("Error retrieving certificate", err);
        setError("Failed to fetch certificate verification details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [uuid]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
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
      pdf.save(`Verified_Certificate_${data.certificate.serialNumber}.pdf`);
    } catch (err) {
      console.error("PDF download failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider uppercase opacity-80">Verifying credential with registry...</p>
      </div>
    );
  }

  if (error && (!data || data.certificate.revoked)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-full mb-6 text-rose-500">
          <AlertTriangle size={48} className="animate-bounce" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Verification Failed</h1>
        <p className="text-neutral-400 max-w-md mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 font-bold rounded-xl transition-all flex items-center gap-2 border border-neutral-700"
        >
          <ArrowLeft size={16} /> Return to LMS
        </button>
      </div>
    );
  }

  const cert = data.certificate;
  const studentName = data.studentName;
  const assessmentTitle = data.assessmentTitle || "LMS Module Completion";
  const assessment = data.assessment || {};
  
  const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const templates = {
    classic: {
      id: 'classic',
      name: 'Xebia Classic Light',
      bg: 'bg-[#FCFBFD]',
      borderColor: 'border-[#6C1D5F]',
      doubleBorderColor: 'border-[#01AC9F]',
      titleColor: 'text-[#6C1D5F]',
      textColor: 'text-neutral-800',
      subTextColor: 'text-neutral-500',
      nameColor: 'text-[#4A1E47]',
      accentColor: 'text-[#01AC9F]',
      sealBg: 'bg-[#6C1D5F]',
      sealText: 'text-white',
      signatureColor: 'text-[#6C1D5F]',
      tagline: 'text-neutral-500',
      borderStyle: 'border-[8px] border-double border-spacing-2'
    },
    dark: {
      id: 'dark',
      name: 'Elite Dark Slate',
      bg: 'bg-gradient-to-br from-[#0F172A] to-[#020617]',
      borderColor: 'border-indigo-500',
      doubleBorderColor: 'border-purple-500',
      titleColor: 'text-indigo-400',
      textColor: 'text-neutral-200',
      subTextColor: 'text-neutral-400',
      nameColor: 'text-white',
      accentColor: 'text-purple-400',
      sealBg: 'bg-gradient-to-br from-yellow-300 to-yellow-600',
      sealText: 'text-yellow-950',
      signatureColor: 'text-indigo-400',
      tagline: 'text-indigo-300',
      borderStyle: 'border-[8px] border-solid'
    },
    gold: {
      id: 'gold',
      name: 'Minimalist Gold',
      bg: 'bg-[#FDFBF7]',
      borderColor: 'border-[#D97706]',
      doubleBorderColor: 'border-[#F59E0B]',
      titleColor: 'text-[#B45309]',
      textColor: 'text-[#451A03]',
      subTextColor: 'text-[#78350F]',
      nameColor: 'text-[#92400E]',
      accentColor: 'text-[#B45309]',
      sealBg: 'bg-[#D97706]',
      sealText: 'text-white',
      signatureColor: 'text-[#78350F]',
      tagline: 'text-[#78350F]',
      borderStyle: 'border-[12px] border-double'
    }
  };

  const currentTemplate = assessment.certificateTemplate || 'classic';
  const currentTheme = templates[currentTemplate] || templates.classic;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
      
      {/* Verify Banner */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 bg-emerald-950/40 border border-emerald-800/40 px-6 py-4 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-lg tracking-wide flex items-center gap-1.5 justify-center md:justify-start">
              Verified Credential <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Officially issued and registered in the Xebia Academy Ledger database.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/20"
          >
            <Download size={16} /> Download Copy
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-bold rounded-xl transition-all"
          >
            Go to LMS
          </button>
        </div>
      </div>

      {/* Live Certificate Card Rendering */}
      <div className="overflow-x-auto w-full flex justify-center bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-2xl mb-8">
        <div 
          ref={certificateRef}
          className={`w-[1120px] h-[792px] p-12 flex flex-col relative ${currentTheme.bg} ${currentTheme.textColor} ${currentTheme.borderStyle} ${currentTheme.borderColor} select-none shadow-xl`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* Double Border Offset Effect */}
          <div className={`absolute inset-3 border-2 ${currentTheme.doubleBorderColor} opacity-20 pointer-events-none`}></div>

          {/* Decorative Corner Accents */}
          <div className={`absolute top-6 left-6 w-20 h-20 border-t-4 border-l-4 ${currentTheme.borderColor} opacity-60`}></div>
          <div className={`absolute top-6 right-6 w-20 h-20 border-t-4 border-r-4 ${currentTheme.borderColor} opacity-60`}></div>
          <div className={`absolute bottom-6 left-6 w-20 h-20 border-b-4 border-l-4 ${currentTheme.borderColor} opacity-60`}></div>
          <div className={`absolute bottom-6 right-6 w-20 h-20 border-b-4 border-r-4 ${currentTheme.borderColor} opacity-60`}></div>

          {/* Top Header */}
          <div className="flex justify-between items-start z-10">
            <div>
              <h1 className={`text-4xl font-extrabold tracking-widest ${currentTheme.titleColor} font-sans`}>Xebia</h1>
              <p className={`text-[10px] tracking-[0.25em] uppercase font-sans font-bold opacity-80 mt-1 ${currentTheme.tagline}`}>
                Shaping Tomorrow with AI Today
              </p>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold tracking-widest uppercase font-sans border-b-2 ${currentTheme.borderColor} pb-1`}>
                Official Achievement Certification
              </span>
            </div>
          </div>

          {/* Main Certificate Core Text */}
          <div className="flex-grow flex flex-col items-center justify-center text-center z-10 px-8 my-4">
            <h2 className="text-5xl font-serif tracking-wider mb-5 uppercase font-medium">
              {assessment.certificateTitle || 'Certificate of Completion'}
            </h2>
            <p className="text-base opacity-75 font-serif italic mb-5">This is to certify that</p>
            <h3 className={`text-5xl font-bold font-serif mb-6 uppercase tracking-wide border-b-2 ${currentTheme.borderColor} px-8 pb-3 ${currentTheme.nameColor}`}>
              {studentName}
            </h3>
            <p className="text-base opacity-80 max-w-3xl leading-relaxed font-sans font-medium">
              has successfully completed <strong className="font-bold underline decoration-[#01AC9F]">{assessmentTitle}</strong> offered by {assessment.certificateCorporateLine || 'Xebia IT Architects India Pvt. Ltd.'}, demonstrating dedication, knowledge, and a commitment to professional growth.
            </p>
          </div>

          {/* Assessment Details Box */}
          <div className="grid grid-cols-3 gap-6 bg-neutral-500/5 border border-current border-opacity-10 rounded-2xl p-4 my-4 mx-8 text-center z-10 backdrop-blur-sm">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Assessment Name</p>
              <p className="font-bold text-base truncate px-2">{assessmentTitle}</p>
            </div>
            <div className="border-x border-current border-opacity-10">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Date of Completion</p>
              <p className="font-bold text-base">{formattedDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Score</p>
              <p className={`font-black text-lg ${currentTheme.accentColor}`}>{cert.finalScore}%</p>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-auto pt-6 border-t border-current border-opacity-10 flex justify-between items-end z-10">
            
            {/* Left: Certificate ID / Date & QR Code */}
            <div className="pb-1 text-left flex items-end gap-6">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider opacity-50 mb-1">Certificate ID</p>
                <p className="font-mono text-xs font-bold">{cert.serialNumber}</p>
                <p className="text-[9px] uppercase font-bold tracking-wider opacity-50 mt-3 mb-1">Date of Completion</p>
                <p className="font-mono text-xs font-bold">{formattedDate}</p>
              </div>
              <div className="bg-white p-1 rounded-lg border border-neutral-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(window.location.href)}`} 
                  alt="Verification QR" 
                  className="w-14 h-14"
                />
              </div>
            </div>

            {/* Center: Brand Badge Seal */}
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${currentTheme.sealBg} ${currentTheme.sealText} shadow-lg relative transform translate-y-3 border-4 border-white/20 outline outline-2 outline-offset-[-6px] outline-white/20`}>
                <div className="text-center font-sans">
                  <span className="block text-[8px] font-bold uppercase tracking-widest opacity-80">Official</span>
                  <span className="block text-sm font-black uppercase tracking-wider my-0.5">XEBIA</span>
                  <span className="block text-[9px] font-bold">★★★</span>
                </div>
              </div>
            </div>

            {/* Right: Authorised Signature */}
            <div className="text-center pb-1">
              <div className="w-56 h-12 flex items-end justify-center pb-1 mb-2">
                <span className={`font-serif text-3xl font-bold tracking-wide ${currentTheme.signatureColor} italic`}>
                  {assessment.certificateSignatory || 'Xebia Tech Team'}
                </span>
              </div>
              <p className="text-[9px] uppercase font-bold tracking-wider opacity-50">
                {assessment.certificateSignatoryTitle || 'Authorized Signature'}
              </p>
              <p className="text-[8px] font-semibold opacity-40 mt-1">
                {assessment.certificateCorporateLine || 'Xebia IT Architects India Pvt. Ltd.'}
              </p>
            </div>
          </div>

          {/* Bottom-most Corporate Address Footer */}
          <div className="mt-4 pt-2 border-t border-current border-opacity-5 flex justify-between text-[8px] font-semibold opacity-40 z-10 tracking-wide font-sans">
            <div>
              <span className="font-bold">CORPORATE OFFICE:</span> {assessment.certificateCorporateLine || 'Xebia IT Architects India Pvt. Ltd.'}, Fourth Floor, Sector-59, Golf Course Extension Road, Gurugram, Haryana - 122102, India
            </div>
            <div className="flex gap-4">
              <span>+91 124 470 0200</span>
              <span>info.india@xebia.com</span>
              <span>www.xebia.com</span>
            </div>
            <div>
              <span className="font-bold">CIN:</span> U72200DL2008PTC146928
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
