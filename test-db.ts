import { prisma } from '@/lib/prisma';

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    const users = await prisma.user.findMany();
    console.log('✅ Conexão bem-sucedida!');
    console.log(`📊 Encontrados ${users.length} usuários:`);
    users.forEach(user => {
      console.log(`  - ${user.nome} (${user.email}) - ${user.role}`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
