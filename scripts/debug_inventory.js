import db from '../src/db/index.js';

console.log('--- CHECKING TABLE SCHEMA ---');
try {
    const info = db.prepare('PRAGMA table_info(inventory)').all();
    console.table(info);
} catch (e) {
    console.error('Failed to get schema:', e.message);
}

console.log('\n--- CHECKING SAMPLE DATA ---');
try {
    const rows = db.prepare('SELECT * FROM inventory LIMIT 5').all();
    console.log(rows);
} catch (e) {
    console.error('Failed to get rows:', e.message);
}

console.log('\n--- TESTING SERVICE METHOD ---');
try {
    // Check for a fake user or try to simulate the call
    const stmt = db.prepare(`
        SELECT * FROM inventory 
        ORDER BY id DESC LIMIT 1
    `);
    const item = stmt.get();
    if (item) {
        console.log('Sample Item raw:', item);
        try {
            if (item.metadata) console.log('Parsed Metadata:', JSON.parse(item.metadata));
        } catch (e) {
            console.error('JSON Parse error on sample:', e.message);
        }
    } else {
        console.log('Inventory is empty.');
    }
} catch (e) {
    console.error('Service query failed:', e.message);
}
