# API Reference — Sistema de Gestão de Barbearia

Documentação de referência para o desenvolvimento do frontend (Next.js). Cobre todos os endpoints implementados até agora, organizados por módulo, com exemplos de request/response reais (testados nesta sessão).

## Convenções gerais

- **Base URL (dev)**: `http://localhost:3000`
- **Content-Type**: `application/json` em todo POST/PATCH
- **⚠️ Porta**: a API já usa a porta `3000`. Rode o Next.js em outra porta (ex: `3001`) — `npm run dev -- -p 3001`.
- **CORS**: liberado via env `CORS_ORIGIN` no backend (default `http://localhost:3001`). Se o front rodar em outra porta, ajuste o `.env` da API.
- **Autenticação**: `Authorization: Bearer <token>`. Existem **dois tipos de token, incompatíveis entre si**:
  - Token **staff** (dono/funcionário da barbearia) — obtido em `POST /auth/login`. Payload interno tem `type: "user"` e `companyIds` (lista de empresas que esse usuário administra).
  - Token **cliente final** — obtido em `POST /clients/login`. Payload interno tem `type: "client"`, sem `companyIds` (cliente pode agendar em qualquer barbearia).
  - Rotas administrativas (`/companies/:companyId/...`) exigem token staff **e** que a empresa esteja em `companyIds` do token — senão `403`.
  - Rotas `/clients/me/...` exigem token cliente.
  - Algumas rotas de catálogo (profissionais/serviços) aceitam **qualquer um dos dois tipos**, pois cliente precisa navegar nelas para agendar.
- **Erros**: sempre `{ "message": "..." }` + status HTTP apropriado (`400` validação/regra de negócio, `401` sem token/token inválido, `403` sem permissão, `404` não encontrado, `409` conflito).
- **Datas/horas**: timestamps em ISO 8601 UTC (`"2026-09-07T09:00:00.000Z"`). Filtros de período usam apenas data (`"2026-09-07"`).
- **Valores monetários**: o Postgres/Prisma serializa `Decimal` como **string** no JSON (ex: `"50.00"`, não `50`). Faça `Number(valor)` no front antes de somar/formatar.
- **IDs**: strings tipo `cuid` (ex: `"cmthhj3br00009715yytu7f1g"`).

---

## Módulo 0 — Autenticação Staff (dono/funcionário)

### `POST /auth/login`
Sem autenticação prévia.

**Body**
```json
{ "email": "admin@alfa.com", "password": "123456" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cmthhj3fz00029715z4dy6eqd",
    "name": "Admin Alfa",
    "email": "admin@alfa.com",
    "companies": [
      { "id": "cmthhj3br00009715yytu7f1g", "name": "Barbearia Alfa", "cnpj": "11111111000111" }
    ]
  }
}
```
`401` se credenciais inválidas.

Guarde `token` e a lista `companies` — o front precisa deixar o usuário escolher em qual empresa está operando (esse `companyId` vira parte da URL em quase todas as chamadas seguintes).

---

## Módulo 0b — Autenticação Cliente final

### `POST /clients/register`
Sem autenticação. Cadastro público (o cliente se cadastra sozinho, não precisa de convite de nenhuma barbearia).

**Body**
```json
{
  "name": "Maria Cliente",
  "email": "maria@cliente.com",
  "password": "123456",
  "cpf": "12345678901",
  "phone": "11988887777"
}
```
`name`, `email`, `password` (mín. 6 chars) obrigatórios. `cpf` (11 dígitos) e `phone` opcionais.

**Response 201**
```json
{
  "id": "cmthhwi8f0003p715gllio0mx",
  "name": "Maria Cliente",
  "email": "maria@cliente.com",
  "phone": null,
  "cpf": null,
  "createdAt": "2026-08-31T17:11:32.943Z"
}
```
`409` se email ou CPF já cadastrado.

### `POST /clients/login`
**Body**
```json
{ "email": "maria@cliente.com", "password": "123456" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "client": { "id": "cmthhwi8f0003p715gllio0mx", "name": "Maria Cliente", "email": "maria@cliente.com" }
}
```
`401` se credenciais inválidas.

