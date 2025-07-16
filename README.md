# Secure Vault File Keeper

Aplicação web para criptografia e descriptografia de arquivos, garantindo segurança e privacidade diretamente no navegador.

## Funcionalidades

- **Criptografia de arquivos**: Proteja qualquer arquivo com senha usando AES-256-GCM.
- **Descriptografia de arquivos**: Recupere arquivos protegidos informando a senha correta.
- **Processamento local**: Nenhum dado ou senha é enviado para servidores. Tudo acontece no seu navegador.
- **Interface moderna**: UI responsiva, intuitiva e com feedback visual.
- **Notificações**: Alertas e toasts para informar sucesso, erro ou progresso.

## Como funciona

1. **Selecione um arquivo** para criptografar.
2. **Defina uma senha forte**. Ela será usada para gerar a chave criptográfica.
3. **Baixe o arquivo criptografado** (.enc).
4. Para descriptografar, basta fazer upload do arquivo .enc e informar a senha correta.

> **Atenção:**
> - Sem a senha correta, não é possível recuperar o conteúdo do arquivo.
> - Guarde sua senha em local seguro.

## Tecnologias Utilizadas
- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI (shadcn/ui)
- Web Crypto API (AES-256-GCM, PBKDF2)

## Instalação e Uso

1. Clone o repositório:
   ```sh
   git clone <url-do-repo>
   cd secure-vault-file-keeper
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Rode o projeto em modo desenvolvimento:
   ```sh
   npm run dev
   ```
4. Acesse `http://localhost:5173` no navegador.

## Estrutura do Projeto
- `src/components/` — Componentes de UI e principais
- `src/lib/crypto.ts` — Funções de criptografia e utilitários
- `src/pages/Index.tsx` — Página principal

## Segurança
- Criptografia de ponta a ponta: tudo acontece no navegador do usuário.
- Chave derivada da senha via PBKDF2 + salt aleatório.
- Algoritmo AES-256-GCM para máxima segurança.

## Licença

MIT

---

Desenvolvido para quem valoriza privacidade e segurança de dados pessoais ou profissionais.
