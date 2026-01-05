import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando pratos de exemplo...\n');

  const categorias = await prisma.categoria.findMany();
  const categoriasMap = new Map(categorias.map(c => [c.nome, c.id]));

  const pratosExemplo = [
    {
      nome: 'Panelada 15,00',
      descricao: 'Porção de 15,00',
      preco: 15.00,
      categoriaId: categoriasMap.get('Porção')!,
    },
    {
      nome: 'Porção G',
      descricao: 'Porção maior',
      preco: 20.00,
      categoriaId: categoriasMap.get('Porção')!,
    },
    {
      nome: 'Refrigerante Lata',
      descricao: '350ml',
      preco: 5.00,
      categoriaId: categoriasMap.get('Bebida')!,
    },
    {
      nome: 'Cerveja',
      descricao: 'Long neck 330ml',
      preco: 7.00,
      categoriaId: categoriasMap.get('Bebida')!,
    },
    {
      nome: 'Porção Mesa Grande',
      descricao: 'Porção para compartilhar',
      preco: 45.00,
      categoriaId: categoriasMap.get('Porção mesa')!,
    },
  ];

  for (const prato of pratosExemplo) {
    const pratoExistente = await prisma.prato.findFirst({
      where: { nome: prato.nome },
    });

    if (!pratoExistente) {
      await prisma.prato.create({
        data: prato,
      });
      console.log(`✓ Prato "${prato.nome}" criado`);
    } else {
      console.log(`→ Prato "${prato.nome}" já existe`);
    }
  }

  console.log('\nPratos criados com sucesso!');
  
  const totalPratos = await prisma.prato.count();
  console.log(`\nTotal de pratos no banco: ${totalPratos}`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
