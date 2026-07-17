import React, { useState } from 'react';
import { Award, CheckCircle, TrendingUp, Building, ShieldCheck, Send, Lock, RefreshCw } from 'lucide-react';
import JobDetailsModal from '../../../components/JobDetailsModal';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { ALL_SKILLS } from '../../../constants';

export default function StudentDashboard({ jobs, skillCount, appliedCount, handleApply, setTestSkill, onRefresh, onOpenCompanyProfile, autoSelectOpportunity, setAutoSelectOpportunity }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const matchingRate = jobs.length > 0 ? Math.round((jobs.filter(j => j.matched).length / jobs.length) * 100) : 0;
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (autoSelectOpportunity && autoSelectOpportunity.type === 'job') {
      const job = jobs.find(j => j.id === autoSelectOpportunity.id);
      if (job) {
        setSelectedJob(job);
        setAutoSelectOpportunity(null);
      }
    }
  }, [autoSelectOpportunity, jobs, setAutoSelectOpportunity]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Opportunities Portal"
        subtitle="Matched jobs based on your verified self-ratings"
        action={
          <div className="flex items-center gap-3 bg-surface-container-high border border-outline-variant px-4 py-2 rounded-xl text-xs font-mono text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Matching Engine Active</span>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Award} label="Verified Skill Sets" value={skillCount} sublabel="Self-rated stacks in profile" accent="secondary" />
        <StatCard icon={CheckCircle} label="Active Applications" value={appliedCount} sublabel="Total jobs applied" accent="tertiary" />
        <StatCard icon={TrendingUp} label="Matching Rate" value={`${matchingRate}%`} sublabel="Jobs meeting your parameters" accent="primary" />
      </div>

      {/* Jobs listing */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <h3 className="text-lg font-headline font-bold text-on-surface">Matching Open Roles</h3>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No jobs have been posted yet"
            description="Check back soon — new opportunities are matched against your profile automatically."
          />
        ) : (
          [...jobs]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(job => (
            <Card key={job.id} hover className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-surface-container-high border border-outline-variant text-primary text-[10px] font-mono rounded-full flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    {job.companyName || job.company?.name || 'Aether Corp'}
                  </span>
                  {job.company?.verified && (
                    <Badge variant="success" icon={ShieldCheck}>Verified</Badge>
                  )}
                </div>
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
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-mono font-bold rounded-full uppercase tracking-wider shrink-0">
                      Updated
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">{job.description}</p>

                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="text-xs text-primary hover:text-primary/80 font-mono transition-colors block text-left"
                >
                  View full specifications & recruitment process →
                </button>

                {/* Requirements */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {job.requirements?.map((req, i) => {
                    const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === req.skillName.toLowerCase());
                    const isTech = skillObj ? skillObj.type === 'technical' : true;
                    return (
                      <span key={i} className="px-2.5 py-1 bg-surface-container-high border border-outline-variant rounded text-xs font-mono text-on-surface">
                        {req.skillName} {isTech ? <span className="text-primary font-bold">Lvl {req.minRating}/10</span> : <span className="text-on-surface-variant opacity-60 text-[9px] uppercase tracking-wider bg-surface-container-low px-1 py-0.5 rounded border border-outline-variant ml-1">Non-Technical</span>}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Apply / Test Action */}
              <div className="w-full md:w-auto flex flex-col gap-2.5 items-end justify-center shrink-0">
                {job.applied ? (
                  <Badge variant="success" icon={CheckCircle} className="px-4 py-2.5 text-xs normal-case">Applied</Badge>
                ) : job.matched ? (
                  <Button icon={Send} onClick={() => handleApply(job.id)} fullWidth className="md:w-auto">
                    Apply Now
                  </Button>
                ) : (
                  <div className="space-y-2 w-full md:w-auto text-right">
                    <div className="text-xs text-error font-mono flex items-center gap-1.5 justify-end">
                      <Lock className="w-3.5 h-3.5" /> Below Skill Threshold
                    </div>
                    {job.missingRequirements?.map((mr, idx) => (
                      <p key={idx} className="text-[10px] text-on-surface-variant font-mono">
                        Need {mr.skillName} Lvl {mr.requiredRating} (Have {mr.currentRating})
                      </p>
                    ))}
                    <Button
                      variant="tertiary"
                      icon={Award}
                      fullWidth
                      onClick={() => setTestSkill({
                        skillName: job.missingRequirements[0].skillName,
                        targetRating: job.missingRequirements[0].requiredRating,
                        jobId: job.id
                      })}
                    >
                      Upgrade via Test
                    </Button>
                  </div>
                )}
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
          onApply={handleApply}
          onUpgrade={setTestSkill}
          isStudent={true}
          onOpenCompanyProfile={onOpenCompanyProfile}
        />
      )}
    </div>
  );
}
