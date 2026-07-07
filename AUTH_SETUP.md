# Configuracao de acesso

O app usa Supabase Auth com e-mail e senha.

## Modelo de permissao

- Usuarios com e-mail `@v4company.com` autenticados no Supabase podem ler os dashboards.
- A Bianca (`bianca.segato@v4company.com`) e usuarios com `app_metadata.role = admin` podem editar, importar CSV, sincronizar eKyte e salvar dados.
- Usuarios fora de `@v4company.com` sao bloqueados no frontend e pelo RLS.

## Criar a Bianca

No painel do Supabase:

1. Abra `Authentication` -> `Users`.
2. Encontre ou crie `bianca.segato@v4company.com`.
3. Marque o e-mail como confirmado, se necessario.
4. Defina a senha:

```text
Master@V4Karsten2026
```

Pelo RLS atual, esse e-mail ja e tratado como admin mesmo sem `app_metadata.role`.

## Criar leitores

Crie os demais usuarios em `Authentication` -> `Users` com e-mail `@v4company.com` e uma senha propria.

Eles poderao ver dashboards, mas nao terao botoes nem permissao de escrita.

## Nao usar

Nao habilite login anonimo para leitura direta das tabelas. Isso exigiria policies publicas para `anon` e enfraqueceria a seguranca dos dados.
