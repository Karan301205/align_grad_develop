import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  DollarSign, 
  ClipboardList,
  ChevronRight,
  Briefcase
} from 'lucide-react';

export default function StudentProgress({ applications = [], loading = false }) {
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Auto-select first application if none explicitly selected or if selected application disappears
  const activeApp = (selectedAppId ? applications.find(a => a.id === selectedAppId) : null) || (applications.length > 0 ? applications[0] : null);

  const getInitials = (name) => {
    if (!name) return '??';
    const cleanName = name.replace(/^c_/i, '').trim();
    if (!cleanName) return '??';
    return cleanName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'SELECTED':
      case 'OFFER_RECEIVED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 shrink-0">
            Selected
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700 shrink-0">
            Rejected
          </span>
        );
      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 shrink-0">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
            {status === 'APPLIED' ? 'Pending' : (status?.replace('_', ' ') || 'Pending')}
          </span>
        );
    }
  };

  const getRoundStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'CLEARED':
      case 'QUALIFIED':
      case 'SELECTED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 bg-surface shrink-0" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 bg-surface shrink-0" />;
      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return (
          <div className="relative flex items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-blue-400/40 opacity-75"></span>
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 bg-surface relative" />
          </div>
        );
      default:
        return <div className="w-3 h-3 rounded-none bg-slate-400 dark:bg-slate-600 shrink-0 mt-1"></div>;
    }
  };

  const getRoundStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CLEARED':
      case 'QUALIFIED':
      case 'SELECTED':
        return (
          <span className="text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400">
            Cleared
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-xs font-headline font-bold text-red-700 dark:text-red-400">
            Not Cleared
          </span>
        );
      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return (
          <span className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400">
            In Progress
          </span>
        );
      default:
        return (
          <span className="text-xs font-headline font-medium text-slate-500 dark:text-slate-400">
            Pending
          </span>
        );
    }
  };

  // Determine the display state list of rounds (excluding 'Applied for Job' per requirements)
  const getProcessedRounds = (app) => {
    if (!app) return [];
    
    // Filter out 'Applied for Job' and 'Applied' system step
    const rawRounds = (app.roundStatuses || []).filter(
      r => r.name?.toLowerCase() !== 'applied for job' && r.name?.toLowerCase() !== 'applied'
    );

    let stopFlow = false;
    const list = [];

    for (const round of rawRounds) {
      if (stopFlow) {
        list.push({
          ...round,
          status: 'LOCKED',
          feedback: 'Recruitment process stopped.'
        });
      } else {
        list.push(round);
        if (round.status?.toUpperCase() === 'REJECTED') {
          stopFlow = true;
        }
      }
    }

    return list;
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-12">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">
          Loading Job Progress...
        </p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="w-full space-y-6 animate-fade-in">
        <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-headline font-bold text-slate-900 dark:text-slate-100">
            Your Job Progress
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">
            Track real-time selection rounds and updates
          </p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-12 text-center space-y-3 shadow-2xs">
          <ClipboardList className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="font-headline font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            No applications tracked yet
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans max-w-md mx-auto">
            Start applying to opportunities in the &apos;Opportunities&apos; tab to monitor your recruitment stages here in real-time.
          </p>
        </div>
      </div>
    );
  }

  const processedRounds = getProcessedRounds(activeApp);
  const rawActiveCompany = activeApp?.job?.companyName || activeApp?.job?.company?.name || '';
  const activeCompanyDisplayName = rawActiveCompany.replace(/^c_/i, '');
  const activeLogoUrl = activeApp?.job?.company?.logoUrl || activeApp?.job?.logoUrl || activeApp?.job?.companyLogo;
  const hasActiveRejected = (activeApp?.roundStatuses || []).some(r => r.status?.toUpperCase() === 'REJECTED');
  const activeDisplayStatus = hasActiveRejected ? 'REJECTED' : activeApp?.status;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Section Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
        <h2 className="text-xl sm:text-2xl font-headline font-bold text-slate-900 dark:text-slate-100">
          Your Job Progress
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">
          Track real-time selection rounds and updates
        </p>
      </div>

      {/* Unified Single Container for Jobs List + Process */}
      <div className="w-full bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 dark:divide-slate-700 min-h-[560px]">
        
        {/* Left Column: Applied Roles List */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
          {/* Subheader */}
          <div className="p-3.5 sm:p-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between bg-surface shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">
                Applied Roles
              </h3>
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 text-blue-900 dark:text-blue-200 text-[10px] font-bold rounded-none">
                {applications.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans hidden sm:inline">
              Select to inspect
            </span>
          </div>

          {/* Edge-to-Edge Stacked Applied Jobs */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 custom-scrollbar max-h-[640px]">
            {applications.map((app) => {
              const isActive = activeApp?.id === app.id;
              const hasRejected = (app.roundStatuses || []).some(r => r.status?.toUpperCase() === 'REJECTED');
              const displayStatus = hasRejected ? 'REJECTED' : app.status;
              const rawCompanyName = app.job?.companyName || app.job?.company?.name || '';
              const companyDisplayName = rawCompanyName.replace(/^c_/i, '');
              const logoUrl = app.job?.company?.logoUrl || app.job?.logoUrl || app.job?.companyLogo;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-700 shadow-2xs' 
                      : 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-900/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt={companyDisplayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-headline font-bold text-xs text-slate-800 dark:text-slate-200">
                          {getInitials(companyDisplayName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 truncate">
                        {app.job?.title || 'Job Opening'}
                      </p>
                      <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {companyDisplayName || 'Company'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {getStatusBadge(displayStatus)}
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-blue-700 dark:text-blue-400 translate-x-0.5' : 'text-slate-400 dark:text-slate-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Rounds Progress */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col bg-surface p-5 sm:p-7 space-y-6">
          {activeApp && (
            <>
              {/* Header Info Card */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {activeLogoUrl ? (
                      <img src={activeLogoUrl} alt={activeCompanyDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-headline font-extrabold text-base text-slate-800 dark:text-slate-200">
                        {getInitials(activeCompanyDisplayName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      {activeApp.job?.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans font-medium text-slate-600 dark:text-slate-400">
                      {activeCompanyDisplayName}
                    </p>
                    
                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-sans pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                        <span>{activeApp.job?.location || 'Remote'}</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 select-none">&bull;</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>{activeApp.job?.opportunityType === 'INTERNSHIP' ? 'Stipend' : 'Salary'}: {activeApp.job?.showSalary === false ? 'Undisclosed' : (activeApp.job?.stipend || activeApp.job?.stipendFullTime || '20 K/mo')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <span className="text-[10px] font-headline font-bold text-slate-500 tracking-wider">
                    Overall Status
                  </span>
                  {getStatusBadge(activeDisplayStatus)}
                </div>
              </div>

              {/* Selection Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs sm:text-sm font-headline font-bold  tracking-wider text-slate-900 dark:text-slate-100">
                  Selection Timeline
                </h4>
                
                {processedRounds.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-center space-y-2">
                    <Clock className="w-6 h-6 text-blue-700 dark:text-blue-400 mx-auto" />
                    <h5 className="font-headline font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Selection Rounds in Progress
                    </h5>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Your application has been received and is currently under review with {activeCompanyDisplayName}. Upcoming selection rounds will appear here once scheduled.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 mt-2">
                    {/* Stepper Vertical Connector Line */}
                    <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-300 dark:bg-slate-700"></div>

                    {processedRounds.map((round, idx) => {
                      return (
                        <div key={idx} className="relative flex flex-col gap-1.5">
                          {/* Status Icon */}
                          <div className="absolute -left-6 top-0.5 w-5 h-5 flex items-center justify-center bg-surface z-10">
                            {getRoundStatusIcon(round.status)}
                          </div>

                          {/* Round Info */}
                          <div className="pl-3 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h5 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">
                                {round.name}
                              </h5>
                              {getRoundStatusBadge(round.status)}
                            </div>

                            {round.date && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block">
                                {formatDate(round.date)}
                              </span>
                            )}

                            {/* Recruiter Feedback box */}
                            {round.feedback && (
                              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans shadow-2xs">
                                <p className="font-headline font-bold text-[10px] tracking-wider text-emerald-800 dark:text-emerald-400 mb-0.5">
                                  Feedback
                                </p>
                                {round.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
