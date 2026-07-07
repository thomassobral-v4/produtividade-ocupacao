# Integracao eKyte API

Esta integracao substitui o upload manual de CSV por uma sincronizacao direta no app.

## Como funciona

- O botao `Sincronizar eKyte` chama a API da eKyte direto pelo frontend.
- A chave fica em variavel de ambiente Vite (`VITE_EKYTE_API_KEY`).
- O app normaliza os apontamentos da API para o mesmo formato que a planilha CSV usava.
- Depois disso, os dados continuam sendo salvos no Supabase em `app_state.data`, como ja acontece hoje.

Importante: variaveis `VITE_*` ficam visiveis no navegador depois do build. Para este projeto, isso foi assumido como aceitavel.

## Variaveis no `.env.local`

Preencha pelo menos:

```env
VITE_EKYTE_API_KEY=sua-chave-da-ekyte
VITE_EKYTE_TIME_ENTRIES_URL=https://api.ekyte.com/v1.0/time-trackings
```

Documentacao usada:

```text
https://developers.ekyte.com/docs/docs-bi/
```

O Swagger da eKyte pode mostrar `Failed to load API definition` porque tenta carregar:

```text
https://api.ekyte.com/api-docs/v1/swagger.json
```

No ambiente atual, esse JSON esta falhando pela propria API da eKyte. A pagina de BI, porem, informa o endpoint de apontamento de horas:

```text
GET https://api.ekyte.com/v1.0/time-trackings
```

Parametros usados pelo app conforme a documentacao de BI:

```text
apiKey
createdFrom
createdTo
page
```

Configuracao completa recomendada:

```env
VITE_EKYTE_API_KEY_PLACEMENT=query
VITE_EKYTE_API_KEY_PARAM=apiKey
VITE_EKYTE_START_PARAM=createdFrom
VITE_EKYTE_END_PARAM=createdTo
VITE_EKYTE_ITEMS_PATH=data
VITE_EKYTE_USE_PAGINATION=true
VITE_EKYTE_PAGE_PARAM=page
VITE_EKYTE_PER_PAGE_PARAM=
VITE_EKYTE_PER_PAGE=
VITE_EKYTE_MAX_PAGES=50
```

O app ainda suporta chave por header se algum endpoint diferente exigir isso no futuro. Para a API BI atual da eKyte, mantenha `VITE_EKYTE_API_KEY_PLACEMENT=query`.

```env
VITE_EKYTE_API_KEY_PLACEMENT=header
VITE_EKYTE_AUTH_HEADER=Authorization
VITE_EKYTE_AUTH_SCHEME=Bearer
```

Ou, se o endpoint futuro pedir `x-api-key`:

```env
VITE_EKYTE_API_KEY_PLACEMENT=header
VITE_EKYTE_AUTH_HEADER=x-api-key
VITE_EKYTE_AUTH_SCHEME=
```

## Depois de preencher

Como Vite injeta variaveis no build, reinicie o servidor local ou gere novo build:

```bash
npm run build
```

## Campos que o app tenta mapear

A funcao ja tenta reconhecer nomes comuns:

- executor: `executor`, `user.name`, `user.email`, `assignee.name`, `responsible.name`
- cliente/projeto: `workspace`, `project.name`, `client.name`, `customer.name`
- data: `startDate`, `createdIn`, `date`, `work_date`, `worked_at`, `started_at`, `created_at`
- tempo: `effort` e `actualTime` em minutos, alem de `hours`, `duration_hours`, `duration`, `time`, `worked_time`, `minutes`

Quando voce enviar um exemplo real de resposta da eKyte, o ajuste fino fica concentrado em:

```text
services/ekyteSync.ts
```

## Possivel bloqueio de CORS

Se a eKyte nao permitir chamadas direto do navegador, o erro vai aparecer como falha de `fetch` ou CORS no console.
Nesse caso, ai sim precisariamos de um proxy simples ou Edge Function. Mas o app ja esta configurado primeiro para o caminho direto.
