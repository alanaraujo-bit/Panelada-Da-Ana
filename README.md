# 🍲 Panelada da Ana - Sistema de Gestão de Restaurante

Sistema completo de gerenciamento de pedidos para restaurante desenvolvido com Next.js 15, TypeScript, Prisma e MySQL.

## 🎨 Identidade Visual

O sistema utiliza a paleta de cores do restaurante:
- **Laranja Queimado**: `#A44F1C` - Cor principal
- **Marrom Escuro**: `#6A3A1A` - Textos e destaques
- **Creme/Bege**: `#F3E4CE` - Background
- **Branco**: `#FFFFFF` - Cards e contraste

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS** - Estilização
- **Shadcn UI** - Componentes
- **Zustand** - Gerenciamento de estado
- **React Hook Form + Zod** - Validação de formulários
- **Lucide React** - Ícones

### Backend
- **Next.js API Routes**
- **Prisma ORM** - Comunicação com banco de dados
- **JWT** - Autenticação
- **bcrypt** - Criptografia de senhas

### Banco de Dados
- **MySQL** (via Railway ou local)

## 📋 Funcionalidades

### Perfil GARÇOM
- ✅ Login seguro com JWT
- ✅ Visualização de mesas (livres/ocupadas)
- ✅ Abertura de pedidos
- ✅ Adição de itens ao pedido
- ✅ Edição de quantidades e observações
- ✅ Finalização de pedidos com múltiplas formas de pagamento
- ✅ Interface mobile-first otimizada

### Perfil ADMINISTRADOR
- ✅ Dashboard com métricas em tempo real
  - Faturamento diário
  - Total de pedidos
  - Ticket médio
  - Pratos mais vendidos
  - Faturamento por forma de pagamento
- ✅ CRUD completo de Usuários
- ✅ CRUD completo de Pratos
- ✅ CRUD completo de Mesas
- ✅ Visualização de pedidos (em andamento e finalizados)
- ✅ Relatórios por período

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ instalado
- MySQL 8+ (local ou Railway)
- npm ou yarn

### Passo 1: Clonar o Repositório
```bash
cd "c:\\Users\\Alan\\Documents\\Panelada Da Ana"
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:
```bash
copy .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="mysql://usuario:senha@host:3306/panelada_da_ana"
JWT_SECRET="seu-secret-super-secreto-aqui-mude-em-producao"
```

#### Opção 1: MySQL Local
```env
DATABASE_URL="mysql://root:suasenha@localhost:3306/panelada_da_ana"
```

#### Opção 2: Railway (Recomendado para produção)
1. Acesse [Railway.app](https://railway.app/)
2. Crie um novo projeto MySQL
3. Copie a connection string fornecida
4. Cole no `.env`

### Passo 4: Configurar o Banco de Dados

Gerar o cliente Prisma:
```bash
npx prisma generate
```

Criar as tabelas no banco:
```bash
npx prisma db push
```

### Passo 5: Criar Usuário Administrador Inicial

Execute o script SQL no seu banco MySQL:

```sql
-- Senha: admin123 (hasheada com bcrypt)
INSERT INTO users (nome, email, senhaHash, role, criadoEm) 
VALUES (
  'Administrador', 
  'admin@paneladadaana.com', 
  '$2a$10$rOZJKKj8GN5h8F4WQx6wAe3B.VHJ7YVQXqZKZmZJvGXn9kFyX8Zvu',
  'admin',
  NOW()
);

-- Criar usuário garçom de teste
-- Senha: garcom123
INSERT INTO users (nome, email, senhaHash, role, criadoEm) 
VALUES (
  'João Garçom', 
  'garcom@paneladadaana.com', 
  '$2a$10$rOZJKKj8GN5h8F4WQx6wAe3B.VHJ7YVQXqZKZmZJvGXn9kFyX8Zvu',
  'garcom',
  NOW()
);
```

Ou use o Prisma Studio para criar os usuários:
```bash
npx prisma studio
```

### Passo 6: Popular Dados de Exemplo (Opcional)

```sql
-- Criar mesas
INSERT INTO mesas (nome, status, criadoEm) VALUES
('Mesa 1', 'livre', NOW()),
('Mesa 2', 'livre', NOW()),
('Mesa 3', 'livre', NOW()),
('Mesa 4', 'livre', NOW());

