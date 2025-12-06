# 📁 Estrutura do Projeto - Panelada da Ana

## Visão Geral da Arquitetura

```
Panelada Da Ana/
│
├── 📂 app/                          # Next.js App Router
│   ├── 📂 api/                      # API Routes (Backend)
│   │   ├── 📂 auth/
│   │   │   ├── login/route.ts       # POST - Login
│   │   │   └── me/route.ts          # GET - Verificar autenticação
│   │   ├── 📂 mesas/
│   │   │   ├── route.ts             # GET/POST - Listar/Criar mesas
│   │   │   └── [id]/route.ts        # PUT/DELETE - Atualizar/Remover mesa
│   │   ├── 📂 pratos/
│   │   │   ├── route.ts             # GET/POST - Listar/Criar pratos
│   │   │   └── [id]/route.ts        # PUT/DELETE - Atualizar/Remover prato
│   │   ├── 📂 usuarios/
│   │   │   ├── route.ts             # GET/POST - Listar/Criar usuários
│   │   │   └── [id]/route.ts        # PUT/DELETE - Atualizar/Remover usuário
│   │   ├── 📂 pedidos/
│   │   │   ├── route.ts             # GET/POST - Listar/Criar pedidos
│   │   │   ├── [id]/route.ts        # GET/PUT - Buscar/Atualizar pedido
│   │   │   └── [id]/item/
│   │   │       ├── route.ts         # POST - Adicionar item
│   │   │       └── [itemId]/route.ts # DELETE - Remover item
│   │   └── 📂 relatorios/
│   │       └── route.ts             # GET - Relatórios
│   │
│   ├── 📂 login/                    # Página de Login
│   │   └── page.tsx
│   │
│   ├── 📂 garcom/                   # Área do Garçom
│   │   ├── 📂 mesas/
│   │   │   └── page.tsx             # Lista de mesas
│   │   ├── 📂 mesa/[id]/
│   │   │   └── page.tsx             # Gerenciar pedido
│   │   └── 📂 checkout/
│   │       └── page.tsx             # Finalizar pedido
│   │
│   ├── 📂 admin/                    # Área do Administrador
│   │   ├── 📂 dashboard/
│   │   │   └── page.tsx             # Dashboard principal
│   │   ├── 📂 mesas/
│   │   │   └── page.tsx             # Gerenciar mesas
│   │   ├── 📂 pratos/
│   │   │   └── page.tsx             # Gerenciar pratos
│   │   ├── 📂 usuarios/
│   │   │   └── page.tsx             # Gerenciar usuários
│   │   └── 📂 pedidos/
│   │       └── page.tsx             # Visualizar pedidos
│   │
│   ├── layout.tsx                   # Layout raiz (metadata, fonts)
│   ├── page.tsx                     # Rota raiz (redireciona para login)
│   └── globals.css                  # Estilos globais + Tailwind
│
├── 📂 components/                   # Componentes Reutilizáveis
│   └── 📂 ui/                       # Componentes Shadcn UI
│       ├── button.tsx               # Botão
│       ├── card.tsx                 # Card
│       ├── input.tsx                # Input
│       └── label.tsx                # Label
│
├── 📂 lib/                          # Bibliotecas e Utilitários
│   ├── auth.ts                      # JWT, bcrypt, autenticação
│   ├── prisma.ts                    # Cliente Prisma singleton
│   ├── store.ts                     # Zustand store (auth state)
│   └── utils.ts                     # Funções utilitárias (cn, format)
│
├── 📂 prisma/                       # Prisma ORM
│   ├── schema.prisma                # Schema do banco (models)
│   └── seed.js                      # Script de seed (dados iniciais)
│
├── 📂 public/                       # Arquivos estáticos
│   └── manifest.json                # Manifesto PWA
│
├── middleware.ts                    # Middleware Next.js (proteção rotas)
├── tailwind.config.ts               # Configuração Tailwind
├── next.config.ts                   # Configuração Next.js
├── tsconfig.json                    # Configuração TypeScript
├── package.json                     # Dependências e scripts
├── .env                             # Variáveis de ambiente
├── .env.example                     # Exemplo de variáveis
├── .gitignore                       # Arquivos ignorados pelo Git
│
├── README.md                        # Documentação principal
├── INICIO-RAPIDO.md                 # Guia rápido de setup
└── API-DOCS.md                      # Documentação da API
```

---

## 🏗️ Arquitetura de Componentes

### Frontend (App Router)
```
Pages (RSC)
    ↓
Client Components ('use client')
    ↓
UI Components (Shadcn)
    ↓
Zustand Store (Estado Global)
```

### Backend (API Routes)
```
API Route Handler
    ↓
Authentication Middleware
    ↓
Zod Validation
    ↓
Prisma Client
    ↓
MySQL Database
```

---

## 🔄 Fluxo de Dados

