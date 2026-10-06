import React from 'react';

/**
 * Standardized A4 Resume PDF Template.
 * Designed to be rendered off-screen and captured by html2canvas-pro + jsPDF
 * to generate a high-fidelity, standardized candidate resume.
 */
export default function ResumePdfTemplate({
  id = 'resume-pdf-template',
  candidate = {}
}) {
  const name = candidate.name || 'CANDIDATE NAME';
  const bio = candidate.bio || '';
  const email = candidate.email || candidate.profileEmail || '';
  const phone = candidate.phone || '';
  const nationality = candidate.nationality || (candidate.preferredLocations && candidate.preferredLocations[0]) || '';
  const socialLinks = candidate.socialLinks || {};

  const educationList = candidate.education || candidate.educationList || [];
  const experienceList = candidate.experience || candidate.experienceList || [];
  const certificatesList = candidate.certificates || candidate.certificatesList || [];
  const skillsList = candidate.skills || candidate.skillsList || [];
  const projectsList = candidate.projects || candidate.projectsList || [];

  const headline = experienceList[0]?.designation || experienceList[0]?.title || candidate.title || (candidate.username ? `@${candidate.username}` : 'Technical Professional');
  const headlineSub = experienceList[0]?.companyName || experienceList[0]?.company || 'AlignGrade Verified Candidate';

  return (
    <div
      id={id}
      className="bg-white text-neutral-900 font-sans"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        boxSizing: 'border-box',
        fontSize: '11px',
        lineHeight: '1.5',
        backgroundColor: '#ffffff',
        color: '#171717',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-neutral-300">
        <h1 className="text-2xl font-bold tracking-[0.2em] text-black font-serif">
          {name}
        </h1>
        <p className="text-[10.5px] tracking-[0.15em] text-neutral-600 italic mt-1">
          {headline} {headlineSub ? `|| ${headlineSub}` : ''}
        </p>
      </div>

      {/* Two Columns Grid */}
      <div className="flex w-full" style={{ minHeight: '240mm' }}>
        
        {/* Left Column (35% width) */}
        <div className="w-[35%] pr-5 flex flex-col gap-5">
          {/* Contact */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Contact
            </h2>
            <ul className="space-y-2 text-[10px] text-neutral-700">
              {phone && (
                <li className="flex items-center gap-2">
                  <span className="text-[11px]">📞</span>
                  <span>{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[11px]">✉️</span>
                  <span className="truncate">{email}</span>
                </li>
              )}
              {nationality && (
                <li className="flex items-center gap-2">
                  <span className="text-[11px]">📍</span>
                  <span>{nationality}</span>
                </li>
              )}
              {socialLinks?.linkedin && (socialLinks?.showLinkedin ?? true) && (
                <li className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[11px]">🌐</span>
                  <a href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://${socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="underline truncate">
                    LinkedIn Profile
                  </a>
                </li>
              )}
              {socialLinks?.portfolio && (socialLinks?.showPortfolio ?? true) && (
                <li className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[11px]">🕸️</span>
                  <a href={socialLinks.portfolio.startsWith('http') ? socialLinks.portfolio : `https://${socialLinks.portfolio}`} target="_blank" rel="noopener noreferrer" className="underline truncate">
                    Portfolio Site
                  </a>
                </li>
              )}
              {socialLinks?.github && (socialLinks?.showGithub ?? true) && (
                <li className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[11px]">💻</span>
                  <a href={socialLinks.github.startsWith('http') ? socialLinks.github : `https://${socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="underline truncate">
                    GitHub Profile
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Education
            </h2>
            {educationList && educationList.length > 0 ? (
              <div className="space-y-3">
                {educationList.map((edu, idx) => (
                  <div key={idx} className="text-[10px]">
                    <p className="font-bold text-neutral-900">
                      {edu.degree || edu.fieldOfStudy || 'Degree'}
                      {edu.fieldOfStudy && edu.degree && edu.degree !== edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}
                    </p>
                    <p className="text-neutral-500 text-[9.5px] mt-0.5">
                      {edu.startDate || edu.startYear || ''} {edu.endDate || edu.endYear ? `- ${edu.endDate || edu.endYear}` : ''}
                    </p>
                    <p className="text-neutral-700 mt-0.5">{edu.institute || edu.school || ''}</p>
                    {edu.gradeValue && (
                      <p className="text-neutral-600 font-medium mt-0.5">
                        {edu.gradeType || 'Grade'}: {edu.gradeValue}
                      </p>
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
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Certifications
            </h2>
            {certificatesList && certificatesList.length > 0 ? (
              <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-neutral-700">
                {certificatesList.map((cert, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-neutral-900">{cert.title || cert.name}</span>
                    {(cert.org || cert.issuer) && ` - ${cert.org || cert.issuer}`}
                    {(cert.startDate || cert.issueDate) && (
                      <span className="text-neutral-500 ml-1">({cert.startDate || cert.issueDate})</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[9px] italic text-neutral-400">No certifications added.</p>
            )}
          </div>

          {/* Skills & Verified Ratings */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Skills & Ratings
            </h2>
            {skillsList && skillsList.length > 0 ? (
              <ul className="list-disc pl-3.5 space-y-1.5 text-[9.5px] text-neutral-700">
                {skillsList.map((skill, idx) => {
                  const sName = typeof skill === 'string' ? skill : skill.name;
                  const sRating = typeof skill === 'object' ? (skill.verifiedRating !== null && skill.verifiedRating !== undefined ? skill.verifiedRating : skill.rating) : null;
                  const isVerified = typeof skill === 'object' && Boolean(skill.verifiedRating);

                  return (
                    <li key={idx} className="font-medium">
                      {sName}
                      {sRating && (
                        <span className="text-[9px] text-neutral-600 font-sans italic ml-1">
                          (LVL {sRating}/10{isVerified ? ' • VERIFIED' : ''})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[9px] italic text-neutral-400">No skills rated yet.</p>
            )}
          </div>
        </div>

        {/* Right Column (65% width) - divided by a vertical line */}
        <div className="w-[65%] pl-5 border-l border-neutral-300 flex flex-col gap-5">
          {/* Profile Summary */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Profile Summary
            </h2>
            <p className="text-[10px] text-neutral-700 leading-relaxed whitespace-pre-line">
              {bio || 'Verified candidate profile on AlignGrade platform.'}
            </p>
          </div>

          {/* My Projects */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
              Projects
            </h2>
            {projectsList && projectsList.length > 0 ? (
              <div className="space-y-4">
                {projectsList.map((proj, idx) => (
                  <div key={idx} className="text-[10px]">
                    <p className="font-bold tracking-wide text-neutral-900">{proj.title || 'Project'}</p>
                    <p className="font-semibold text-neutral-800 text-[9.5px] mt-0.5">
                      <span className="underline">{proj.role || 'Contributor'}</span>
                      {proj.codeUrl && (
                        <>
                          {' | '}
                          <a href={proj.codeUrl.startsWith('http') ? proj.codeUrl : `https://${proj.codeUrl}`} target="_blank" rel="noopener noreferrer" className="underline font-bold text-neutral-900">
                            CODE REPO
                          </a>
                        </>
                      )}
                      {proj.hostedUrl && (
                        <>
                          {' | '}
                          <a href={proj.hostedUrl.startsWith('http') ? proj.hostedUrl : `https://${proj.hostedUrl}`} target="_blank" rel="noopener noreferrer" className="underline font-bold text-neutral-900">
                            LIVE DEMO
                          </a>
                        </>
                      )}
                    </p>
                    {(proj.startDate || proj.endDate) && (
                      <p className="text-neutral-500 text-[9px] mt-0.5">
                        {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}
                      </p>
                    )}
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
              <h2 className="text-[11px] font-bold tracking-[0.15em] text-black border-b border-neutral-300 pb-1 mb-2.5">
                Work Experience
              </h2>
              <div className="space-y-4">
                {experienceList.map((exp, idx) => (
                  <div key={idx} className="text-[10px]">
                    <p className="font-bold tracking-wide text-neutral-900">{exp.designation || exp.title || 'Role'}</p>
                    <p className="font-medium text-neutral-800 mt-0.5">
                      {exp.companyName || exp.company} {exp.location ? `| ${exp.location}` : ''} {exp.expType ? `(${exp.expType})` : ''}
                    </p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-neutral-500 text-[9px] mt-0.5">
                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : (exp.endDate || '')}
                      </p>
                    )}
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
  );
}
