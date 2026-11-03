const test = require('node:test');
const assert = require('node:assert');
const { z } = require('zod');
const { postJobSchema, updateJobSchema } = require('../../src/modules/recruiters/recruiter.validator');
const { createGigSchema, applyGigSchema } = require('../../src/modules/gigs/gig.validator');
const { applyJobSchema } = require('../../src/modules/students/student.validator');

test('postJobSchema accepts valid mixed screening questions (MCQs and Long Answer)', () => {
  const validData = {
    title: 'Senior Backend Engineer',
    description: 'Lead our microservices architecture and core platform APIs.',
    requirements: [
      { skillName: 'Node.js', minRating: 6 }
    ],
    screeningQuestions: [
      {
        id: 'q1',
        type: 'MCQ',
        question: 'Which status code represents Created in HTTP?',
        options: ['200', '201', '404', '500'],
        correctAnswer: '201',
        required: true
      },
      {
        id: 'q2',
        type: 'LONG_ANSWER',
        question: 'Explain your experience handling high concurrency database deadlocks.',
        options: [],
        correctAnswer: null,
        required: true
      },
      {
        id: 'q3',
        type: 'MCQ',
        question: 'Which protocol is connection-oriented?',
        options: ['UDP', 'TCP', 'IP'],
        correctAnswer: 'TCP',
        required: false
      }
    ]
  };

  const parsed = postJobSchema.body.parse(validData);
  assert.strictEqual(parsed.screeningQuestions.length, 3);
  assert.strictEqual(parsed.screeningQuestions[0].type, 'MCQ');
  assert.strictEqual(parsed.screeningQuestions[0].correctAnswer, '201');
  assert.strictEqual(parsed.screeningQuestions[1].type, 'LONG_ANSWER');
});

test('postJobSchema rejects MCQ with insufficient options or missing correct answer', () => {
  const invalidData = {
    title: 'Senior Backend Engineer',
    description: 'Lead our microservices architecture and core platform APIs.',
    requirements: [
      { skillName: 'Node.js', minRating: 6 }
    ],
    screeningQuestions: [
      {
        type: 'MCQ',
        question: 'Which is best?',
        options: ['OnlyOneOption'],
        correctAnswer: 'OnlyOneOption',
        required: true
      }
    ]
  };

  assert.throws(() => {
    postJobSchema.body.parse(invalidData);
  });
});

test('createGigSchema accepts valid screening questions', () => {
  const validGig = {
    title: 'Build Responsive React Dashboard',
    description: 'Looking for a skilled frontend freelancer to build admin tables.',
    skills: ['React', 'Tailwind CSS'],
    budget: 15000,
    deliveryTime: '7 Days',
    screeningQuestions: [
      {
        id: 'gig_q1',
        type: 'MCQ',
        question: 'Do you have experience with Tailwind CSS v4?',
        options: ['Yes', 'No'],
        correctAnswer: 'Yes',
        required: true
      },
      {
        id: 'gig_q2',
        type: 'LONG_ANSWER',
        question: 'Link to your live portfolio project demonstrating responsive layouts.',
        required: true
      }
    ]
  };

  const parsed = createGigSchema.body.parse(validGig);
  assert.strictEqual(parsed.screeningQuestions.length, 2);
  assert.strictEqual(parsed.screeningQuestions[0].options.length, 2);
});

test('applyJobSchema and applyGigSchema accept candidate answers payload', () => {
  const applyData = {
    answers: [
      {
        questionId: 'q1',
        questionText: 'Which status code represents Created in HTTP?',
        type: 'MCQ',
        answer: '201'
      },
      {
        questionId: 'q2',
        questionText: 'Explain your experience handling high concurrency database deadlocks.',
        type: 'LONG_ANSWER',
        answer: 'I used pessimistic locking and isolation levels in PostgreSQL to resolve race conditions.'
      }
    ]
  };

  const parsedJobApply = applyJobSchema.body.parse(applyData);
  assert.strictEqual(parsedJobApply.answers.length, 2);
  assert.strictEqual(parsedJobApply.answers[0].answer, '201');

  const parsedGigApply = applyGigSchema.body.parse({
    message: 'I would love to help you build this project!',
    answers: applyData.answers
  });
  assert.strictEqual(parsedGigApply.answers.length, 2);
});

