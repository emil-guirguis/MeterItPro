const db = require('./src/config/database');

(async () => {
    try {
        await db.connect();
        const result = await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema = \'public\' AND table_name = \'meter_virtual\' ORDER BY ordinal_position;');
        console.log('\nColumn names:');
        result.rows.forEach(row => {
            console.log(`  "${row.column_name}"`);
        });
        await db.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
