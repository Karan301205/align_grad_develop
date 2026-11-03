const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getApplicationStage,
  calculateHiringProgressSnapshot
} = require('../../src/modules/recruiters/hiringProgress.service');

test('hiringProgress.service - getApplicationStage handles raw statuses', () => {
  assert.equal(getApplicationStage({ status: 'APPLIED' }), 'APPLIED');
  assert.equal(getApplicationStage({ status: 'SHORTLISTED' }), 'SHORTLISTED');
  assert.equal(getApplicationStage({ status: 'INTERVIEW' }), 'INTERVIEW');
  assert.equal(getApplicationStage({ status: 'SCHEDULED' }), 'INTERVIEW');
  assert.equal(getApplicationStage({ status: 'SELECTED' }), 'HIRED');
  assert.equal(getApplicationStage({ status: 'HIRED' }), 'HIRED');
  assert.equal(getApplicationStage({ status: 'OFFER_RECEIVED' }), 'HIRED');
  assert.equal(getApplicationStage({ status: 'REJECTED' }), 'REJECTED');
  assert.equal(getApplicationStage(null), 'APPLIED');
});

test('hiringProgress.service - getApplicationStage evaluates round evaluation states', () => {
  // Screening cleared, round 2 pending -> Shortlisted
  const shortlistedApp = {
    status: 'IN_PROGRESS',
    roundStatuses: [
      { roundNumber: 1, name: 'Resume Screening', status: 'CLEARED' },
      { roundNumber: 2, name: 'Technical Interview', status: 'PENDING' }
    ]
  };
  assert.equal(getApplicationStage(shortlistedApp), 'SHORTLISTED');

  // Round 2 scheduled -> Interview stage
  const interviewApp = {
    status: 'IN_PROGRESS',
    roundStatuses: [
      { roundNumber: 1, name: 'Resume Screening', status: 'CLEARED' },
      { roundNumber: 2, name: 'Technical Interview', status: 'SCHEDULED' }
    ]
  };
  assert.equal(getApplicationStage(interviewApp), 'INTERVIEW');

  // All rounds cleared -> Hired
  const hiredApp = {
    status: 'IN_PROGRESS',
    roundStatuses: [
      { roundNumber: 1, name: 'Resume Screening', status: 'CLEARED' },
      { roundNumber: 2, name: 'Technical Interview', status: 'CLEARED' }
    ]
  };
  assert.equal(getApplicationStage(hiredApp), 'HIRED');

  // Any round rejected -> Rejected
  const rejectedApp = {
    status: 'IN_PROGRESS',
    roundStatuses: [
      { roundNumber: 1, name: 'Resume Screening', status: 'CLEARED' },
      { roundNumber: 2, name: 'Technical Interview', status: 'REJECTED' }
    ]
  };
  assert.equal(getApplicationStage(rejectedApp), 'REJECTED');
});

test('hiringProgress.service - calculateHiringProgressSnapshot across jobs', () => {
  const jobs = [
    {
      id: 'job_1',
      title: 'Frontend Role',
      applications: [
        {
          id: 'app_1',
          status: 'APPLIED',
          roundStatuses: [{ roundNumber: 1, name: 'Screening', status: 'PENDING' }]
        },
        {
          id: 'app_2',
          status: 'SHORTLISTED',
          roundStatuses: [{ roundNumber: 1, name: 'Screening', status: 'CLEARED' }]
        },
        {
          id: 'app_3',
          status: 'IN_PROGRESS',
          roundStatuses: [
            { roundNumber: 1, name: 'Screening', status: 'CLEARED' },
            { roundNumber: 2, name: 'Interview', status: 'SCHEDULED' }
          ]
        },
        {
          id: 'app_4',
          status: 'SELECTED',
          roundStatuses: [
            { roundNumber: 1, name: 'Screening', status: 'CLEARED' },
            { roundNumber: 2, name: 'Interview', status: 'CLEARED' }
          ]
        }
      ]
    },
    {
      id: 'job_2',
      title: 'Backend Role',
      applications: [
        {
          id: 'app_5',
          status: 'REJECTED',
          roundStatuses: [{ roundNumber: 1, name: 'Screening', status: 'REJECTED' }]
        }
      ]
    }
  ];

  const snapshot = calculateHiringProgressSnapshot(jobs);

  assert.equal(snapshot.totalApplicants, 5);
  // Shortlisted includes candidates who cleared screening (app_2, app_3, app_4)
  assert.equal(snapshot.shortlisted, 3);
  // Interviews includes candidates in or completed interview (app_3, app_4)
  assert.equal(snapshot.interviews, 2);
  // Hires includes app_4
  assert.equal(snapshot.hires, 1);
  assert.equal(snapshot.rejected, 1);

  // Exact stage counts
  assert.equal(snapshot.stages.applied, 1);
  assert.equal(snapshot.stages.shortlisted, 1);
  assert.equal(snapshot.stages.interviews, 1);
  assert.equal(snapshot.stages.hires, 1);
  assert.equal(snapshot.stages.rejected, 1);
});

test('hiringProgress.service - calculateHiringProgressSnapshot handles empty or malformed inputs', () => {
  const empty = calculateHiringProgressSnapshot([]);
  assert.equal(empty.totalApplicants, 0);
  assert.equal(empty.shortlisted, 0);
  assert.equal(empty.interviews, 0);
  assert.equal(empty.hires, 0);

  const nonArray = calculateHiringProgressSnapshot(null);
  assert.equal(nonArray.totalApplicants, 0);
});
