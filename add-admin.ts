import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:VKmhRIUkLNjOvcroCBVnijvLcWXAHgTM@tramway.proxy.rlwy.net:34588/railway";

async function addUser() {
  const nome = process.argv[2];
  const senha = process.argv[3];
  const role = process.argv[4] || 'garcom';

  if (!nome || !senha) {
    console.log('❌ Uso: npx tsx add-admin.ts <nome> <senha> [role]');
    console.log('   Roles: admin, garcom');
    process.exit(1);
  }

  console.log(`👤 Criando usuário ${role}...`);

  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
  });

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const email = `${nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')}@panelada.com`;

    await connection.execute(
      `INSERT INTO users (nome, email, senhaHash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE senhaHash = VALUES(senhaHash), role = VALUES(role)`,
      [nome, email, senhaHash, role]
    );

    console.log('✅ Usuário criado com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${senha}`);
    console.log(`👔 Função: ${role}`);
  } finally {
    await connection.end();
  }
}

addUser().catch(console.error);
