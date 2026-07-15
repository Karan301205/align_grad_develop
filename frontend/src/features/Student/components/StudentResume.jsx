import React from 'react';
import { FileText, CheckCircle, Award, Send } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { formatErrorMessage } from '../../../utils/errorFormatter';

export default function StudentResume({
  profile,
  resumeUrl,
  generatingPdf,
  handleResumeUpload,
  handleDownloadUploadedResume,
  handleDeleteUploadedResume,
  handleDownloadGeneratedResume,
  feedbackMsg,
  phone,
  profileEmail,
  nationality,
  socialLinks,
  educationList,
  experienceList,
  certificatesList,
  skillsList,
  projectsList
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Resume Management"
        subtitle="Upload your resume in PDF format or download a generated resume formatted with your current profile details and ratings"
      />

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 w-full ${
          feedbackMsg.includes('success')
            ? 'bg-success-container border-success/30 text-on-success-container items-center'
            : 'bg-error-container border-error/30 text-on-error-container'
        }`}>
          {feedbackMsg.includes('success') ? (
            <>
              <CheckCircle className="w-5 h-5 shrink-0 text-success" />
              <span className="font-medium">{feedbackMsg}</span>
            </>
          ) : (
            formatErrorMessage(feedbackMsg)
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Upload Resume */}
        <Card className="space-y-6">
          <div>
            <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Uploaded Resume (PDF)
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Upload your master resume here. Recruiting companies will see this resume when you apply for opportunities.
            </p>
          </div>

          {/* Drag and drop or Click zone */}
          <div
            className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center bg-surface-container-low hover:border-primary/50 transition-colors cursor-pointer group relative"
            onClick={() => document.getElementById('resume-pdf-upload').click()}
          >
            <input
              type="file"
              id="resume-pdf-upload"
              className="hidden"
              accept="application/pdf"
              onChange={handleResumeUpload}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Click or tap to select PDF</p>
                <p className="text-[10px] text-on-surface-variant mt-1">Only PDF format supported (max 10MB)</p>
              </div>
            </div>
          </div>

          {/* Current File Display */}
          {resumeUrl ? (
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {resumeUrl.startsWith('http') ? resumeUrl.split('/').pop() : (resumeUrl.startsWith('data:application/pdf;') ? `${profile?.name || 'Student'}_Resume.pdf` : 'linked_portfolio_resume.pdf')}
                  </p>
                  <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">
                    {resumeUrl.startsWith('http') ? 'Stored in AWS S3' : (resumeUrl.startsWith('data:application/pdf;') ? `${Math.round(resumeUrl.length / 1333)} KB` : 'Linked URL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadUploadedResume}
                  className="px-3 py-1.5 bg-primary-container border border-primary/20 text-on-primary-container font-mono rounded text-[10px] hover:brightness-105 transition-all"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUploadedResume}
                  className="px-3 py-1.5 bg-error-container border border-error/20 text-on-error-container font-mono rounded text-[10px] hover:brightness-105 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-center">
              <p className="text-xs text-on-surface-variant italic">No resume PDF uploaded yet.</p>
            </div>
          )}
        </Card>

        {/* Right Column: Download Generated Resume */}
        <Card className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Generated Resume (Dynamic)
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Instantly generate a clean, double-column PDF resume matching the <strong>my_resume.pdf</strong> standard. It includes all your latest details, projects, experience, and verified ratings.
              </p>
            </div>

            <div className="p-4 bg-primary-container/40 border border-primary/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-on-surface-variant font-mono leading-relaxed">
                Your self-rated skills will dynamically render with their corresponding verified rating level (e.g. HTML , CSS, REACT.js LVL 8/10).
              </div>
            </div>
          </div>

          <Button onClick={handleDownloadGeneratedResume} loading={generatingPdf} icon={Send} fullWidth size="lg">
            {generatingPdf ? 'Generating PDF...' : 'Generate & Download Resume'}
          </Button>
        </Card>
      </div>

      {/* Hidden Resume PDF Template for Generation */}
      <div 
        id="resume-pdf-template" 
        className="bg-white text-neutral-900 font-sans" 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          width: '210mm', 
          minHeight: '297mm',
          padding: '15mm', 
          boxSizing: 'border-box',
          fontSize: '11px',
          lineHeight: '1.5'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-black font-serif">
            {profile?.name || 'YOUR NAME'}
          </h1>
          <p className="text-[10px] tracking-[0.15em] text-neutral-600 italic uppercase mt-1">
            {experienceList[0]?.designation || 'Software Developer'} || {experienceList[0]?.domain || 'Engineering'}
          </p>
        </div>

        {/* Two Columns Grid */}
        <div className="flex w-full mt-4" style={{ minHeight: '230mm' }}>
          {/* Left Column (35% width) */}
          <div className="w-[35%] pr-5 flex flex-col gap-5">
            {/* Contact */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                Contact
              </h2>
              <ul className="space-y-2 text-[10px] text-neutral-700">
                {phone && (
                  <li className="flex items-center gap-2">
                    <span className="text-[11px]">📞</span>
                    <span>{phone}</span>
                  </li>
                )}
                {profileEmail && (
                  <li className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px]">✉️</span>
                    <span className="truncate">{profileEmail}</span>
                  </li>
                )}
                {nationality && (
                  <li className="flex items-center gap-2">
                    <span className="text-[11px]">📍</span>
                    <span>{nationality}</span>
                  </li>
                )}
                {socialLinks?.linkedin && socialLinks?.showLinkedin && (
                  <li className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px]">🌐</span>
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="underline truncate">
                      LinkedIn Profile
                    </a>
                  </li>
                )}
                {socialLinks?.portfolio && socialLinks?.showPortfolio && (
                  <li className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px]">🕸️</span>
                    <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="underline truncate">
                      Portfolio Site
                    </a>
                  </li>
                )}
                {socialLinks?.github && socialLinks?.showGithub && (
                  <li className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px]">💻</span>
                    <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="underline truncate">
                      GitHub Profile
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Education */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                Education
              </h2>
              {educationList && educationList.length > 0 ? (
                <div className="space-y-3">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="text-[10px]">
                      <p className="font-bold text-neutral-900">{edu.degree}</p>
                      <p className="text-neutral-500 font-mono text-[9px] mt-0.5">{edu.startDate} - {edu.endDate}</p>
                      <p className="text-neutral-700 mt-0.5">{edu.institute}</p>
                      {edu.gradeType && edu.gradeValue && (
                        <p className="text-neutral-600 font-medium mt-0.5">{edu.gradeType}: {edu.gradeValue}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] italic text-neutral-400">No education records added.</p>
              )}
            </div>

            {/* Awards & Certifications */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                Awards & Certifications
              </h2>
              {certificatesList && certificatesList.length > 0 ? (
                <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-neutral-700">
                  {certificatesList.map((cert, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-neutral-900">{cert.title}</span> - {cert.org}
                      {cert.startDate && <span className="text-neutral-500 font-mono text-[8px] ml-1">({cert.startDate})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[9px] italic text-neutral-400">No certifications added.</p>
              )}
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                Skills
              </h2>
              {skillsList && skillsList.length > 0 ? (
                <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-neutral-700">
                  {skillsList.map((skill, idx) => (
                    <li key={idx} className="uppercase font-medium">
                      {skill.name} <span className="text-[8px] text-neutral-500 font-mono italic font-normal">(LVL {skill.rating}/10)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[9px] italic text-neutral-400">No skills rated yet.</p>
              )}
            </div>
          </div>

          {/* Right Column (65% width) - divided by a vertical line */}
          <div className="w-[65%] pl-5 border-l border-neutral-300 flex flex-col gap-5">
            {/* Profile */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                Profile
              </h2>
              <p className="text-[10px] text-neutral-700 leading-relaxed">
                {profile?.bio || 'No profile summary provided yet.'}
              </p>
            </div>

            {/* My Projects */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                My Projects
              </h2>
              {projectsList && projectsList.length > 0 ? (
                <div className="space-y-4">
                  {projectsList.map((proj, idx) => (
                    <div key={idx} className="text-[10px]">
                      <p className="font-bold tracking-wide uppercase text-neutral-900">{proj.title || 'PROJECT TITLE'}</p>
                      <p className="font-semibold text-neutral-800 text-[9.5px] mt-0.5">
                        <span className="underline">{proj.role || 'Project Link'}</span>
                        {proj.codeUrl && (
                          <>
                            {' | '}
                            <a href={proj.codeUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-neutral-900">
                              CODE LINK
                            </a>
                          </>
                        )}
                        {proj.hostedUrl && (
                          <>
                            {' | '}
                            <a href={proj.hostedUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-neutral-900">
                              LIVE LINK
                            </a>
                          </>
                        )}
                      </p>
                      <p className="text-neutral-500 font-mono text-[9px] mt-0.5">
                        {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}
                      </p>
                      {proj.description && (
                        <ul className="list-disc pl-3.5 mt-1.5 space-y-1 text-neutral-700 text-[9.5px] leading-relaxed">
                          {proj.description.split('\n').filter(line => line.trim()).map((line, lIdx) => (
                            <li key={lIdx}>{line.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] italic text-neutral-400">No projects added.</p>
              )}
            </div>

            {/* Work Experience */}
            {experienceList && experienceList.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5 uppercase">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="text-[10px]">
                      <p className="font-bold tracking-wide uppercase text-neutral-900">{exp.designation || 'ROLE'}</p>
                      <p className="font-medium text-neutral-800 mt-0.5">
                        {exp.companyName} {exp.location ? `| ${exp.location}` : ''} ({exp.expType})
                      </p>
                      <p className="text-neutral-500 font-mono text-[9px] mt-0.5">
                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                      </p>
                      {exp.description && (
                        <ul className="list-disc pl-3.5 mt-1.5 space-y-1 text-neutral-700 text-[9.5px] leading-relaxed">
                          {exp.description.split('\n').filter(line => line.trim()).map((line, lIdx) => (
                            <li key={lIdx}>{line.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