---

## Módulo 1 — Empresas (Company)

Cada barbearia é uma `Company`. É a raiz do multi-tenant: quase toda URL abaixo é `/companies/:companyId/...`.

### `POST /companies` — sem autenticação (bootstrap de uma nova barbearia no SaaS)
```json
{ "name": "Barbearia Alfa", "cnpj": "11111111000111" }
```
`cnpj` precisa ser 14 dígitos, sem máscara. `409` se CNPJ já existe.

**Response 201**
```json
{
  "id": "cmthhj3br00009715yytu7f1g",
  "name": "Barbearia Alfa",
  "cnpj": "11111111000111",
  "active": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /companies` — staff ou cliente
- Staff: retorna **só as empresas que ele administra**.
- Cliente: retorna **todas** as empresas ativas do sistema (é o catálogo de barbearias pra ele escolher onde agendar).

### `GET /companies/:id` — staff (só a sua) ou cliente (qualquer uma). `404` se staff tentar acessar empresa de outro tenant.

### `PATCH /companies/:id` — staff, só a sua própria empresa
```json
{ "name": "Novo Nome", "active": false }
```

### `DELETE /companies/:id` — staff, só a sua própria empresa. `204` sem corpo.

### `GET /companies/:companyId/settings` — staff, membro da empresa
**Response 200**
```json
{ "companyId": "...", "cancellationMinNoticeMinutes": 0 }
```
(retorna esse default mesmo sem nenhuma configuração salva ainda)

### `PATCH /companies/:companyId/settings` — staff, membro da empresa
```json
{ "cancellationMinNoticeMinutes": 120 }
```
Define a antecedência mínima (em minutos) que o cliente precisa respeitar pra cancelar um agendamento sozinho.

---

## Módulo 2 — Usuários administrativos (User = login de staff)

⚠️ **Limitação conhecida**: `GET /users` e `GET /users/:id` hoje **não são filtrados por empresa** — qualquer staff autenticado vê todos os usuários do sistema. Ainda não corrigido (avise se quiser que eu resolva antes de usar isso no front).

### `POST /users` — sem autenticação (mesmo motivo do bootstrap de empresa)
```json
{
  "name": "Admin Alfa",
  "email": "admin@alfa.com",
  "password": "123456",
  "companyIds": ["cmthhj3br00009715yytu7f1g"]
}
```
`companyIds`: lista de empresas que esse login vai poder administrar (um usuário pode gerenciar mais de uma barbearia).

**Response 201**
```json
{
  "id": "cmthhj3fz00029715z4dy6eqd",
  "name": "Admin Alfa",
  "email": "admin@alfa.com",
  "active": true,
  "createdAt": "...",
  "updatedAt": "...",
  "companies": [{ "id": "...", "name": "Barbearia Alfa", "cnpj": "11111111000111" }]
}
```

### `GET /users` · `GET /users/:id` · `PATCH /users/:id` · `DELETE /users/:id` — staff autenticado
`PATCH` body (todos campos opcionais): `{ "name", "email", "password", "active", "companyIds" }`.

---

## Módulo 3 — Profissionais (barbeiros)

Um profissional é uma pessoa **global** (identificada por CPF) que pode trabalhar em mais de uma barbearia. Cadastrar com um CPF já existente **vincula** à pessoa existente em vez de duplicar.

### `POST /companies/:companyId/professionals` — staff, membro da empresa
```json
{
  "name": "Carlos Barbeiro",
  "cpf": "98765432100",
  "phone": "11999999999",
  "email": "carlos@example.com",
  "serviceIds": ["cmthhk78c00089715oawvg2dk"]
}
```
`name`, `cpf` (11 dígitos) obrigatórios. `serviceIds`: quais serviços (já cadastrados nessa empresa) esse profissional realiza — pode omitir e configurar depois.

