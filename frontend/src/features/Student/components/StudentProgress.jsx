import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  DollarSign, 
  AlertCircle, 
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';

export default function StudentProgress({ applications, loading }) {
  const [selectedApp, setSelectedApp] = useState(null);

  // Auto-select first application if none selected
  const activeApp = selectedApp || (applications.length > 0 ? applications[0] : null);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (name) => {
    const colors = [
      'bg-primary text-on-primary',
      'bg-secondary text-on-secondary',
      'bg-tertiary text-on-tertiary',
      'bg-success-container text-on-success-container',
      'bg-error-container text-on-error-container font-bold'
    ];
    let sum = 0;
    for (let i = 0; i < (name || '').length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const getStatusBadgeType = (status) => {
    switch (status?.toUpperCase()) {
      case 'SELECTED':
      case 'OFFER_RECEIVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'IN_PROGRESS':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoundStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'CLEARED':
      case 'QUALIFIED':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return (
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-primary/40 opacity-75"></span>
            <Clock className="w-5 h-5 text-primary relative" />
          </div>
        );
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/30"></div>;
    }
  };

  const getRoundStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
      case 'CLEARED':
      case 'QUALIFIED':
        return 'text-success font-semibold';
      case 'REJECTED':
        return 'text-error font-semibold';
      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return 'text-primary font-semibold';
      default:
        return 'text-on-surface-variant/60';
    }
  };

  // Determine the display state list of rounds
  const getProcessedRounds = (app) => {
    if (!app) return [];
    
    // Automatically include the first 'Applied for Job' step
    const list = [
      {
        name: 'Applied for Job',
        status: 'CLEARED',
        feedback: 'Your application has been received successfully.',
        date: app.createdAt
      }
    ];

    // Append subsequent rounds
    let stopFlow = false;
    const rawRounds = app.roundStatuses || [];

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
          stopFlow = true; // Stop active stepper flow after rejection
        }
      }
    }

    return list;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <h2 className="text-2xl font-headline font-bold text-on-surface border-b border-outline-variant pb-3">Your Job Progress</h2>
        <EmptyState
          icon={ClipboardList}
          title="No applications tracked yet"
          description="Start applying to jobs in the 'Opportunities' tab to monitor your recruitment stages here in real-time."
        />
      </div>
    );
  }

  const processedRounds = getProcessedRounds(activeApp);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-outline-variant pb-3">
        <h2 className="text-2xl font-headline font-bold text-on-surface">Your Job Progress</h2>
        <p className="text-xs text-on-surface-variant font-mono mt-0.5">Track real-time selection rounds and updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Application List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant px-1">Applied Roles</h3>
          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            {applications.map((app) => {
              const isActive = activeApp?.id === app.id;
              const hasRejected = (app.roundStatuses || []).some(r => r.status?.toUpperCase() === 'REJECTED');
              const displayStatus = hasRejected ? 'REJECTED' : app.status;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/20' 
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow ${getAvatarBg(app.job?.companyName)}`}>
                      {getInitials(app.job?.companyName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{app.job?.title}</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{app.job?.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1.5 ml-2">
                    <Badge type={getStatusBadgeType(displayStatus)}>
                      {displayStatus === 'APPLIED' ? 'Pending' : displayStatus?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Rounds Stepper */}
        <div className="lg:col-span-2">
          {activeApp && (
            <Card className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-5 border-b border-outline-variant">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md shrink-0 ${getAvatarBg(activeApp.job?.companyName)}`}>
                    {getInitials(activeApp.job?.companyName)}
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-on-surface">{activeApp.job?.title}</h3>
                    <p className="text-sm text-on-surface-variant font-mono mt-0.5">{activeApp.job?.companyName}</p>
                    
                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {activeApp.job?.location || 'Remote'}
                      </span>
                      <span className="text-on-surface-variant/20 select-none">•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Stipend: {activeApp.job?.stipend || '20 K/mo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5 font-mono">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Overall Status</span>
                  <Badge type={getStatusBadgeType(activeApp.status)}>
                    {activeApp.status === 'APPLIED' ? 'Pending' : activeApp.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Recruitment Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Selection Timeline</h4>
                
                <div className="relative pl-6 space-y-8 mt-4">
                  {/* Stepper Vertical Connector Line */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-outline-variant"></div>

                  {processedRounds.map((round, idx) => {
                    const isSystemStep = round.name === 'Applied for Job';
                    const displayStatus = round.status?.toLowerCase();

                    return (
                      <div key={idx} className="relative flex flex-col gap-2">
                        {/* Status Icon */}
                        <div className="absolute -left-6 top-1.5 w-5 h-5 flex items-center justify-center bg-background rounded-full z-10">
                          {getRoundStatusIcon(round.status)}
                        </div>

                        {/* Round Info */}
                        <div className="pl-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h5 className="text-sm font-bold text-on-surface">{round.name}</h5>
                            <span className={`text-xs font-mono capitalize ${getRoundStatusStyles(round.status)}`}>
                              {displayStatus === 'cleared' || displayStatus === 'qualified' ? 'Cleared' : displayStatus?.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Date for system step or optional updatedAt */}
                          {(round.date || isSystemStep) && (
                            <span className="text-[10px] text-on-surface-variant font-mono mt-0.5 block">
                              {formatDate(round.date || activeApp.createdAt)}
                            </span>
                          )}

                          {/* Recruiter Feedback box */}
                          {round.feedback && (
                            <div className="mt-2.5 p-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface-variant leading-relaxed">
                              <p className="font-mono text-[9px] uppercase tracking-wider text-secondary mb-1">Feedback</p>
                              {round.feedback}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
