# Barbearia (frontend)

MVP Next.js alinhado à `API_REFERENCE.md`.

O front roda na **porta 3001** (a API usa a 3000). CORS da API deve incluir `http://localhost:3001`.

## Stack

Next.js 16, TypeScript, Tailwind 4, shadcn/ui, Zod, TanStack Query, Axios.

## Começando

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Rotas

| Rota | Quem |
| --- | --- |
| `/` | Landing |
| `/entrar` e `/cadastro` | Cliente |
| `/login` e `/cadastro-barbearia` | Staff |
| `/cliente` | Catálogo e agendamento |
| `/painel` | Gestão (agenda, serviços, caixa, comissões) |

## Env

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
