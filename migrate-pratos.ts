import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrando pratos para usar categorias...');

  // Como resetamos o banco, não há pratos antigos
  // Este script serve para referência futura
  
  const categorias = await prisma.categoria.findMany();
  console.log(`\nCategorias disponíveis:`);
  categorias.forEach(cat => {
    console.log(`- ${cat.nome} (ID: ${cat.id})`);
  });

  const pratos = await prisma.prato.findMany();
  console.log(`\nTotal de pratos: ${pratos.length}`);

  if (pratos.length === 0) {
    console.log('\nNenhum prato para migrar.');
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