### Login
```
LoginPage → POST /api/auth/login → Valida credenciais → 
Gera JWT → Salva no Zustand + Cookie → Redireciona por role
```

### Criação de Pedido (Garçom)
```
MesasPage → Seleciona mesa → POST /api/pedidos → 
Atualiza status mesa → Abre MesaPage → 
Adiciona itens → POST /api/pedidos/[id]/item → 
Recalcula total → Checkout → PUT /api/pedidos/[id] → 
Libera mesa
```

### Dashboard (Admin)
```
DashboardPage → GET /api/relatorios → 
Agrega dados de pedidos → Renderiza estatísticas
```

---

## 🗄️ Modelos do Banco de Dados

### User (users)
```typescript
{
  id: number
  nome: string
  email: string (unique)
  senhaHash: string
  role: 'admin' | 'garcom'
  criadoEm: DateTime
}
```

### Mesa (mesas)
```typescript
{
  id: number
  nome: string
  status: 'livre' | 'ocupada'
  criadoEm: DateTime
}
```

### Prato (pratos)
```typescript
{
  id: number
  nome: string
  descricao?: string
  preco: Decimal
  categoria: string
  ativo: boolean
  criadoEm: DateTime
}
```

### Pedido (pedidos)
```typescript
{
  id: number
  mesaId: number
  garcomId: number
  status: 'aberto' | 'fechado'
  total: Decimal
  formaPagamento?: string
  criadoEm: DateTime
  finalizadoEm?: DateTime
}
```

### PedidoItem (pedido_itens)
```typescript
{
  id: number
  pedidoId: number
  pratoId: number
  quantidade: number
  observacao?: string
  subtotal: Decimal
}
```

---

## 🔒 Sistema de Autenticação

### Fluxo JWT
```
1. Login → Valida senha (bcrypt)
2. Gera token JWT (payload: userId, email, role)
3. Token expira em 24h
4. Token salvo no cookie + Zustand
5. Middleware verifica token em rotas protegidas
6. API valida token via header Authorization
```

### Proteção de Rotas
```typescript
// middleware.ts
if (!token) → Redireciona para /login
if (isAdmin && role !== 'admin') → Redireciona
if (isGarcom && role !== 'garcom') → Redireciona
```

---

## 🎨 Sistema de Design

### Paleta de Cores
```typescript
primary-orange: #A44F1C    // Botões, destaques
primary-brown: #6A3A1A     // Textos importantes
primary-cream: #F3E4CE     // Background
white: #FFFFFF             // Cards, contraste
```

### Componentes Base
- `Button` - 5 variantes (default, outline, secondary, ghost, destructive)
- `Card` - Containers estruturais
- `Input` - Campos de formulário
- `Label` - Labels de formulário

### Responsividade
```css
Mobile First
  ↓
Breakpoints Tailwind:
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
  2xl: 1536px
```

---

## 📦 Dependências Principais

### Produção
```json
{
  "next": "16.0.7",           // Framework
  "react": "19.2.0",          // UI Library
  "@prisma/client": "^7.1.0", // ORM Client
  "zustand": "^5.0.3",        // State Management
  "jsonwebtoken": "^9.0.3",   // JWT
  "bcryptjs": "^3.0.3",       // Hash passwords
  "zod": "^4.0.0",            // Validação
  "lucide-react": "^0.556.0"  // Ícones
}
```

### Desenvolvimento
```json
{
  "typescript": "^5",
  "tailwindcss": "^4.1.0",
  "prisma": "^7.1.0",
  "eslint": "^9"
}
```

---

## 🚀 Scripts do Projeto

```json
{
  "dev": "next dev",              // Desenvolvimento (porta 3000)
  "build": "next build",          // Build produção
  "start": "next start",          // Inicia produção
  "lint": "eslint",               // Linter
  "db:push": "prisma db push",    // Aplica schema
  "db:studio": "prisma studio",   // GUI banco
  "db:seed": "node prisma/seed.js" // Popula banco
}
```

---

## 🔐 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="mysql://user:pass@host:3306/database"

# Autenticação
JWT_SECRET="secret-key-here"
```

---

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (`LoginPage`, `Button`)
- **Funções**: camelCase (`handleSubmit`, `fetchPedidos`)
- **Constantes**: UPPER_CASE (`JWT_SECRET`)
- **Arquivos**: kebab-case para rotas, PascalCase para componentes

### Estrutura de Arquivos
- Cada rota é uma pasta com `page.tsx`
- Layouts compartilhados em `layout.tsx`
- Componentes reutilizáveis em `/components`
- Lógica de negócio em `/lib`

### TypeScript
- Sempre tipar props de componentes
- Usar interfaces para objetos complexos
- Evitar `any`, preferir `unknown`

---

## 🧪 Testes (Futuros)

Estrutura sugerida:
```
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   └── components/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       ├── garcom.spec.ts
│       └── admin.spec.ts
```

---

**Desenvolvido para Panelada da Ana** 🍲
