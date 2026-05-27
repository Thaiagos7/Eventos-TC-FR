# Contexto completo para continuar o projeto Eventos TC noutra sessão do Codex

Este resumo foi criado em 2026-05-27 para permitir continuar o trabalho noutra sessão do Codex sem perder contexto.

## Estado atual do Git

- Projeto local: `C:\Users\thiag\Documents\Eventos-TC-FR`
- Branch ativa: `main`
- Repositório remoto: `https://github.com/Thaiagos7/Eventos-TC-FR.git`
- Último commit feito e enviado para GitHub:
  - `6fe415df Persist registrations and notifications`
- O `git status` ficou limpo depois do push.

Commits recentes relevantes:

- `6fe415df Persist registrations and notifications`
- `5b91162f Add auth profile tests`
- `7a6b0970 Add event mapper tests`
- `b5fefa80 Optimize route loading`
- `39bc16ef Remove unused mock pages`
- `0c5a244e Clean up lint errors`
- `6420d054 Stabilize auth and event loading`

## Objetivo geral do projeto

O projeto é uma aplicação web de eventos para a escola/TC, chamada Eventos TC. Usa React, Vite, TypeScript, Supabase, React Router, Tailwind CSS, shadcn/Radix UI, Vitest e outras bibliotecas.

Funcionalidades principais:

- Login normal por email/password.
- Login com Google via Supabase OAuth.
- Perfis com roles: `admin`, `professor`, `aluno`.
- Listagem de eventos.
- Dashboard para admin/professor.
- Criação, edição, aprovação/rejeição e conclusão de eventos.
- Inscrição de alunos em eventos.
- Tabela de participantes.
- Perfil com eventos inscritos e concluídos.
- Notificações.
- Exportação/PDF/certificados em partes do projeto.

## Problemas resolvidos durante esta sessão/histórico recente

### 1. Login Google no localhost/Vercel

Problema inicial:

- Ao clicar em “Entrar com Google”, o Supabase redirecionava com tokens na URL.
- Às vezes ia para o site online em vez do localhost.
- Às vezes ficava em `/eventos#access_token=...`.
- O login dizia sucesso, mas a app não ficava autenticada.
- Algumas sessões ficavam com JWT expirado ou data aparentemente no futuro.

Correções feitas anteriormente:

- Estabilização do fluxo OAuth.
- Limpeza do hash/token da URL depois do login.
- Tratamento da sessão vinda do hash.
- Ajustes no `AuthContext` e callback OAuth.
- Preservação da sessão no storage `eventostc-auth`.
- Correção de logout lento/travado.
- Mantida compatibilidade com Vercel.

Estado atual:

- Login Google funciona.
- Login email/password funciona.
- Logout funciona.
- Há alguma lentidão pontual de carregamento, mas funcional.

### 2. Roles/permissões de admin/professor/aluno

Problema:

- Admin e professor estavam a cair como `aluno`.
- Header mostrava email/nome de forma errada.
- Professor aparecia repetido em alguns textos.

Correções feitas:

- Perfis passaram a ser carregados pela tabela `profiles`.
- Foram aplicados SQLs no Supabase para preencher perfis e roles.
- Header agora mostra “Administrador” ou nome adequado do professor/aluno conforme o perfil.
- Permissões de dashboard/criação de eventos foram recuperadas.

Estado atual:

- Admin vê dashboard e pode gerir eventos.
- Professor deve ver permissões conforme role.
- Aluno vê fluxo normal de inscrição.

### 3. Base de dados Supabase organizada minimamente

Foi feita uma melhoria na base de dados com SQL aplicado manualmente no Supabase:

- Tabela `profiles` preenchida/atualizada.
- Roles por email corrigidas.
- Perfis de teste/admin/professor/alunos preenchidos.

O utilizador confirmou no Supabase que a query de perfis devolvia 11 rows.

Importante:

- Algumas consultas feitas pela app podem devolver só dados permitidos por RLS. Isso é esperado.
- Quando a app está como aluno, pode não ver todos os participantes, só os dele.

### 4. Contagem de inscritos no detalhe do evento

Problema:

- Um evento podia mostrar no topo `6/30`, mas depois, em baixo, “1 inscrito neste evento”.
- Isto acontecia porque a lista de participantes carregada para aluno podia ser parcial por causa de RLS.

Correção feita no commit `6fe415df`:

- Criado `src/lib/participantCounts.ts`.
- Criado teste `src/lib/participantCounts.test.ts`.
- `EventoDetalhe.tsx` agora usa:
  - Para gestores/admin/prof: lista carregada de participantes.
  - Para aluno: contador oficial do evento (`currentParticipants`).

Ficheiros:

- `src/pages/EventoDetalhe.tsx`
- `src/lib/participantCounts.ts`
- `src/lib/participantCounts.test.ts`

