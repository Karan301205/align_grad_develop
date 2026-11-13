import { useState } from 'react';
import PaymentModal from '../../../components/PaymentModal';
import AccountIcon from '../components/AccountIcon';
import { ACCOUNT_PAGE, MUTED, PAGE_TITLE } from '../components/accountStyles';
import { STEPS } from './constants';
import usePostJobForm from './usePostJobForm';
import useEligiblePool from './useEligiblePool';
import useJobCredits from './useJobCredits';
import Stepper from './components/Stepper';
import { PoolCard, SummaryCard } from './components/SideCards';
import CandidatePreview from './components/CandidatePreview';
import BasicsStep from './steps/BasicsStep';
import SkillsStep from './steps/SkillsStep';
import PayStep from './steps/PayStep';
import ProcessStep from './steps/ProcessStep';
import ReviewStep from './steps/ReviewStep';

/**
 * Post a job, as a 5-step wizard (design: design/jobs_recruiter).
 * Publishing goes through the layout's handlePostJob (POST /recruiter/jobs). The
 * right column shows live data: the candidate count (POST /recruiter/jobs/eligible-count)
 * and job credits (GET /payments/status).
 */
export default function PostJobPage({ company, user, token, handlePostJob, goToTab, setAlertConfig, onRefresh }) {
  const credits = useJobCredits(token);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const form = usePostJobForm({ company, handlePostJob, onNeedCredits: () => setPaymentOpen(true) });
  const pool = useEligiblePool(token, form.values.requirements);
  const stepId = STEPS[form.step].id;
  const notify = (message, type = 'info') => setAlertConfig({ message, type });

  const side = {
    basics: (
      <>
        <PoolCard pool={pool} />
        <SummaryCard values={form.values} variant="basics" credits={credits} />
      </>
    ),
    skills: (
      <>
        <PoolCard pool={pool} showTip />
        <SummaryCard values={form.values} variant="skills" credits={credits} onEditBasics={() => form.goTo(0)} />
      </>
    ),
    pay: (
      <>
        <PoolCard pool={pool} />
        <SummaryCard values={form.values} variant="pay" credits={credits} />
      </>
    ),
    process: (
      <>
        <PoolCard pool={pool} note="Screening questions don’t change this number. Everyone who meets the bars can still apply." />
        <SummaryCard values={form.values} variant="process" credits={credits} />
      </>
    )
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <div id="post-job-top" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-[22px]">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => goToTab('jobs')}
            className={`inline-flex items-center gap-1.5 self-start rounded-[4px] font-(family-name:--font-headline) text-sm font-medium ${MUTED} hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]`}
          >
            <AccountIcon name="chevron-left" size={16} strokeWidth={2} />
            Jobs
          </button>
          <h1 className={`${PAGE_TITLE} text-[26px]`}>
            <span className="font-bold">Post a job</span>
          </h1>
        </div>

        <Stepper step={form.step} furthest={form.furthest} onSelect={form.goTo} />

        <div className="flex flex-wrap items-start gap-6">
          {stepId === 'basics' && <BasicsStep form={form} company={company} onCancel={() => goToTab('jobs')} />}
          {stepId === 'skills' && <SkillsStep form={form} pool={pool} />}
          {stepId === 'pay' && <PayStep form={form} />}
          {stepId === 'process' && <ProcessStep form={form} />}
          {stepId === 'review' && <ReviewStep form={form} company={company} pool={pool} credits={credits} onBuyCredits={() => setPaymentOpen(true)} />}

          {stepId === 'review' ? (
            <CandidatePreview values={form.values} company={company} />
          ) : (
            <div className="flex min-w-0 grow basis-[320px] flex-col gap-4 lg:sticky lg:top-8">{side[stepId]}</div>
          )}
        </div>
      </div>

      {credits.offer?.jobCredits > 0 && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          planType={credits.offer.planType}
          offer={credits.offer}
          token={token}
          user={user}
          onSuccess={(result) => {
            notify(result?.alreadyProcessed ? 'This payment was already added to your account.' : `${credits.offer.jobCredits} job credits added. You can publish now.`, 'success');
            credits.reload();
            onRefresh({ silent: true }); // keeps this page (and the draft) mounted
          }}
          onFailure={(err) => notify(err?.message || 'Payment failed', 'error')}
        />
      )}
    </div>
  );
}