**Response 201**
```json
{
  "id": "cmthhw4sr0000p71519772ihv",
  "name": "Carlos Barbeiro",
  "cpf": "98765432100",
  "phone": null,
  "email": null,
  "createdAt": "...",
  "updatedAt": "...",
  "active": true,
  "services": [{ "id": "cmthhk78c00089715oawvg2dk", "name": "Corte Masculino" }]
}
```
`active` aqui é **relativo a essa empresa** (vínculo ativo/inativo), não uma flag global da pessoa.

### `GET /companies/:companyId/professionals` · `GET /companies/:companyId/professionals/:id`
**Aceita token staff OU cliente** (é catálogo público pra quem vai agendar). Mesmo formato de resposta acima (lista ou item único).

### `PATCH /companies/:companyId/professionals/:id` — staff
```json
{ "name": "Carlos Silva", "phone": "11888887777", "serviceIds": ["idServico1", "idServico2"] }
```
Reenviar `serviceIds` **substitui** a lista de serviços daquele profissional **nessa empresa** (não mexe nos vínculos dele em outras empresas).

### `DELETE /companies/:companyId/professionals/:id` — staff. `204`. Não apaga a pessoa — só desativa o vínculo com essa empresa (soft delete), preservando histórico.

---

## Módulo 4 — Clientes (visão da barbearia)

Assim como profissional, `Client` é global por CPF (quando informado) — mesma pessoa pode ser cliente de várias barbearias sem duplicar cadastro.

### `POST /companies/:companyId/clients` — staff (cadastro manual, ex: cliente que não usa o app)
```json
{ "name": "Cliente Balcão", "phone": "11988887777", "cpf": "11111111111", "email": "x@x.com" }
```
Só `name` é obrigatório.

### `GET /companies/:companyId/clients` · `GET /companies/:companyId/clients/:id` — staff apenas (dado sensível, não é catálogo público)

### `PATCH /companies/:companyId/clients/:id` — staff. Body: `{ name?, phone?, email? }`

### `DELETE /companies/:companyId/clients/:id` — staff. `204`. Soft delete do vínculo com a empresa.

---

## Módulo 5 — Serviços

Serviço pertence a **uma única empresa** (preço/duração são específicos daquela barbearia).

### `POST /companies/:companyId/services` — staff
```json
{ "name": "Corte Masculino", "description": "Corte na tesoura ou máquina", "price": 50, "durationMinutes": 30 }
```

**Response 201**
```json
{
  "id": "cmthhk78c00089715oawvg2dk",
  "companyId": "cmthhj3br00009715yytu7f1g",
  "name": "Corte Masculino",
  "description": null,
  "price": "50",
  "durationMinutes": 30,
  "active": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /companies/:companyId/services` · `GET /companies/:companyId/services/:id`
**Aceita staff OU cliente** (catálogo público).

### `PATCH /companies/:companyId/services/:id` — staff. Body: `{ name?, description?, price?, durationMinutes?, active? }`

### `DELETE /companies/:companyId/services/:id` — staff. `204`. Soft delete (`active: false`) — nunca apaga de verdade, pois pode haver histórico de agendamento vinculado.

---

## Módulo 6 — Disponibilidade e Horários (Agenda)

### `POST /companies/:companyId/professionals/:professionalId/availability` — staff
Define a grade semanal de trabalho do profissional **nessa empresa**.
```json
{ "weekday": 1, "startMinute": 540, "endMinute": 1080 }
```
- `weekday`: `0` domingo … `6` sábado.
- `startMinute`/`endMinute`: minutos desde 00:00. `540` = 09:00, `1080` = 18:00.
- Pode cadastrar múltiplos períodos no mesmo dia (ex: 09:00–12:00 e 14:00–18:00, com almoço no meio).

### `GET /companies/:companyId/professionals/:professionalId/availability` — staff. Lista os períodos cadastrados.

### `DELETE /companies/:companyId/professionals/:professionalId/availability/:id` — staff. `204`.

### `GET /companies/:companyId/professionals/:professionalId/slots?date=YYYY-MM-DD&serviceIds=id1,id2`
**Aceita staff OU cliente.** Esse é o endpoint-chave da tela de agendamento: dado o profissional e os serviços escolhidos (a duração total é a soma), devolve os horários livres do dia, considerando grade de trabalho, folgas e agendamentos já existentes.