### 5. Perfil perdia “Eventos inscritos” e “Eventos concluídos” após logout/login

Problema:

- No perfil do aluno, as listas “Eventos inscritos” e “Eventos concluídos” só apareciam na sessão atual.
- Depois de logout/login, desapareciam, mesmo estando na base de dados.
- Causa: `Profile.tsx` usava apenas o estado local `participants` do `EventContext`, que só era populado ao abrir eventos específicos ou inscrever-se na sessão atual.

Correção feita no commit `6fe415df`:

- `EventContext` ganhou `loadParticipantsForUser(email)`.
- Ao abrir o perfil, `Profile.tsx` chama `loadParticipantsForUser(user.email)`.
- Criado helper `getProfileEventGroups`.
- Agora o perfil reconstrói listas de inscritos/concluídos com dados vindos da base.

Ficheiros:

- `src/contexts/EventContext.tsx`
- `src/pages/Profile.tsx`
- `src/lib/profileEvents.ts`
- `src/lib/profileEvents.test.ts`

### 6. Notificações só duravam na sessão

Problema:

- Notificações eram só estado React em memória.
- Ao fazer logout/login ou abrir noutro dispositivo, desapareciam.

Primeira melhoria:

- Criado storage local com `localStorage`, para sobreviver a logout/login no mesmo browser.

Melhoria final pedida:

- O utilizador pediu para ficarem numa tabela Supabase, para funcionarem em qualquer dispositivo.

Correção feita no commit `6fe415df`:

- Criado SQL `supabase/notifications.sql`.
- Criado repositório `src/lib/notificationRepository.ts`.
- `NotificationContext` agora:
  - Carrega notificações do Supabase ao fazer login.
  - Grava novas notificações no Supabase.
  - Marca notificações como lidas no Supabase.
  - Continua com fallback local, para não partir caso a tabela ainda não exista.

Ficheiros:

- `supabase/notifications.sql`
- `src/contexts/NotificationContext.tsx`
- `src/lib/notificationRepository.ts`
- `src/lib/notificationRepository.test.ts`
- `src/lib/notificationStore.ts`
- `src/lib/notificationStore.test.ts`

## Passo manual ainda necessário no Supabase

O SQL da tabela de notificações já está no projeto, mas precisa ser aplicado manualmente no Supabase.

Ficheiro:

- `supabase/notifications.sql`

Instruções:

1. Abrir o Supabase.
2. Ir ao SQL Editor.
3. Copiar tudo de `supabase/notifications.sql`.
4. Colar e clicar `Run`.

O SQL cria:

- Tabela `public.notifications`.
- Índice por `user_id` e `created_at`.
- RLS ativado.
- Policy para utilizador autenticado ler as suas notificações.
- Policy para utilizador autenticado criar notificações.
- Policy para utilizador atualizar/marcar como lidas as suas notificações.
- Grants para `authenticated`.

Observação:

- Enquanto o SQL não for aplicado, a app ainda tenta funcionar com fallback local.
- Depois de aplicado, notificações novas devem aparecer em qualquer browser/dispositivo quando o utilizador entra na mesma conta.

## Validações feitas

Antes do commit/push `6fe415df`, foram corridos:

- `npm run lint` passou.
- `npm run test` passou.
  - 7 test files.
  - 16 tests.
- `npm run build` passou.

## Tecnologias usadas no projeto

Confirmado no `package.json`/uso do projeto:

- Vite
- React
- TypeScript
- Supabase JS
- React Router DOM
- TanStack Query
- Tailwind CSS
- shadcn/ui e Radix UI
- React Hook Form + Zod
- jsPDF
- xlsx
- Vitest
- Framer Motion
- lucide-react
- date-fns

Nota para relatório/slides:

- Para slides, foi considerado suficiente listar diretamente: Vite, React, TypeScript, Supabase, Tailwind CSS e JSON.
- Para relatório técnico, faz sentido incluir a lista maior, desde que explicado que algumas bibliotecas são auxiliares/componentes/exportação/testes.

## Ficheiros mais importantes para dar contexto a outro Codex

Se precisares mandar ficheiros a outro Codex, os mais importantes são:

### Autenticação/perfis

- `src/contexts/AuthContext.tsx`
- `src/components/auth/OAuthCallbackHandler.tsx`
- `src/components/auth/GoogleSignInButton.tsx`
- `src/lib/authProfile.ts`
- `src/lib/authProfile.test.ts`
- `src/lib/supabase.ts`

### Eventos/participantes

- `src/contexts/EventContext.tsx`
- `src/lib/eventMappers.ts`
- `src/lib/eventMappers.test.ts`
- `src/lib/participantCounts.ts`
- `src/lib/participantCounts.test.ts`
- `src/pages/EventoDetalhe.tsx`
- `src/pages/Eventos.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/EventoParticipantes.tsx`
- `src/pages/Profile.tsx`
- `src/lib/profileEvents.ts`
- `src/lib/profileEvents.test.ts`

