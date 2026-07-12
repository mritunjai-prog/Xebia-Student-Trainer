import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { Award, Trophy, Search, Calendar, ExternalLink, Download } from 'lucide-react';
import CertificateViewer from '../components/CertificateViewer';

export const StudentCertificates = () => {
  const { currentUser, certificates, assessments } = useLMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  if (!currentUser) return null;

  // Filter out any revoked or invalid certificates
  const activeCertificates = (certificates || []).filter(c => !c.revoked);

  const mappedCertificates = activeCertificates.map(cert => {
    const assessment = assessments.find(a => a.id === cert.assessmentId);
    return {
      ...cert,
      title: assessment ? assessment.title : 'Assessment Module',
      subject: assessment ? (assessment.subject || assessment.course || 'LMS Course') : 'LMS Course'
    };
  });

  const filteredCertificates = mappedCertificates.filter(cert => 
    cert.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header Welcome Card */}
      <div className="bg-gradient-to-r from-[#4A1E47] via-[#6C1D5F] to-[#84117C] text-white p-6 md:p-8 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-300" />
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white">
              My Certifications
            </h2>
          </div>
          <p className="text-purple-100/90 text-xs md:text-sm leading-relaxed font-medium">
            View, download, and verify your earned credentials. Your achievements are registered securely on the Academy registry and can be shared directly to your LinkedIn profile.
          </p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search credentials by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white"
          />
        </div>
        <div className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5 shrink-0 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl text-neutral-750 dark:text-neutral-300">
          <span>Total Earned:</span>
          <span className="font-bold text-[#6C1D5F] dark:text-purple-400 font-mono text-sm bg-white dark:bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
            {activeCertificates.length}
          </span>
        </div>
      </div>

      {/* Grid of Certificates */}
      {filteredCertificates.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center text-neutral-500 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-full">
            <Trophy className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          </div>
          <div>
            <p className="font-bold text-lg text-neutral-700 dark:text-neutral-300">No Certificates Found</p>
            <p className="text-sm mt-1 max-w-sm">
              {searchQuery 
                ? "No credentials match your search query." 
                : "You haven't earned any certificates yet. Complete assessments with a passing score of 60% or higher to unlock them!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => {
            const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={cert.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C1D5F] to-[#01AC9F]" />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-[#6C1D5F] dark:text-purple-400 rounded-2xl group-hover:scale-105 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[#01AC9F] font-mono text-xs font-bold rounded-xl shadow-sm">
                      {cert.finalScore}% Score
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                      {cert.subject}
                    </span>
                    <h4 className="font-display font-bold text-base text-neutral-800 dark:text-white mt-1 leading-tight group-hover:text-[#6C1D5F] dark:group-hover:text-purple-400 transition-colors">
                      {cert.title}
                    </h4>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Issued: {formattedDate}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono truncate">
                      ID: {cert.serialNumber}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 z-10">
                  <button 
                    onClick={() => setSelectedCertificate({ cert, title: cert.title })}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    View Certificate
                  </button>
                  <a 
                    href={`/verify/${cert.certificateUuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    title="Verify Publicly"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCertificate && (
        <CertificateViewer
          certificate={selectedCertificate.cert}
          studentName={currentUser?.name}
          assessmentTitle={selectedCertificate.title}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};

export default StudentCertificates;
