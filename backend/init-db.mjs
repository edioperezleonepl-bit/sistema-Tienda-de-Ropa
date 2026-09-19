import pg from 'pg';

async function init() {
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='fashionstore'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE fashionstore');
      console.log('Database fashionstore created successfully!');
    } else {
      console.log('Database fashionstore already exists.');
    }
    await client.end();
  } catch (err) {
    console.error('Error checking/creating database:', err.message);
  }
}

init();
