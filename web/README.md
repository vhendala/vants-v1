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

