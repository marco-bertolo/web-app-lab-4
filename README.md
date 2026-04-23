# 🍪 Lofi & Cookies Dashboard

Um dashboard fofinho em estilo *lofi* que mostra métricas do sistema (hostname, plataforma, CPU, memória) com uma estética de pote de cookies. Feito com **Node.js + Express + EJS** e pronto para fazer deploy no **Azure App Service**.

## ✨ Funcionalidades

- Informação em tempo real do sistema via módulo `os`
- "Percentagem de Cookies Assados" (memória em uso)
- Indicador de humor do CPU: 🍪 **Cookie Feliz** (baixo uso) ou 🫠 **Cookie a Derreter** (uso alto)
- Animação de vapor a sair do pote de cookies
- Tipografia *cozy* com Google Fonts (`Fredoka` + `Varela Round`)

## 🚀 Correr Localmente

```bash
npm install
npm start
```

A app arranca em `http://localhost:8080`.

## ☁️ Deploy no Azure App Service (via GitHub)

### 1. Criar o App Service

1. Entra no [Portal do Azure](https://portal.azure.com).
2. Clica em **Create a resource** → **Web App**.
3. Preenche:
   - **Resource Group**: cria um novo ou usa existente
   - **Name**: ex. `lofi-cookies-dashboard`
   - **Runtime stack**: `Node 20 LTS` (ou superior)
   - **Operating System**: `Linux` (recomendado)
   - **Region**: a mais próxima de ti
   - **Pricing plan**: `F1 (Free)` para testes
4. Clica em **Review + create** → **Create**.

### 2. Conectar o GitHub ao Deployment Center

1. Na página do App Service, no menu lateral, vai a **Deployment** → **Deployment Center**.
2. Em **Source**, seleciona **GitHub**.
3. Autoriza o Azure a aceder à tua conta GitHub (se ainda não o fizeste).
4. Escolhe:
   - **Organization**: `marco-bertolo`
   - **Repository**: `web-app-lab-4`
   - **Branch**: `main`
5. Em **Build provider**, seleciona **GitHub Actions** (o Azure gera automaticamente um workflow `.github/workflows/*.yml`).
6. Clica em **Save**.

O Azure faz commit do workflow no teu repositório e dispara o primeiro deploy.

### 3. Verificar o Deploy

- Vai ao separador **Logs** dentro do Deployment Center para acompanhar o build.
- Quando terminar, clica em **Browse** no topo da página do App Service.
- O teu dashboard está vivo! 🎉

## 🔑 Notas Importantes

- O `app.js` usa `process.env.PORT || 8080`, que é **obrigatório** para o Azure detetar a porta correta.
- O script `start` no `package.json` (`node app.js`) é o comando que o Azure vai executar automaticamente.
- Não precisas de `web.config` nem `Procfile` — o Oryx (build system do Azure) trata de tudo.

## 📁 Estrutura

```
web-app-lab-4/
├── app.js              # Servidor Express + lógica do módulo os
├── package.json        # Dependências + script start
├── views/
│   └── index.ejs       # Template do dashboard
├── public/
│   └── style.css       # Estilos lofi (pastel, rounded, fofo)
└── README.md
```
