import { useState } from 'react';
import { FileText, User, UserCheck, Search, Filter, MapPin, Briefcase } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import EmptyState from '../../../components/ui/EmptyState';
import CandidateProfileModal from './CandidateProfileModal';
import { INDIAN_STATES } from '../../../constants/indianStates';

export default function RecruiterCandidates({ candidates }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const filteredCandidates = candidates.filter(cand => {
    const query = searchQuery.toLowerCase();
    const nameMatch = (cand.name || '').toLowerCase().includes(query);
    const usernameMatch = (cand.username || '').toLowerCase().includes(query);
    const searchMatch = nameMatch || usernameMatch;

    const modeMatch = !workModeFilter || (cand.preferredWorkModes && cand.preferredWorkModes.includes(workModeFilter));
    const typeMatch = !workTypeFilter || (cand.preferredWorkTypes && cand.preferredWorkTypes.includes(workTypeFilter));
    
    let locationMatch = true;
    if (locationFilter) {
      if (locationFilter === 'Any Location') {
        locationMatch = Boolean(cand.openToAnyLocation);
      } else {
        locationMatch = (cand.preferredLocations && cand.preferredLocations.includes(locationFilter)) || Boolean(cand.openToAnyLocation);
      }
    }

    return searchMatch && modeMatch && typeMatch && locationMatch;
  });

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Explore Stacks & Candidates"
        subtitle="Browse candidate profiles and filter skill requirements"
      />

      {/* Search Bar & 3 Filters Toolbar */}
      <div className="bg-surface-container border border-outline-variant p-4 rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Search Input Box */}
          <div className="relative flex-1 w-full max-w-sm">
            <input
              type="text"
              placeholder="Search candidates by username or name..."
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
          </div>

          {/* 3 Filters Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Filter 1: Mode of Work */}
            <select
              value={workModeFilter}
              onChange={e => handleFilterChange(setWorkModeFilter, e.target.value)}
              className="bg-surface-container-high border border-outline-variant text-on-surface text-xs font-sans font-normal rounded-xl px-3 py-2 focus:border-primary focus:outline-none transition-all cursor-pointer"
            >
              <option value="">All Work Modes</option>
              <option value="Remote">Remote</option>
              <option value="On-Site">On-Site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            {/* Filter 2: Type of Work */}
            <select
              value={workTypeFilter}
              onChange={e => handleFilterChange(setWorkTypeFilter, e.target.value)}
              className="bg-surface-container-high border border-outline-variant text-on-surface text-xs font-sans font-normal rounded-xl px-3 py-2 focus:border-primary focus:outline-none transition-all cursor-pointer"
            >
              <option value="">All Work Types</option>
              <option value="Internship">Internship</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Full-Time">Full-Time</option>
            </select>

            {/* Filter 3: Preferred Location(s) in India */}
            <select
              value={locationFilter}
              onChange={e => handleFilterChange(setLocationFilter, e.target.value)}
              className="bg-surface-container-high border border-outline-variant text-on-surface text-xs font-sans font-normal rounded-xl px-3 py-2 focus:border-primary focus:outline-none transition-all cursor-pointer max-w-[190px] truncate"
            >
              <option value="">All Locations (India)</option>
              <option value="Any Location">Open to Relocate / Any</option>
              <optgroup label="States & Union Territories">
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </optgroup>
            </select>

            {/* Reset Filters */}
            {(workModeFilter || workTypeFilter || locationFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setWorkModeFilter('');
                  setWorkTypeFilter('');
                  setLocationFilter('');
                  setCurrentPage(1);
                }}
                className="text-[11px] font-sans font-normal text-primary hover:text-primary/80 font-bold px-2 py-1 cursor-pointer transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-sans font-normal text-on-surface-variant pt-2 border-t border-outline-variant/40">
          <span>Active Filters applied: <span className="font-bold text-primary">{[workModeFilter, workTypeFilter, locationFilter, searchQuery].filter(Boolean).length}</span></span>
          <span>Matching Candidates: <span className="font-bold text-primary">{filteredCandidates.length}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedCandidates.length === 0 ? (
          <div className="col-span-1 md:col-span-2">
            <EmptyState icon={User} title="No candidates found" description="No profiles match your search criteria." />
          </div>
        ) : (
          paginatedCandidates.map(cand => (
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
                        <p className="text-xs text-primary font-sans font-normal font-medium">@{cand.username}</p>
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
                  <span className="text-xs text-on-surface-variant font-sans font-normal">Candidate</span>
                  {cand.introVideoUrl && (
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-headline font-medium text-primary rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      🎥 Showcase Video
                    </span>
                  )}
                  {cand.preferredWorkModes && cand.preferredWorkModes.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-headline font-medium text-primary rounded">
                      {m}
                    </span>
                  ))}
                  {cand.preferredWorkTypes && cand.preferredWorkTypes.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 text-[9px] font-headline font-medium text-secondary rounded">
                      {t}
                    </span>
                  ))}
                  {cand.openToAnyLocation && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-headline font-medium text-emerald-600 rounded">
                      📍 Open to Relocate
                    </span>
                  )}
                  {!cand.openToAnyLocation && cand.preferredLocations && cand.preferredLocations.slice(0, 2).map(l => (
                    <span key={l} className="px-2 py-0.5 bg-surface-container-high border border-outline-variant text-[9px] font-sans font-normal text-on-surface-variant rounded">
                      📍 {l}
                    </span>
                  ))}
                </div>

                {/* Stacks display */}
                <div className="space-y-2">
                  <p className="text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant">Proficiency Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills && cand.skills.length > 0 ? (
                      cand.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded text-xs font-sans font-normal text-on-surface">
                          {s.name} <span className="text-primary font-bold">Lvl {s.rating}/10</span>
                          {s.verifiedRating && (
                            <span className="ml-1 text-[9px] bg-secondary/20 text-secondary px-1 py-0.2 rounded font-bold">✓ Verified</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-on-surface-variant font-sans font-normal">No skills rated yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(cand)}
                className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs font-bold text-on-surface rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                View Full Profile
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls Bar */}
      {filteredCandidates.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-outline-variant/50 font-sans font-normal text-xs text-on-surface-variant">
          <div>
            Showing <span className="font-bold text-primary">{startIndex + 1}</span> - <span className="font-bold text-primary">{Math.min(startIndex + ITEMS_PER_PAGE, filteredCandidates.length)}</span> of <span className="font-bold text-primary">{filteredCandidates.length}</span> profiles
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-primary text-on-primary border border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
