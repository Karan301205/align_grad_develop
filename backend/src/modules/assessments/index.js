const scoring = require('./question-bank/scoring');
const selection = require('./question-bank/selection');
const health = require('./question-bank/health');
const maintenance = require('./question-bank/maintenance');
const repositories = {
  questionRepository: require('./question-bank/repositories/questionRepository'),
  testSessionRepository: require('./question-bank/repositories/testSessionRepository'),
  assessmentRepository: require('./question-bank/repositories/assessmentRepository'),
  skillDefinitionRepository: require('./question-bank/repositories/skillDefinitionRepository')
};

module.exports = {
  scoring,
  selection,
  health,
  maintenance,
  repositories
};
