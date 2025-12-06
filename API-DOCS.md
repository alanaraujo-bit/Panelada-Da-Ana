# 📡 Documentação da API - Panelada da Ana

## Autenticação

Todas as requisições (exceto login) precisam do header:
```
Authorization: Bearer {token}
```

---

## 🔐 Autenticação

### POST /api/auth/login
Realiza login no sistema

**Body:**
```json
{
  "email": "admin@paneladadaana.com",
  "senha": "admin123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@paneladadaana.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Verifica autenticação do usuário atual

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@paneladadaana.com",
    "role": "admin"
  }
}
```

---

## 🪑 Mesas

### GET /api/mesas
Lista todas as mesas

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Mesa 1",
    "status": "livre",
    "criadoEm": "2024-01-01T10:00:00.000Z",
    "pedidos": []
  }
]
```

### POST /api/mesas
Cria nova mesa (apenas admin)

**Body:**
```json
{
  "nome": "Mesa 11"
}
```

### PUT /api/mesas/[id]
Atualiza mesa (apenas admin)

**Body:**
```json
{
  "nome": "Mesa 1 - VIP",
  "status": "ocupada"
}
```

### DELETE /api/mesas/[id]
Remove mesa (apenas admin)

---

## 🍽️ Pratos

### GET /api/pratos
Lista todos os pratos

**Query params:**
- `ativos=true` - Lista apenas pratos ativos

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Panelada Tradicional",
    "descricao": "Panelada servida com arroz e farofa",
    "preco": 45.00,
    "categoria": "Pratos Principais",
    "ativo": true,
    "criadoEm": "2024-01-01T10:00:00.000Z"
  }
]
```

### POST /api/pratos
Cria novo prato (apenas admin)

**Body:**
```json
{
  "nome": "Picanha na Chapa",
  "descricao": "Picanha grelhada com fritas",
  "preco": 65.00,
  "categoria": "Pratos Principais",
  "ativo": true
}
```

### PUT /api/pratos/[id]
Atualiza prato (apenas admin)

### DELETE /api/pratos/[id]
Remove prato (apenas admin)

---

## 👥 Usuários

### GET /api/usuarios
Lista todos os usuários (apenas admin)

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@paneladadaana.com",
    "role": "admin",
    "criadoEm": "2024-01-01T10:00:00.000Z"
  }
]
```

### POST /api/usuarios
Cria novo usuário (apenas admin)

**Body:**
```json
{
  "nome": "Maria Garçom",
  "email": "maria@paneladadaana.com",
  "senha": "senha123",
  "role": "garcom"
}
```

### PUT /api/usuarios/[id]
Atualiza usuário (apenas admin)

**Body (senha opcional):**
```json
{
  "nome": "Maria Silva",
  "email": "maria.silva@paneladadaana.com",
  "senha": "novasenha123",
  "role": "garcom"
}
```

### DELETE /api/usuarios/[id]
Remove usuário (apenas admin)

---

## 📝 Pedidos

### GET /api/pedidos
Lista todos os pedidos

**Query params:**
- `status=aberto` - Filtra por status (aberto/fechado)

**Response (200):**
```json
[
  {
    "id": 1,
    "mesaId": 1,
    "garcomId": 2,
    "status": "aberto",
    "total": 58.00,
    "formaPagamento": null,
    "criadoEm": "2024-01-01T12:00:00.000Z",
    "finalizadoEm": null,
    "mesa": {
      "nome": "Mesa 1"
    },
    "garcom": {
      "nome": "João Garçom"
    },
    "itens": [
      {
        "id": 1,
        "quantidade": 1,
        "observacao": "Sem cebola",
        "subtotal": 45.00,
        "prato": {
          "nome": "Panelada Tradicional",
          "preco": 45.00
        }
      }
    ]
  }
]
```

### POST /api/pedidos
Abre novo pedido

**Body:**
```json
{
  "mesaId": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "mesaId": 1,
  "garcomId": 2,
  "status": "aberto",
  "total": 0,
  "formaPagamento": null,
  "criadoEm": "2024-01-01T12:00:00.000Z",
  "mesa": {
    "nome": "Mesa 1"
  },
  "garcom": {
    "nome": "João Garçom"
  },
  "itens": []
}
```

### GET /api/pedidos/[id]
Busca pedido específico

### PUT /api/pedidos/[id]
Atualiza pedido (para finalizar)

**Body:**
```json
{
  "status": "fechado",
  "formaPagamento": "pix"
}
```

---

## 🍴 Itens do Pedido

### POST /api/pedidos/[id]/item
Adiciona item ao pedido

**Body:**
```json
{
  "pratoId": 1,
  "quantidade": 2,
  "observacao": "Sem pimenta"
}
```

**Response (201):**
```json
{
  "id": 1,
  "pedidoId": 1,
  "pratoId": 1,
  "quantidade": 2,
  "observacao": "Sem pimenta",
  "subtotal": 90.00,
  "prato": {
    "id": 1,
    "nome": "Panelada Tradicional",
    "preco": 45.00
  }
}
```

### DELETE /api/pedidos/[id]/item/[itemId]
Remove item do pedido

**Response (200):**
```json
{
  "success": true
}
```

---

## 📊 Relatórios

### GET /api/relatorios
Busca relatórios e estatísticas (apenas admin)

**Query params:**
- `dataInicio` - Data inicial (ISO 8601)
- `dataFim` - Data final (ISO 8601)

**Exemplo:**
```
GET /api/relatorios?dataInicio=2024-01-01T00:00:00.000Z&dataFim=2024-01-31T23:59:59.000Z
```

**Response (200):**
```json
{
  "faturamentoTotal": 1250.50,
  "totalPedidos": 25,
  "faturamentoPorPagamento": {
    "pix": 450.00,
    "dinheiro": 320.50,
    "credito": 280.00,
    "debito": 200.00
  },
  "pratosMaisVendidos": [
    {
      "nome": "Panelada Tradicional",
      "quantidade": 15,
      "total": 675.00
    },
    {
      "nome": "Feijoada Completa",
      "quantidade": 10,
      "total": 420.00
    }
  ]
}
```

---

## 🚫 Códigos de Erro

- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado ou sem permissão)
- `404` - Not Found (recurso não encontrado)
- `500` - Internal Server Error (erro no servidor)

**Formato de erro:**
```json
{
  "error": "Mensagem de erro descritiva"
}
```

---

## 📌 Notas

1. Todas as datas estão em formato ISO 8601
2. Valores monetários são em formato Decimal
3. Tokens JWT expiram em 24 horas
4. Rotas de admin são protegidas por role
5. O campo `observacao` é opcional em todos os lugares

---

**Desenvolvido para Panelada da Ana** 🍲