-- Criar pratos
INSERT INTO pratos (nome, descricao, preco, categoria, ativo, criadoEm) VALUES
('Panelada Tradicional', 'Panelada servida com arroz e farofa', 45.00, 'Pratos Principais', true, NOW()),
('Feijoada Completa', 'Feijoada com acompanhamentos', 42.00, 'Pratos Principais', true, NOW()),
('Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta', 5.00, 'Bebidas', true, NOW()),
('Suco Natural', 'Laranja, limão ou maracujá', 8.00, 'Bebidas', true, NOW()),
('Pudim', 'Pudim de leite caseiro', 12.00, 'Sobremesas', true, NOW());
```

### Passo 7: Executar o Projeto

Modo desenvolvimento:
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🔐 Credenciais de Acesso

### Administrador
- **Email**: admin@paneladadaana.com
- **Senha**: admin123

### Garçom
- **Email**: garcom@paneladadaana.com
- **Senha**: garcom123

## 📱 Estrutura de Rotas

### Públicas
- `/` - Redireciona para login
- `/login` - Página de login

### Garçom
- `/garcom/mesas` - Lista de mesas
- `/garcom/mesa/[id]` - Gerenciar pedido da mesa
- `/garcom/checkout` - Finalizar pedido

### Administrador
- `/admin/dashboard` - Dashboard principal
- `/admin/mesas` - Gerenciar mesas
- `/admin/pratos` - Gerenciar pratos
- `/admin/usuarios` - Gerenciar usuários
- `/admin/pedidos` - Visualizar pedidos

### APIs
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Verificar autenticação
- `GET/POST /api/mesas` - Gerenciar mesas
- `GET/POST /api/pratos` - Gerenciar pratos
- `GET/POST /api/usuarios` - Gerenciar usuários
- `GET/POST /api/pedidos` - Gerenciar pedidos
- `GET /api/relatorios` - Relatórios

## 🗂️ Estrutura de Pastas

```
panelada-da-ana/
├── app/
│   ├── api/                  # API Routes
│   │   ├── auth/            # Autenticação
│   │   ├── mesas/           # Endpoints de mesas
│   │   ├── pratos/          # Endpoints de pratos
│   │   ├── usuarios/        # Endpoints de usuários
│   │   ├── pedidos/         # Endpoints de pedidos
│   │   └── relatorios/      # Endpoints de relatórios
│   ├── login/               # Página de login
│   ├── garcom/              # Páginas do garçom
│   │   ├── mesas/
│   │   ├── mesa/[id]/
│   │   └── checkout/
│   ├── admin/               # Páginas do admin
│   │   ├── dashboard/
│   │   ├── mesas/
│   │   ├── pratos/
│   │   ├── usuarios/
│   │   └── pedidos/
│   ├── globals.css          # Estilos globais
│   └── layout.tsx           # Layout principal
├── components/
│   └── ui/                  # Componentes Shadcn UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── lib/
│   ├── auth.ts              # Funções de autenticação
│   ├── prisma.ts            # Cliente Prisma
│   ├── store.ts             # Zustand store
│   └── utils.ts             # Funções utilitárias
├── prisma/
│   └── schema.prisma        # Schema do banco de dados
├── public/
│   └── manifest.json        # Manifesto PWA
├── middleware.ts            # Middleware de rotas
├── tailwind.config.ts       # Configuração Tailwind
├── .env                     # Variáveis de ambiente
└── package.json             # Dependências
```

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT com expiração de 24h
- ✅ Middleware de proteção de rotas
- ✅ Validação de dados com Zod
- ✅ Separação de permissões por role

## 📊 Banco de Dados

O sistema utiliza 5 tabelas principais:

### users
- Usuários do sistema (admin e garçom)

### mesas
- Mesas do restaurante

### pratos
- Cardápio do restaurante

### pedidos
- Pedidos realizados

### pedido_itens
- Itens de cada pedido

## 🚀 Deploy

### Vercel (Frontend)
1. Crie conta na [Vercel](https://vercel.com)
2. Conecte seu repositório Git
3. Configure as variáveis de ambiente
4. Deploy automático!

### Railway (MySQL)
1. Crie conta na [Railway](https://railway.app)
2. Crie novo projeto MySQL
3. Copie a connection string
4. Use no `.env` do projeto

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint

# Prisma Studio (interface visual do banco)
npx prisma studio

# Gerar tipos do Prisma
npx prisma generate

# Aplicar schema ao banco
npx prisma db push

# Criar migration
npx prisma migrate dev
```

## 📱 PWA (Progressive Web App)

O sistema está configurado como PWA, permitindo:
- ✅ Instalação no celular como app
- ✅ Funcionamento offline parcial
- ✅ Ícone na tela inicial
- ✅ Experiência nativa mobile

## 🎯 Próximas Melhorias

- [ ] Impressão de comandas
- [ ] Notificações em tempo real (WebSocket)
- [ ] Modo escuro
- [ ] Relatórios mais avançados
- [ ] Gestão de estoque
- [ ] Integração com impressora térmica

## 📞 Suporte

Para dúvidas e suporte, entre em contato com o desenvolvedor.

## 📄 Licença

Este projeto é privado e desenvolvido exclusivamente para o restaurante Panelada da Ana.

---

Desenvolvido com ❤️ para Panelada da Ana
