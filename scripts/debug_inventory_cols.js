import db from '../src/db/index.js';

console.log('--- CHECKING COLUMNS ---');
try {
    const info = db.prepare('PRAGMA table_info(inventory)').all();
    const columns = info.map(c => c.name);
    console.log('Columns found:', columns);

    const hasExpires = columns.includes('expires_at');
    const hasMetadata = columns.includes('metadata');
    const hasCreatedAt = columns.includes('created_at');

    console.log(`expires_at exists: ${hasExpires}`);
    console.log(`metadata exists: ${hasMetadata}`);
    console.log(`created_at exists: ${hasCreatedAt}`);

    if (!hasExpires) {
        console.log('ATTEMPTING MANUAL MIGRATION NOW...');
        db.exec("ALTER TABLE inventory ADD COLUMN expires_at INTEGER");
        console.log('Migration done.');
    }
} catch (e) {
    console.error('Schema check failed:', e.message);
}
