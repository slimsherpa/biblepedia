const { initializeSummaries } = require('./initializeSummaries');

console.log('Starting the summary initialization process...');

initializeSummaries()
  .then(() => {
    console.log('Successfully initialized all summaries!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Failed to initialize summaries:', error);
    process.exit(1);
  }); 