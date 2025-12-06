import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:VKmhRIUkLNjOvcroCBVnijvLcWXAHgTM@tramway.proxy.rlwy.net:34588/railway";

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Parsear a connection string
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
  });

  try {
    // Criar usuários
    console.log('👤 Criando usuários...');
    const senhaHashAdmin = await bcrypt.hash('admin123', 10);
    const senhaHashGarcom = await bcrypt.hash('garcom123', 10);

    await connection.execute(
      `INSERT INTO users (nome, email, senhaHash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = VALUES(nome)`,
      ['Administrador', 'admin@paneladadaana.com', senhaHashAdmin, 'admin']
    );

    await connection.execute(
      `INSERT INTO users (nome, email, senhaHash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = VALUES(nome)`,
      ['João Garçom', 'garcom@paneladadaana.com', senhaHashGarcom, 'garcom']
    );

    console.log('✅ Usuários criados!');

    // Criar mesas
    console.log('🪑 Criando mesas...');
    for (let i = 1; i <= 10; i++) {
      await connection.execute(
        `INSERT INTO mesas (id, nome, status) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nome = VALUES(nome), status = VALUES(status)`,
        [i, `Mesa ${i}`, 'livre']
      );
    }
    console.log('✅ Mesas criadas!');

    // Criar pratos
    console.log('🍽️ Criando pratos...');
    const pratos = [
      ['Panelada Tradicional', 'Panelada servida com arroz, farofa e vinagrete', 45.00, 'Pratos Principais', true],
      ['Feijoada Completa', 'Feijoada com todos os acompanhamentos', 42.00, 'Pratos Principais', true],
      ['Moqueca de Peixe', 'Moqueca capixaba servida com pirão', 55.00, 'Pratos Principais', true],
      ['Picanha na Chapa', 'Picanha grelhada com fritas e arroz', 65.00, 'Pratos Principais', true],
      ['Filé à Parmegiana', 'Filé empanado com molho e queijo', 48.00, 'Pratos Principais', true],
      ['Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta', 5.00, 'Bebidas', true],
      ['Refrigerante 2L', 'Coca-Cola, Guaraná ou Fanta 2 litros', 12.00, 'Bebidas', true],
      ['Suco Natural', 'Laranja, limão ou maracujá', 8.00, 'Bebidas', true],
      ['Cerveja Lata', 'Cerveja gelada lata 350ml', 6.00, 'Bebidas', true],
      ['Cerveja Long Neck', 'Cerveja gelada long neck', 7.00, 'Bebidas', true],
      ['Água Mineral', 'Água mineral sem gás', 4.00, 'Bebidas', true],
      ['Pudim', 'Pudim de leite caseiro', 12.00, 'Sobremesas', true],
      ['Mousse de Maracujá', 'Mousse cremoso de maracujá', 10.00, 'Sobremesas', true],
      ['Sorvete', '2 bolas de sorvete', 8.00, 'Sobremesas', true],
    ];

    for (const prato of pratos) {
      await connection.execute(
        `INSERT INTO pratos (nome, descricao, preco, categoria, ativo) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           descricao = VALUES(descricao), 
           preco = VALUES(preco), 
           categoria = VALUES(categoria), 
           ativo = VALUES(ativo)`,
        prato
      );
    }

    console.log('✅ Pratos criados!');
    console.log('✨ Seed concluído com sucesso!');
  } finally {
    await connection.end();
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  });
