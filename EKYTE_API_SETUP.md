# Integracao eKyte API

Esta integracao sincroniza apontamentos da eKyte por uma Vercel Serverless Function.

## Como funciona

- O botao `Sincronizar eKyte` chama `/api/ekyte-sync`.
- O frontend envia o token da sessao Supabase no header `Authorization`.
- A funcao valida o usuario no Supabase Auth e permite sincronizacao apenas para emails em `ADMIN_EMAILS`.
- A chave da eKyte fica somente em variavel server-side (`EKYTE_API_KEY`), sem prefixo `VITE_`.
- A funcao normaliza os apontamentos para o formato usado pelo dashboard.
- Depois disso, os dados continuam sendo salvos no Supabase em `app_state.data`.

Variaveis `VITE_*` ficam visiveis no navegador depois do build. Nao coloque senhas ou API keys secretas nelas.

## Variaveis publicas do frontend

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## Variaveis server-side na Vercel

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica
ADMIN_EMAILS=bianca.segato@v4company.com

EKYTE_API_KEY=sua-chave-da-ekyte
EKYTE_TIME_ENTRIES_URL=https://api.ekyte.com/v1.0/time-trackings
EKYTE_API_KEY_PLACEMENT=query
EKYTE_API_KEY_PARAM=apiKey
EKYTE_START_PARAM=createdFrom
EKYTE_END_PARAM=createdTo
EKYTE_ITEMS_PATH=data
EKYTE_USE_PAGINATION=true
EKYTE_PAGE_PARAM=page
EKYTE_MAX_PAGES=50
```

O app ainda suporta chave por header se algum endpoint diferente exigir isso no futuro:

```env
EKYTE_API_KEY_PLACEMENT=header
EKYTE_AUTH_HEADER=Authorization
EKYTE_AUTH_SCHEME=Bearer
```

Ou, se o endpoint futuro pedir `x-api-key`:

```env
EKYTE_API_KEY_PLACEMENT=header
EKYTE_AUTH_HEADER=x-api-key
EKYTE_AUTH_SCHEME=
```

## Importante

A chave antiga da eKyte deve ser rotacionada, pois antes ela era publicada como `VITE_EKYTE_API_KEY`.

Como Vite injeta variaveis publicas no build, gere um novo deploy depois de alterar as variaveis:

```bash
npm run build
```
