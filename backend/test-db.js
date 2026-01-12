const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'trip_planner',
  user: 'trip_admin',
  password: 'trip_password_123'
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL!');
    
    const result = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('✅ Total de usuários:', result.rows[0].total);
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    process.exit(1);
  }
}

test();
