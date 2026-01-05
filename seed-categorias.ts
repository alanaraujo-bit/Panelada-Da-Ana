import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando categorias padrão...');

  const categoriasPadrao = [
    { nome: 'Porção', ordem: 1 },
    { nome: 'Bebida', ordem: 2 },
    { nome: 'Porção mesa', ordem: 3 },
    { nome: 'Pratos Principais', ordem: 4 },
    { nome: 'Sobremesas', ordem: 5 },
  ];

  for (const cat of categoriasPadrao) {
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { nome: cat.nome },
    });

    if (!categoriaExistente) {
      await prisma.categoria.create({
        data: cat,
      });
      console.log(`✓ Categoria "${cat.nome}" criada`);
    } else {
      console.log(`→ Categoria "${cat.nome}" já existe`);
    }
  }

  console.log('\nCategorias criadas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
