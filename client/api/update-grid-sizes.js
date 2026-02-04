// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   user: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD,
//   host: process.env.POSTGRES_HOST,
//   port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
//   database: process.env.POSTGRES_DB,
// });

// (async () => {
//   try {
//     console.log('Updating dashboard card grid properties to larger defaults...');
//     const result = await pool.query(
//       'UPDATE dashboard SET grid_w = 12, grid_h = 10 WHERE grid_w <= 6 RETURNING dashboard_id, grid_x, grid_y, grid_w, grid_h'
//     );
//     console.log('Updated cards:', result.rows);
//     console.log('✅ Update complete');
//   } catch (error) {
//     console.error('❌ Error:', error.message);
//   } finally {
//     await pool.end();
//   }
// })();
