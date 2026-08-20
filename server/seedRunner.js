import { seedDatabase } from './seed.js';

console.log('🚀 Running standalone CognoDB seeder in Node.js...');

seedDatabase()
  .then((res) => {
    console.log('🎉 Seeding successfully finished:', res.message);
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Seeding failed:', err);
    process.exit(1);
  });
