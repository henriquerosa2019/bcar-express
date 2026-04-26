# BCAR Express

Plataforma B2B de e-commerce para autopeças — conectando mecânicos, lojas e entregadores.

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui (Radix)
- **Backend**: Supabase (Auth + PostgreSQL + Realtime)
- **Deploy**: Vercel

---

## 🚀 Setup — passo a passo

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/bcar-express.git
cd bcar-express
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase/migration.sql` completo
3. No painel, vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_MAPS_API_KEY=AIza...   # opcional, para rastreamento GPS
```

### 4. Rode localmente

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📦 Deploy no Vercel

### Opção A — Via GitHub (recomendado)

1. Suba o projeto no GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit — BCAR Express"
   git remote add origin https://github.com/seu-usuario/bcar-express.git
   git push -u origin main
   ```

2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório

3. Em **Environment Variables**, adicione:
   | Nome | Valor |
   |------|-------|
   | `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
   | `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase |

4. Clique em **Deploy** ✅

### Opção B — Via Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## 👤 Perfis de usuário

| Perfil | Acesso |
|--------|--------|
| **Mecânico** | Busca peças, faz pedidos, gerencia clientes, orçamentos, agenda e financeiro |
| **Loja** | Gerencia pedidos, catálogo de peças, entregadores e métricas |
| **Entregador** | Visualiza e confirma suas entregas com GPS |

Ao criar conta, o usuário escolhe seu perfil. Cada perfil vê apenas seu próprio painel.

---

## 🗄️ Banco de dados (15 tabelas)

```
profiles · user_roles · parts · orders · order_items
deliveries · delivery_locations · customers · customer_services
quotes · quote_items · service_appointments · service_finances
search_history · vehicles
```

Todas as tabelas possuem **Row Level Security (RLS)** ativado.

---

## 🔄 Funcionalidades em tempo real (Supabase Realtime)

- Status dos pedidos atualiza automaticamente para o mecânico
- Novos pedidos aparecem instantaneamente no painel da loja
- Localização GPS do entregador

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── layout/      # Sidebar, AppLayout, PageHeader
│   └── ui/          # Button, Card, Badge, Dialog, etc.
├── hooks/
│   ├── useAuth.tsx  # Contexto de autenticação
│   └── useCart.ts   # Estado do carrinho
├── lib/
│   ├── supabase.ts  # Cliente Supabase
│   └── utils.ts     # Helpers (formatCurrency, formatDate...)
├── pages/
│   ├── mechanic/    # 7 páginas do mecânico
│   ├── store/       # 5 páginas da loja
│   ├── delivery/    # Página do entregador
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── SettingsPage.tsx
├── types/
│   └── database.ts  # TypeScript types completos
└── App.tsx          # Rotas
```

---

## 🛠️ Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 📝 Licença

MIT
