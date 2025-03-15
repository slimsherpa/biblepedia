import { initializeSummaries } from './initializeSummaries';

console.log('Starting the summary initialization process...');

initializeSummaries()
  .then(() => {
    console.log('Summary initialization completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during summary initialization:', error);
    process.exit(1);
  }); 