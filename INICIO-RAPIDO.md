# 🚀 Guia Rápido de Início - Panelada da Ana

## ⚡ Início Rápido (5 minutos)

### 1. Configure o Banco de Dados

Crie um arquivo `.env` na raiz do projeto:
```bash
DATABASE_URL="mysql://root:suasenha@localhost:3306/panelada_da_ana"
JWT_SECRET="panelada-da-ana-secret-2024"
```

### 2. Configure o Prisma e Popule o Banco

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no banco
npx prisma db push

# Popular com dados de exemplo
npm run db:seed
```

### 3. Inicie o Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 4. Faça Login

**Administrador:**
- Email: `admin@paneladadaana.com`
- Senha: `admin123`

**Garçom:**
- Email: `garcom@paneladadaana.com`
- Senha: `garcom123`

---

## 📋 Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] MySQL rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados criado (`npx prisma db push`)
- [ ] Dados iniciais inseridos (`npm run db:seed`)
- [ ] Servidor iniciado (`npm run dev`)

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm start                # Inicia servidor de produção

# Banco de Dados
npm run db:push          # Aplica schema ao banco
npm run db:studio        # Abre interface visual do banco
npm run db:seed          # Popula banco com dados iniciais
npx prisma migrate dev   # Cria migration

# Qualidade
npm run lint             # Executa linter
```

---

## 🐛 Problemas Comuns

### Erro de conexão com banco de dados
- Verifique se o MySQL está rodando
- Confirme as credenciais no arquivo `.env`
- Certifique-se que o banco `panelada_da_ana` existe

### Erro "Prisma Client não encontrado"
```bash
npx prisma generate
```

### Porta 3000 já em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [número] /F

# Ou mude a porta
# No package.json, altere "dev": "next dev -p 3001"
```

---

## 📱 Testando o Sistema

### Como Garçom:
1. Faça login com credenciais de garçom
2. Selecione uma mesa livre
3. Clique em "Abrir Pedido"
4. Adicione itens ao pedido
5. Finalize escolhendo forma de pagamento

### Como Admin:
1. Faça login com credenciais de admin
2. Explore o dashboard
3. Gerencie mesas, pratos e usuários
4. Visualize pedidos e relatórios

---

## 🌐 Deploy Rápido

### Vercel (Frontend)
```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel
```

### Railway (MySQL)
1. Acesse https://railway.app
2. Crie novo projeto MySQL
3. Copie DATABASE_URL
4. Configure no Vercel como variável de ambiente

---

## 📞 Precisa de Ajuda?

Consulte o `README.md` completo para instruções detalhadas.

---

**Desenvolvido para Panelada da Ana** 🍲
