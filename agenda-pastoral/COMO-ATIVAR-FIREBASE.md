# Agenda Pastoral — ativar a base compartilhada (Firebase)

Com o Firebase, todos os agentes entram com a conta Google e veem a mesma agenda.
O plano gratuito (Spark) é suficiente para uma paróquia.

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com e clique em **Criar projeto** (ex.: `agenda-pastoral`). Pode desativar o Google Analytics.
2. Em **Criação › Authentication › Começar › Método de login**, ative **Google**.
3. Em **Authentication › Configurações › Domínios autorizados**, adicione `www.ciframem.com.br` e `ciframem.com.br`.
4. Em **Criação › Firestore Database › Criar banco de dados**, escolha o local `southamerica-east1 (São Paulo)` e **modo de produção**.

## 2. Regras de segurança
1. Abra **Firestore › Regras**.
2. Apague o conteúdo e cole o arquivo `firestore.rules` desta pasta.
3. Troque `SEU_EMAIL@gmail.com` pelo seu e-mail Google e clique em **Publicar**.

## 3. Ligar a agenda ao projeto
1. Em **Visão geral do projeto › ⚙ Configurações do projeto › Seus apps**, clique no ícone **</>** (Web), dê um nome e registre (sem Hosting).
2. Copie o objeto `firebaseConfig` mostrado.
3. Cole em `firebase-config.js` no lugar de `null` e preencha `AGP_DONO` com o mesmo e-mail das regras.

Esses dados não são senhas: quem protege a agenda são as regras do passo 2.

## 4. Dar acesso às pessoas
Entre na agenda com seu e-mail (vira administrador automaticamente). Em **Agendas › Pessoas com acesso**:
- **Leitor**: só vê.
- **Editor**: lança e altera eventos nas agendas marcadas (ex.: só Pastoral da Música).
- **Administrador**: altera tudo, inclusive agendas e pessoas.

## 5. Trazer os eventos que já existem
No aparelho (ou na versão no Claude) onde estão os eventos: **Agendas › Backup › Salvar backup**.
Depois, já conectado como administrador na agenda compartilhada: **Restaurar backup**.