Query opcional `excludeAppointmentId`: ao editar um horário, exclui esse agendamento da ocupação para o slot atual continuar disponível.

```
GET /companies/xxx/professionals/yyy/slots?date=2026-09-07&serviceIds=cmthhk78c00089715oawvg2dk
GET /companies/xxx/professionals/yyy/slots?date=2026-09-07&serviceIds=id1&excludeAppointmentId=idDoAgendamento
```

**Response 200**
```json
{
  "durationMinutes": 30,
  "slots": [
    "2026-09-07T09:00:00.000Z",
    "2026-09-07T09:15:00.000Z",
    "2026-09-07T09:30:00.000Z"
  ]
}
```
Cada item de `slots` é um horário de **início** válido pra agendar (passo de 15 em 15 min). Use um desses valores diretamente como `startAt` na criação do agendamento.

---

## Módulo 7 — Agendamentos (visão staff)

### `POST /companies/:companyId/appointments` — staff (cria em nome de qualquer cliente, ex: agendamento por telefone)
```json
{
  "professionalId": "cmthhw4sr0000p71519772ihv",
  "clientId": "cmthhwi8f0003p715gllio0mx",
  "serviceIds": ["cmthhk78c00089715oawvg2dk"],
  "startAt": "2026-09-07T09:00:00.000Z",
  "notes": "cliente pediu para o Carlos"
}
```
`startAt` deve ser um horário que veio da resposta de `/slots` (o backend valida disponibilidade de novo antes de gravar).

**Response 201**
```json
{
  "id": "cmthibmtm0002k115u4mg279k",
  "companyId": "...",
  "professionalId": "...",
  "clientId": "...",
  "startAt": "2026-09-07T09:00:00.000Z",
  "endAt": "2026-09-07T09:30:00.000Z",
  "status": "SCHEDULED",
  "notes": null,
  "createdAt": "...",
  "updatedAt": "...",
  "services": [
    {
      "id": "cmthibmtq0003k11510avfpw9",
      "appointmentId": "...",
      "serviceId": "cmthhk78c00089715oawvg2dk",
      "serviceName": "Corte Masculino",
      "price": "50",
      "durationMinutes": 30,
      "commissionRate": null,
      "commissionAmount": null,
      "commissionPayoutId": null
    }
  ]
}
```
Erros possíveis: `400` (fora da grade de disponibilidade ou serviço inválido pra esse profissional/empresa), `404` (profissional não pertence à empresa), `409` (horário acabou de ser ocupado por outra pessoa — colisão real de concorrência, tratada no banco).

### `GET /companies/:companyId/appointments?professionalId=&date=YYYY-MM-DD` — staff. Ambos filtros opcionais.

### `GET /companies/:companyId/appointments/:id` — staff.

### `PATCH /companies/:companyId/appointments/:id/schedule` — staff
Só para status `SCHEDULED`. Troca horário, profissional e/ou observações. Serviços e cliente não mudam por este endpoint.

```json
{
  "startAt": "2026-09-07T10:00:00.000Z",
  "professionalId": "opcional",
  "notes": "opcional"
}
```

### `PATCH /companies/:companyId/appointments/:id/status` — staff
```json
{ "status": "COMPLETED" }
```
Valores aceitos: `COMPLETED`, `CANCELLED`, `NO_SHOW` (não dá pra voltar pra `SCHEDULED` por aqui). Ao marcar `COMPLETED`, o backend calcula e grava a comissão de cada serviço automaticamente (ver Módulo 9). Se corrigir de volta pra `CANCELLED`/`NO_SHOW`, a comissão daquele item é zerada.

---

## Módulo 8 — Agendamentos (self-service do cliente)

### `POST /clients/me/appointments` — token cliente
```json
{
  "companyId": "cmthhj3br00009715yytu7f1g",
  "professionalId": "cmthhw4sr0000p71519772ihv",
  "serviceIds": ["cmthhk78c00089715oawvg2dk"],
  "startAt": "2026-09-07T10:15:00.000Z",
  "notes": "opcional"
}
```
Igual ao endpoint staff, mas `clientId` vem do token — não precisa (nem pode) enviar no body. Mesmas validações e mesmos códigos de erro.

