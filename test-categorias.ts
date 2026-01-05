import { prisma } from './lib/prisma';

async function testCategorias() {
  try {
    console.log('Testando conexão com categorias...');
    const categorias = await prisma.categoria.findMany({
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' }
      ],
      include: {
        _count: {
          select: { pratos: true }
        }
      }
    });

    console.log('Categorias encontradas:', categorias.length);
    console.log(JSON.stringify(categorias, null, 2));
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategorias();