### Notificações

- `src/contexts/NotificationContext.tsx`
- `src/lib/notificationRepository.ts`
- `src/lib/notificationRepository.test.ts`
- `src/lib/notificationStore.ts`
- `src/lib/notificationStore.test.ts`
- `src/pages/Notificacoes.tsx`
- `src/components/layout/Header.tsx`
- `supabase/notifications.sql`

### Build/config

- `package.json`
- `vite.config.ts`
- `vitest.config.ts`
- `vercel.json`
- `.env.example`
- `.env` não deve ser enviado publicamente, mas pode ser necessário verificar localmente.

## Melhorias pendentes / próximas prioridades

### 1. Aplicar e testar tabela de notificações no Supabase

Depois de correr `supabase/notifications.sql`:

- Criar uma notificação usando a app.
- Fazer logout.
- Entrar novamente.
- Ver se a notificação continua.
- Abrir noutro browser/dispositivo e entrar na mesma conta.
- Ver se a notificação aparece.
- Marcar como lida e verificar se fica lida depois de refresh.

### 2. Melhorar loading visual de `/eventos` e `/dashboard`

Observação do utilizador:

- Ao abrir `/eventos` e `/dashboard`, aparece durante um milissegundo uma página sem dados e depois os dados entram.

Isto é normal em apps React com carregamento assíncrono, mas pode ficar mais profissional.

Melhoria futura:

- Criar estados de loading/skeleton.
- Evitar mostrar “vazio” antes da primeira resposta da base.
- Diferenciar “a carregar” de “não há dados”.

### 3. Diferenças de cor no modo claro/escuro

Problema relatado:

- Há textos que provavelmente não contrastam bem no modo claro/escuro.

Ainda não foi atacado.

Como resolver:

- Fazer revisão visual com browser nos dois temas.
- Procurar classes com cores fixas em vez de tokens (`text-white`, `text-gray-*`, etc.).
- Trocar por `text-foreground`, `text-muted-foreground`, `bg-background`, `border-border`, etc.

### 4. Segurança futura

Ideias discutidas:

- Melhorar policies RLS.
- Evitar que frontend possa criar notificações arbitrárias para qualquer utilizador.
- Uma solução mais robusta seria usar Edge Functions/backend para criar notificações sensíveis.

Estado atual:

- A policy de insert em `notifications` permite `authenticated` criar notificações.
- Isto é pragmático para a app frontend atual.
- Para produção mais rigorosa, deve ser endurecido no futuro.

### 5. Testes de fluxo real no browser

Já existem testes unitários, mas ainda faz sentido validar manualmente:

- Login Google.
- Login admin.
- Login professor.
- Login aluno.
- Criar evento.
- Aprovar/rejeitar evento.
- Inscrever aluno.
- Ver contador de inscritos.
- Ver perfil antes/depois de logout.
- Ver notificações antes/depois de logout.
- Ver notificações depois de aplicar SQL no Supabase.

## Cuidados importantes para o próximo Codex

- Não fazer `git reset --hard`.
- Não reverter alterações sem confirmar com o utilizador.
- O utilizador quer commits/pushes apenas quando pedir.
- O branch alvo é `main`.
- O projeto está ligado ao Vercel, por isso push para `main` pode acionar deploy.
- O `.env` contém chaves e não deve ser exposto publicamente.
- Quando mexer em Supabase, normalmente o utilizador cola SQL manualmente no SQL Editor.
- Depois de mudanças relevantes, correr:
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Resumo curtíssimo para colar noutro chat

Projeto Eventos TC em React/Vite/TypeScript/Supabase. Branch `main`, remoto `Thaiagos7/Eventos-TC-FR`. Último commit/push: `6fe415df Persist registrations and notifications`. Já foram corrigidos OAuth Google, login/logout, roles admin/prof/aluno, carregamento de eventos, permissões, perfil, contagem de inscritos e notificações. A tabela `profiles` já foi ajustada no Supabase. Foi criado `supabase/notifications.sql` para persistir notificações no Supabase; ainda precisa ser aplicado manualmente no SQL Editor. App agora carrega inscrições do utilizador no perfil via `loadParticipantsForUser`, usa `profileEvents.ts`, corrige contagem com `participantCounts.ts`, e usa `notificationRepository.ts`/`NotificationContext.tsx` para notificações no Supabase com fallback local. Validações passaram: lint, 16 testes, build. Próximos passos: aplicar `notifications.sql`, testar notificações multi-dispositivo, melhorar loading/skeleton em `/eventos` e `/dashboard`, corrigir contrastes modo claro/escuro e futuramente endurecer RLS/segurança.