### `GET /clients/me/appointments` — token cliente. Lista os agendamentos do próprio cliente, em **todas** as empresas onde ele já agendou, com o nome da empresa incluso:
```json
[
  {
    "id": "...",
    "companyId": "...",
    "startAt": "...",
    "status": "SCHEDULED",
    "services": [...],
    "company": { "id": "...", "name": "Barbearia Alfa" }
  }
]
```

### `PATCH /clients/me/appointments/:id/cancel` — token cliente
Sem body. Regras:
- Só cancela agendamento com status `SCHEDULED` (`400` caso contrário).
- Respeita `cancellationMinNoticeMinutes` configurado pela empresa (Módulo 1) — `409` se estiver dentro da janela mínima de antecedência.

---

## Módulo 9 — Comissionamento

Dois níveis de taxa: padrão do profissional na empresa, e um override opcional por serviço específico (o override, se existir, tem prioridade).

### `PATCH /companies/:companyId/professionals/:id/commission` — staff
```json
{ "rate": 40 }
```
`rate` é porcentagem (`0`–`100`). Define a taxa padrão desse profissional nessa empresa.

### `PATCH /companies/:companyId/professionals/:id/services/:serviceId/commission` — staff
```json
{ "rate": 50 }
```
Override só pra esse serviço específico.

### `GET /companies/:companyId/professionals/:id/commissions?from=YYYY-MM-DD&to=YYYY-MM-DD` — staff
Comissão **ainda não paga**, gerada por atendimentos `COMPLETED` no período.
```json
{
  "professionalId": "...",
  "from": "2026-08-01",
  "to": "2026-09-30",
  "total": 25,
  "items": [
    {
      "id": "cmthiss6h0003lb15o9x6cy9t",
      "appointmentId": "...",
      "startAt": "2026-09-07T17:30:00.000Z",
      "serviceName": "Corte Masculino",
      "price": "50",
      "commissionRate": "50",
      "commissionAmount": "25",
      "paid": false
    }
  ]
}
```

### `POST /companies/:companyId/professionals/:id/commission/payouts` — staff
```json
{ "from": "2026-08-01", "to": "2026-09-30" }
```
"Fecha" a comissão pendente do período: soma tudo que está `paid:false`, cria o registro de pagamento e marca os itens como pagos (não entram mais em nenhum relatório futuro). `409` se não houver nada pendente nesse período.

**Response 201**
```json
{
  "id": "cmthjjf3x0001hs158atoxzj0",
  "companyId": "...",
  "professionalId": "...",
  "periodFrom": "2026-08-01T00:00:00.000Z",
  "periodTo": "2026-10-01T00:00:00.000Z",
  "amount": "25",
  "createdAt": "..."
}
```

### `GET /companies/:companyId/professionals/:id/commission/payouts` — staff. Histórico de fechamentos (array no mesmo formato acima).

---

## Módulo 10 — Financeiro (Pagamentos)

Um pagamento por agendamento (sem split entre métodos). Sem integração com gateway/Pix real — é registro manual de "como o cliente pagou".

### `POST /companies/:companyId/appointments/:id/payment` — staff
```json
{ "method": "PIX", "amount": 50 }
```
`method`: `"CASH"` | `"CARD"` | `"PIX"`. `amount` opcional — se omitido, usa a soma dos serviços do agendamento. Só funciona em agendamento `COMPLETED` (`400` senão). `409` se já existe pagamento pra esse agendamento.

**Response 201**
```json
{
  "id": "cmthjgune0000hs15d2b91504",
  "appointmentId": "...",
  "companyId": "...",
  "amount": "50",
  "method": "PIX",
  "status": "PAID",
  "paidAt": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /companies/:companyId/appointments/:id/payment` — staff. Retorna o pagamento daquele agendamento (`404` se não existe).

