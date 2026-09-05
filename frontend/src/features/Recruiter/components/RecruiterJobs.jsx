import { useState } from 'react';
import { Briefcase, User, ShieldCheck, FileText, RefreshCw, X } from 'lucide-react';
import JobDetailsModal from '../../../components/JobDetailsModal';
import EditJobModal from './EditJobModal';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { apiFetch } from '../../../services/apiClient';
import CandidateProfileModal from './CandidateProfileModal';

export default function RecruiterJobs({ jobs, company, handleUpdateJob, handleDeleteJob, onRefresh, token }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [managingApp, setManagingApp] = useState(null);
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };

  const getRemainingDays = (createdAt, activeDays) => {
    const expiryTime = new Date(createdAt).getTime() + (activeDays || 30) * 24 * 60 * 60 * 1000;
    // eslint-disable-next-line react-hooks/purity
    const remainingMs = expiryTime - Date.now();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return Math.max(0, remainingDays);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Enterprise Job Dashboard"
        subtitle="Manage posted roles and review candidate alignment scores"
        action={
          <span className="px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-lg text-[11px] font-sans font-normal text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">image</span>
            need a recruiter dashboard image
          </span>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Briefcase} label="Active Roles" value={jobs.length} sublabel="Jobs currently open for matches" accent="secondary" />
        <StatCard icon={User} label="Total Applicants" value={totalApplicants} sublabel="Applied candidate profiles" accent="tertiary" />
        <StatCard
          icon={ShieldCheck}
          label="Trust Status"
          value={company?.verified ? 'VERIFIED' : 'PENDING'}
          sublabel="Enterprise verification level"
          accent="primary"
        />
      </div>

      {/* Jobs listing & Applications */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <h3 className="text-lg font-headline font-bold text-on-surface">Active Posted Roles</h3>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-sans font-normal transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            description="Click 'Post New Job' in the sidebar to start matching with candidates."
          />
        ) : (
          [...jobs]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(job => (
            <Card key={job.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4
                      onClick={() => setSelectedJob(job)}
                      className="text-xl font-bold text-on-surface hover:text-primary cursor-pointer hover:underline transition-colors w-max"
                    >
                      {job.title}
                    </h4>
                    <Badge variant={job.opportunityType === 'INTERNSHIP' ? 'tertiary' : 'primary'}>
                      {job.opportunityType === 'INTERNSHIP' ? 'Internship' : 'Job'}
                    </Badge>
                    {job.edited && (
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-headline font-medium rounded-full uppercase tracking-wider shrink-0">
                        Updated
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans font-normal">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="text-primary hover:underline transition-colors text-left"
                    >
                      View specifications & rounds →
                    </button>
                    <span className="text-on-surface-variant/40 select-none">•</span>
                    <button
                      type="button"
                      onClick={() => setEditingJob(job)}
                      className="text-secondary hover:underline transition-colors text-left font-bold"
                    >
                      Edit Role Details
                    </button>
                    <span className="text-on-surface-variant/40 select-none">•</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-error hover:underline transition-colors text-left font-bold"
                    >
                      Remove Manually
                    </button>
                  </div>
                  
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{job.description}</p>
                </div>
                <span className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded text-xs font-sans font-normal text-secondary shrink-0">
                  {job.applications?.length || 0} applications • {getRemainingDays(job.createdAt, job.activeDays)} days left
                </span>
              </div>

              {/* Applicants display */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h5 className="text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant">Applicants</h5>
                    <p className="text-xs text-on-surface-variant font-sans font-normal mt-0.5">
                      {(!job.applications || job.applications.length === 0) 
                        ? 'No candidates have applied yet.' 
                        : `${job.applications.length} candidate(s) applied`}
                    </p>
                  </div>
                  {job.applications && job.applications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewingApplicantsJob(job)}
                      className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-bold font-sans font-normal rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      View Applicants
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reusable Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          isStudent={false}
        />
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdate={handleUpdateJob}
        />
      )}

      {managingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-xl p-6 space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div>
                <span className="text-[10px] font-headline font-medium uppercase tracking-wider text-secondary">Applicant Progress Lab</span>
                <h4 className="text-xl font-bold text-on-surface">Manage Recruitment Progress</h4>
                <p className="text-xs text-on-surface-variant font-sans font-normal mt-0.5">Candidate: {managingApp.student?.name}</p>
              </div>
              <button 
                onClick={() => setManagingApp(null)}
                className="p-1 hover:bg-surface-container-high rounded animate-fade-in"
              >
                <X className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Update the status and add feedback for each round. Completing or rejecting a round updates the candidate's real-time dashboard.
              </p>

              <div className="space-y-4">
                {(managingApp.roundStatuses || []).map((round, idx) => (
                  <div key={idx} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-on-surface">Round {round.roundNumber}: {round.name}</span>
                      <select
                        value={round.status}
                        onChange={(e) => {
                          const updated = [...managingApp.roundStatuses];
                          updated[idx].status = e.target.value;
                          setManagingApp({ ...managingApp, roundStatuses: updated });
                        }}
                        className="bg-surface-container border border-outline-variant rounded-lg text-xs font-sans font-normal text-on-surface px-2 py-1.5 focus:outline-none focus:border-primary"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="CLEARED">Qualified / Cleared</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-headline font-medium text-on-surface-variant uppercase tracking-wider block mb-1">Feedback</label>
                      <textarea
                        value={round.feedback || ''}
                        onChange={(e) => {
                          const updated = [...managingApp.roundStatuses];
                          updated[idx].feedback = e.target.value;
                          setManagingApp({ ...managingApp, roundStatuses: updated });
                        }}
                        placeholder="Add round feedback or instructions..."
                        className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary h-16 resize-none custom-scrollbar"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
              <button
                onClick={() => setManagingApp(null)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface bg-surface-container-high border border-outline-variant rounded-xl hover:brightness-105 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await apiFetch(`/recruiter/applications/${managingApp.id}/rounds`, {
                      token,
                      method: 'PUT',
                      json: {
                        roundStatuses: managingApp.roundStatuses
                      }
                    });
                    if (res.ok) {
                      alert('Progress updated successfully!');
                      setManagingApp(null);
                      if (onRefresh) onRefresh();
                    } else {
                      const d = await res.json();
                      alert(d.error || 'Failed to update progress');
                    }
                  } catch {
                    alert('Error updating progress');
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-on-primary bg-primary rounded-xl hover:brightness-110 active:scale-95 transition-all"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicants List Modal */}
      {viewingApplicantsJob && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-2xl p-6 space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div>
                <span className="text-[10px] font-headline font-medium uppercase tracking-wider text-secondary">Candidate Submissions</span>
                <h4 className="text-xl font-bold text-on-surface">Applicants for {viewingApplicantsJob.title}</h4>
                <p className="text-xs text-on-surface-variant font-sans font-normal mt-0.5">
                  Total applications: {viewingApplicantsJob.applications?.length || 0}
                </p>
              </div>
              <button 
                onClick={() => setViewingApplicantsJob(null)}
                className="p-1 hover:bg-surface-container-high rounded cursor-pointer"
              >
                <X className="w-5 h-5 text-on-surface-variant hover:text-on-surface" />
              </button>
            </div>

            <div className="space-y-4">
              {(!viewingApplicantsJob.applications || viewingApplicantsJob.applications.length === 0) ? (
                <p className="text-sm text-on-surface-variant text-center font-sans font-normal py-4">No candidates have applied yet.</p>
              ) : (
                <div className="space-y-4">
                  {viewingApplicantsJob.applications.map((app, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface-container-high/60 p-4 rounded-xl border border-outline-variant text-left">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-on-surface">{app.student?.name || 'Anonymous Student'}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {app.student?.skills?.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-primary-container border border-primary/20 text-on-primary-container px-1.5 py-0.5 rounded font-sans font-normal">
                              {s.name}: Lvl {s.rating}/10
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(app.student)}
                          className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5 text-primary" /> view profile
                        </button>
                        
                        <a 
                          href={app.student?.resumeUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-secondary" /> View Resume
                        </a>
                        
                        <button
                          type="button"
                          onClick={() => setManagingApp(app)}
                          className="px-2.5 py-1.5 bg-secondary text-on-secondary hover:brightness-105 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Manage Progress
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant">
              <button
                onClick={() => setViewingApplicantsJob(null)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface bg-surface-container-high border border-outline-variant rounded-xl hover:brightness-105 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
