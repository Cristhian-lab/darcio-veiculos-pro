# Dárcio Veículos Pro — Sistema separado por páginas

Sistema web em HTML, CSS e JavaScript puro, com área pública separada da área administrativa.

## Páginas

- `index.html` — catálogo público para clientes.
- `veiculo.html?id=...` — página de detalhes do veículo.
- `login.html` — login do painel administrativo.
- `admin.html` — dashboard, cadastro, estoque, movimentações e backup.

## Acesso administrativo

- Usuário: `admin`
- Senha: `1234`

Altere em `js/store.js`:

```js
adminUser: "admin",
adminPassword: "1234"
```

## WhatsApp

O WhatsApp principal está configurado em `js/store.js`:

```js
whatsappPrincipal: "5575988698486"
```

Formato correto: `55` + DDD + número.

## Como rodar

1. Extraia o ZIP.
2. Abra `index.html` no navegador para ver a área do cliente.
3. Abra `login.html` para acessar a área administrativa.

## Observação importante

Este projeto funciona no navegador usando `localStorage`. Para uso real com várias pessoas e vários computadores, o ideal é conectar a um back-end com banco de dados, autenticação segura e hospedagem.