### `PATCH /companies/:companyId/appointments/:id/payment/refund` — staff. Sem body. Marca `status: "REFUNDED"`. `409` se já estava reembolsado.

### `GET /companies/:companyId/payments?from=YYYY-MM-DD&to=YYYY-MM-DD` — staff
Relatório de receita (só conta pagamentos `PAID`, ignora `REFUNDED`).
```json
{
  "from": "2026-08-01",
  "to": "2026-09-30",
  "total": 50,
  "byMethod": { "PIX": 50 },
  "payments": [ { "id": "...", "amount": "50", "method": "PIX", "status": "PAID", "paidAt": "..." } ]
}
```

---

## Módulo 11 — Relatórios Gerenciais

### `GET /companies/:companyId/reports/overview?from=YYYY-MM-DD&to=YYYY-MM-DD` — staff
Visão consolidada do período — o dashboard principal da gestão.

**Response 200**
```json
{
  "from": "2026-08-01",
  "to": "2026-09-30",
  "appointments": {
    "total": 6,
    "byStatus": { "COMPLETED": 2, "CANCELLED": 2, "SCHEDULED": 2 },
    "cancellationRate": 0.333,
    "noShowRate": 0
  },
  "revenue": { "total": 0, "byMethod": {}, "averageTicket": 0 },
  "topServices": [
    { "serviceId": "...", "name": "Corte Masculino", "count": 2, "revenue": 100 }
  ],
  "topProfessionals": [
    { "professionalId": "...", "name": "Carlos Barbeiro", "appointmentsCompleted": 2, "revenue": 100, "commission": 25 }
  ],
  "topClients": [
    { "clientId": "...", "name": "Maria Cliente", "visits": 1, "revenue": 50 }
  ],
  "clients": { "new": 2, "returning": 0 }
}
```
- `cancellationRate`/`noShowRate`: fração de `0` a `1` (multiplique por 100 pra exibir %).
- `topServices`/`topProfessionals`/`topClients`: já vêm ordenados por receita, do maior pro menor. Os dois primeiros limitam a 5 itens (`topProfessionals` traz todos).
- `clients.new`: clientes cujo **primeiro** atendimento `COMPLETED` naquela empresa caiu dentro do período. `returning`: já tinham atendimento completo anterior.

---

## Fluxo sugerido pra montar as telas

**Onboarding da barbearia (backoffice)**
1. `POST /companies` → `POST /users` (com `companyIds: [company.id]`) → `POST /auth/login`
2. Com o token: `POST .../services`, `POST .../professionals` (+ `serviceIds`), `POST .../professionals/:id/availability`

**App do cliente**
1. `POST /clients/register` → `POST /clients/login`
2. `GET /companies` → cliente escolhe a barbearia
3. `GET /companies/:id/professionals` → escolhe o barbeiro
4. `GET /companies/:id/services` (filtrar pelos `services` que vieram no objeto do profissional escolhido) → escolhe um ou mais serviços
5. `GET /companies/:id/professionals/:id/slots?date=&serviceIds=` → escolhe o horário
6. `POST /clients/me/appointments`
7. `GET /clients/me/appointments` → "meus agendamentos" / `PATCH .../cancel`

**Painel da barbearia (dia a dia)**
1. `GET .../appointments?date=` → agenda do dia
2. `PATCH .../appointments/:id/status` (`COMPLETED`) ao finalizar o corte
3. `POST .../appointments/:id/payment` no caixa
4. `GET .../professionals/:id/commissions` / `POST .../commission/payouts` no fechamento
5. `GET .../reports/overview` no dashboard gerencial

---

## Limitações conhecidas (ainda não resolvidas)

- `GET /users` e `GET /users/:id` não são escopados por empresa — retornam todos os usuários do sistema pra qualquer staff autenticado.
- Sem paginação em nenhuma listagem (`GET` de lista sempre retorna tudo). Se o volume de dados crescer, isso vai precisar ser adicionado.
- Sem endpoint de "esqueci minha senha" (nem para staff, nem para cliente).
- Sem upload de foto/avatar (profissional, cliente, empresa).
