import mysql from 'mysql2/promise';

async function checkTables() {
  const conn = await mysql.createConnection('mysql://root:VKmhRIUkLNjOvcroCBVnijvLcWXAHgTM@tramway.proxy.rlwy.net:34588/railway');
  const [rows] = await conn.execute('SHOW TABLES');
  console.log('Tabelas no banco:', rows);
  await conn.end();
}

checkTables().catch(console.error);
