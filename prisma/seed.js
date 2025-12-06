const { PrismaClient } = require('@prisma/client');
const { PrismaPlanetScale } = require('@prisma/adapter-planetscale');
const { connect } = require('@planetscale/database');
const bcrypt = require('bcryptjs');

const connection = connect({ url: process.env.DATABASE_URL });
const adapter = new PrismaPlanetScale(connection);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuários
  console.log('👤 Criando usuários...');
  const senhaHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@paneladadaana.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@paneladadaana.com',
      senhaHash,
      role: 'admin',
    },
  });

  const garcom = await prisma.user.upsert({
    where: { email: 'garcom@paneladadaana.com' },
    update: {},
    create: {
      nome: 'João Garçom',
      email: 'garcom@paneladadaana.com',
      senhaHash: await bcrypt.hash('garcom123', 10),
      role: 'garcom',
    },
  });

  console.log('✅ Usuários criados!');

  // Criar mesas
  console.log('🪑 Criando mesas...');
  const mesas = [];
  for (let i = 1; i <= 10; i++) {
    const mesa = await prisma.mesa.upsert({
      where: { id: i },
      update: {},
      create: {
        nome: `Mesa ${i}`,
        status: 'livre',
      },
    });
    mesas.push(mesa);
  }
  console.log('✅ Mesas criadas!');

  // Criar pratos
  console.log('🍽️ Criando pratos...');
  
  const pratos = [
    {
      nome: 'Panelada Tradicional',
      descricao: 'Panelada servida com arroz, farofa e vinagrete',
      preco: 45.00,
      categoria: 'Pratos Principais',
      ativo: true,
    },
    {
      nome: 'Feijoada Completa',
      descricao: 'Feijoada com todos os acompanhamentos',
      preco: 42.00,
      categoria: 'Pratos Principais',
      ativo: true,
    },
    {
      nome: 'Moqueca de Peixe',
      descricao: 'Moqueca capixaba servida com pirão',
      preco: 55.00,
      categoria: 'Pratos Principais',
      ativo: true,
    },
    {
      nome: 'Picanha na Chapa',
      descricao: 'Picanha grelhada com fritas e arroz',
      preco: 65.00,
      categoria: 'Pratos Principais',
      ativo: true,
    },
    {
      nome: 'Filé à Parmegiana',
      descricao: 'Filé empanado com molho e queijo',
      preco: 48.00,
      categoria: 'Pratos Principais',
      ativo: true,
    },
    {
      nome: 'Refrigerante Lata',
      descricao: 'Coca-Cola, Guaraná ou Fanta',
      preco: 5.00,
      categoria: 'Bebidas',
      ativo: true,
    },
    {
      nome: 'Refrigerante 2L',
      descricao: 'Coca-Cola, Guaraná ou Fanta',
      preco: 12.00,
      categoria: 'Bebidas',
      ativo: true,
    },
    {
      nome: 'Suco Natural',
      descricao: 'Laranja, limão, maracujá ou abacaxi',
      preco: 8.00,
      categoria: 'Bebidas',
      ativo: true,
    },
    {
      nome: 'Cerveja Heineken',
      descricao: 'Long neck 330ml',
      preco: 10.00,
      categoria: 'Bebidas',
      ativo: true,
    },
    {
      nome: 'Água Mineral',
      descricao: 'Com ou sem gás - 500ml',
      preco: 4.00,
      categoria: 'Bebidas',
      ativo: true,
    },
    {
      nome: 'Pudim',
      descricao: 'Pudim de leite caseiro',
      preco: 12.00,
      categoria: 'Sobremesas',
      ativo: true,
    },
    {
      nome: 'Brigadeiro',
      descricao: 'Brigadeiro gourmet (3 unidades)',
      preco: 8.00,
      categoria: 'Sobremesas',
      ativo: true,
    },
    {
      nome: 'Torta de Limão',
      descricao: 'Fatia de torta de limão',
      preco: 14.00,
      categoria: 'Sobremesas',
      ativo: true,
    },
    {
      nome: 'Sorvete',
      descricao: 'Bola de sorvete (escolha o sabor)',
      preco: 6.00,
      categoria: 'Sobremesas',
      ativo: true,
    },
  ];

  for (const prato of pratos) {
    await prisma.prato.create({
      data: prato,
    });
  }

  console.log('✅ Pratos criados!');

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📝 Credenciais de acesso:');
  console.log('');
  console.log('👨‍💼 Administrador:');
  console.log('   Email: admin@paneladadaana.com');
  console.log('   Senha: admin123');
  console.log('');
  console.log('👨‍🍳 Garçom:');
  console.log('   Email: garcom@paneladadaana.com');
  console.log('   Senha: garcom123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
