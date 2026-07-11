import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, X, Layers, Image as ImageIcon } from 'lucide-react';

const CertificateViewer = ({ certificate, studentName, assessmentTitle, onClose }) => {
  const certificateRef = useRef(null);
  const [currentTemplate, setCurrentTemplate] = useState('classic'); // 'classic' | 'dark' | 'gold'
  const [backgroundPattern, setBackgroundPattern] = useState('none'); // 'none' | 'mesh' | 'aura' | 'ribbons'

  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6C1D5F', '#01AC9F', '#F59E0B', '#3B82F6', '#EF4444', '#10B981'];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx/3) * 15;

        if (p.y > canvas.height) {
          particles[idx] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle
          };
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 4500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const score = certificate.finalScore || 0;
  
  // Theme templates configuration
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

  const currentTheme = templates[currentTemplate];

  // Helper for applying background patterns
  const getPatternStyle = () => {
    switch (backgroundPattern) {
      case 'mesh':
        return {
          backgroundImage: 'radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.15
        };
      case 'aura':
        return {
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(108, 29, 95, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(1, 172, 159, 0.1) 0px, transparent 50%)',
          backgroundSize: '100% 100%'
        };
      case 'ribbons':
        return {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(108, 29, 95, 0.03) 0px, rgba(108, 29, 95, 0.03) 2px, transparent 2px, transparent 10px)',
          backgroundSize: '100% 100%'
        };
      default:
        return {};
    }
  };

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

  const verificationUrl = encodeURIComponent(`${window.location.origin}/verify/${certificate.certificateUuid}`);
  const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(assessmentTitle)}&organizationId=10672&certUrl=${verificationUrl}&certId=${certificate.serialNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      {/* Celebration Overlay */}
      <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-50"></canvas>

      <div className="relative flex flex-col items-center max-w-5xl w-full my-8">
        
        {/* Advanced Styling Control Panel */}
        <div className="flex flex-col md:flex-row w-full justify-between gap-4 mb-4 bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-neutral-300">Template:</span>
              <div className="flex bg-neutral-800 rounded-lg p-0.5 border border-neutral-700">
                {Object.values(templates).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTemplate(t.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentTemplate === t.id ? 'bg-[#6C1D5F] text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {t.name.split(' ')[1] || t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern/AI texture Selector */}
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold text-neutral-300">Background:</span>
              <select
                value={backgroundPattern}
                onChange={(e) => setBackgroundPattern(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer"
              >
                <option value="none">Plain Solid</option>
                <option value="mesh">Geometric Mesh</option>
                <option value="aura">Aura Flow</option>
                <option value="ribbons">Holographic Lines</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end items-center">
            <a 
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-950/20"
            >
              <span className="font-sans font-bold">in</span> Share on LinkedIn
            </a>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-purple-950/20"
            >
              <Download size={16} /> Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Container */}
        <div className="overflow-hidden w-full overflow-x-auto flex justify-center py-2 bg-neutral-950 rounded-3xl border border-neutral-900 shadow-2xl">
          <div 
            ref={certificateRef}
            className={`w-[1120px] h-[792px] p-12 flex flex-col relative ${currentTheme.bg} ${currentTheme.textColor} ${currentTheme.borderStyle} ${currentTheme.borderColor} select-none`}
            style={{ boxSizing: 'border-box' }}
          >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none" style={getPatternStyle()}></div>

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
              <h2 className="text-5xl font-serif tracking-wider mb-5 uppercase font-medium">Certificate of Completion</h2>
              <p className="text-base opacity-75 font-serif italic mb-5">This is to certify that</p>
              <h3 className={`text-5xl font-bold font-serif mb-6 uppercase tracking-wide border-b-2 ${currentTheme.borderColor} px-8 pb-3 ${currentTheme.nameColor}`}>
                {studentName}
              </h3>
              <p className="text-base opacity-80 max-w-3xl leading-relaxed font-sans font-medium">
                has successfully completed <strong className="font-bold underline decoration-[#01AC9F]">{assessmentTitle}</strong> offered by Xebia IT Architects India Pvt. Ltd., demonstrating dedication, knowledge, and a commitment to professional growth.
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
                <p className={`font-black text-lg ${currentTheme.accentColor}`}>{score}%</p>
              </div>
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-6 border-t border-current border-opacity-10 flex justify-between items-end z-10">
              
              {/* Left: Certificate ID / Date & QR Code */}
              <div className="pb-1 text-left flex items-end gap-6">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-wider opacity-50 mb-1">Certificate ID</p>
                  <p className="font-mono text-xs font-bold">{certificate.serialNumber}</p>
                  <p className="text-[9px] uppercase font-bold tracking-wider opacity-50 mt-3 mb-1">Date of Completion</p>
                  <p className="font-mono text-xs font-bold">{formattedDate}</p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-neutral-200 shadow-sm shrink-0">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(window.location.origin + '/verify/' + certificate.certificateUuid)}`} 
                    alt="Verification QR" 
                    className="w-12 h-12"
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
                    Xebia Tech Team
                  </span>
                </div>
                <p className="text-[9px] uppercase font-bold tracking-wider opacity-50">Authorized Signature</p>
                <p className="text-[8px] font-semibold opacity-40 mt-1">Xebia IT Architects India Pvt. Ltd.</p>
              </div>
            </div>

            {/* Bottom-most Corporate Address Footer */}
            <div className="mt-4 pt-2 border-t border-current border-opacity-5 flex justify-between text-[8px] font-semibold opacity-40 z-10 tracking-wide font-sans">
              <div>
                <span className="font-bold">CORPORATE OFFICE:</span> Xebia IT Architects India Pvt. Ltd., Fourth Floor, Sector-59, Golf Course Extension Road, Gurugram, Haryana - 122102, India
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
    </div>
  );
};

export default CertificateViewer;
