# Vantis Web

Aplicação web do Vantis - The "Buy & Keep" Card - Smart Credit on Soroban

## Visão Geral

Esta é a versão web do aplicativo Vantis, convertida do projeto mobile React Native/Expo para uma aplicação web moderna usando React, TypeScript e Vite.

## Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Lucide React** - Ícones
- **CSS Modules** - Estilização

## Estrutura do Projeto

```
web/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas/páginas
│   ├── contexts/        # Contextos React (Theme, Wallet)
│   ├── services/        # Serviços (wallet, passkey)
│   ├── theme/           # Sistema de temas
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Instalação

```bash
cd web
npm install
```

## Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Build para Produção

```bash
npm run build
```

Os arquivos de produção estarão na pasta `dist/`

## Preview da Build

```bash
npm run preview
```

## Deploy no Vercel

O projeto está configurado para deploy no Vercel. Existem duas formas de fazer o deploy:

### Opção 1: Deploy via Vercel CLI

1. Instale o Vercel CLI globalmente:
```bash
npm i -g vercel
```

2. Na pasta `web`, execute:
```bash
vercel
```

3. Siga as instruções do CLI para configurar o projeto.

### Opção 2: Deploy via Dashboard do Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Conecte seu repositório GitHub (`vhendala/vants-app`)
4. Configure o projeto:
   - **Root Directory**: `web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Clique em "Deploy"

O arquivo `vercel.json` já está configurado na pasta `web` com as configurações necessárias.

## Funcionalidades

- ✅ Sistema de temas (claro/escuro)
- ✅ Conexão de carteira Stellar
- ✅ Autenticação com Passkeys (WebAuthn)
- ✅ Navegação entre telas
- ✅ Gerenciamento de carteira
- ✅ Interface responsiva

## Diferenças da Versão Mobile

- Navegação: React Router ao invés de React Navigation
- Estilos: CSS Modules ao invés de StyleSheet
- Ícones: Lucide React ao invés de Expo Vector Icons
- Storage: localStorage ao invés de AsyncStorage
- Passkeys: WebAuthn API nativa do navegador

## Próximos Passos

- Implementar funcionalidades completas de pagamento
- Adicionar integração com backend
- Melhorar responsividade mobile
- Adicionar testes
- Otimizar performance

## Licença

_To be defined_

