import { useState } from 'react';
import { FileText, User, UserCheck, Search } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import EmptyState from '../../../components/ui/EmptyState';
import CandidateProfileModal from './CandidateProfileModal';

export default function RecruiterCandidates({ candidates }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = candidates.filter(cand => {
    const query = searchQuery.toLowerCase();
    const nameMatch = (cand.name || '').toLowerCase().includes(query);
    const usernameMatch = (cand.username || '').toLowerCase().includes(query);
    return nameMatch || usernameMatch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Explore Stacks & Candidates"
        subtitle="Browse candidate profiles and filter skill requirements"
      />

      {/* Search Input Box */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search candidates by username or name..."
            className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-1 md:col-span-2">
            <EmptyState icon={User} title="No candidates found" description="No profiles match your search criteria." />
          </div>
        ) : (
          filteredCandidates.map(cand => (
            <div key={cand.id} className="p-6 bg-surface-container border border-outline-variant rounded-2xl flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all group">
              <div className="space-y-4">
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-outline-variant flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                      {cand.profilePic ? (
                        <img src={cand.profilePic} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        cand.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{cand.name}</h4>
                      {cand.username && (
                        <p className="text-xs text-primary font-mono font-medium">@{cand.username}</p>
                      )}
                    </div>
                  </div>
                  {cand.resumeUrl && (
                    <a href={cand.resumeUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs text-secondary rounded flex items-center gap-1 transition-all">
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                  <span className="text-xs text-on-surface-variant font-mono">Candidate</span>
                  {cand.introVideoUrl && (
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-mono font-bold text-primary rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      🎥 Showcase Video
                    </span>
                  )}
                </div>

                {/* Stacks display */}
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Proficiency Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills && cand.skills.length > 0 ? (
                      cand.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface">
                          {s.name} <span className="text-primary font-bold">Lvl {s.rating}/10</span>
                          {s.verifiedRating && (
                            <span className="ml-1 text-[9px] bg-secondary/20 text-secondary px-1 py-0.2 rounded font-bold">✓ Verified</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-on-surface-variant font-mono">No skills rated yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(cand)}
                className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs font-bold text-on-surface rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                View Full Profile
              </button>
            </div>
          ))
        )}
      </div>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
