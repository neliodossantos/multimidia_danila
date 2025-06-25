
# ISPMedia Server

Servidor backend para o sistema ISPMedia - Uma plataforma de gestão e partilha de conteúdos multimédia.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de dados relacional
- **Socket.IO** - Comunicação em tempo real
- **JWT** - Autenticação
- **Multer** - Upload de ficheiros
- **bcryptjs** - Hash de passwords

## Pré-requisitos

- Node.js (versão 16 ou superior)
- MySQL (versão 8.0 ou superior)
- npm ou yarn

## Instalação

1. Clone o repositório e navegue para a pasta do servidor:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o ficheiro `.env` com as suas configurações.

4. Configure a base de dados MySQL:
- Crie uma base de dados chamada `ispmedia`
- Execute o script de inicialização:
```bash
npm run init-db
```

5. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Estrutura do Projeto

```
server/
├── config/
│   └── database.js          # Configuração da base de dados
├── middleware/
│   └── auth.js              # Middleware de autenticação
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── users.js             # Gestão de utilizadores
│   ├── artists.js           # Gestão de artistas
│   ├── albums.js            # Gestão de álbuns
│   ├── music.js             # Gestão de músicas
│   ├── videos.js            # Gestão de vídeos
│   ├── reviews.js           # Sistema de críticas
│   ├── files.js             # Upload/download de ficheiros
│   ├── groups.js            # Grupos de amigos
│   └── notifications.js     # Sistema de notificações
├── scripts/
│   └── initDatabase.js      # Script de inicialização da BD
├── utils/
│   └── socketManager.js     # Gestão de WebSockets
├── uploads/                 # Ficheiros enviados pelos utilizadores
├── app.js                   # Aplicação principal
└── package.json
```

## APIs Disponíveis

### Autenticação
- `POST /api/auth/register` - Registar utilizador
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Utilizadores
- `GET /api/users` - Listar utilizadores (editor+)
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil
- `POST /api/users/:id/promote` - Promover a editor

### Artistas
- `GET /api/artists` - Listar artistas
- `GET /api/artists/:id` - Obter artista
- `POST /api/artists` - Criar artista (editor+)
- `PUT /api/artists/:id` - Atualizar artista (editor+)
- `DELETE /api/artists/:id` - Eliminar artista (editor+)

### Álbuns
- `GET /api/albums` - Listar álbuns
- `GET /api/albums/:id` - Obter álbum
- `POST /api/albums` - Criar álbum (editor+)
- `PUT /api/albums/:id` - Atualizar álbum (editor+)
- `DELETE /api/albums/:id` - Eliminar álbum (editor+)

### Ficheiros
- `POST /api/files/upload` - Upload de ficheiro
- `GET /api/files/:id/download` - Download de ficheiro
- `POST /api/files/:id/share` - Partilhar ficheiro

## Funcionalidades Implementadas

✅ **Sistema de Autenticação**
- Registo e login de utilizadores
- Proteção JWT
- Roles (utilizador, editor, admin)

✅ **Gestão de Conteúdo**
- CRUD para artistas, álbuns, músicas, vídeos
- Sistema de permissões para editores

✅ **Sistema de Pesquisa**
- Pesquisa por artistas, álbuns, músicas
- Filtros por género, país, etc.

✅ **Sistema de Críticas**
- Utilizadores podem avaliar álbuns
- Cálculo de pontuação média

✅ **Upload/Download de Ficheiros**
- Suporte para MP3, MP4, FLAC, etc.
- Partilha entre utilizadores

✅ **Notificações em Tempo Real**
- WebSockets para notificações instantâneas
- Notificações offline guardadas na BD

✅ **Grupos de Amigos**
- Criação e gestão de grupos
- Sistema de convites e aprovações

## Configuração de Produção

1. Configure variáveis de ambiente adequadas para produção
2. Use um process manager como PM2:
```bash
npm install -g pm2
pm2 start app.js --name ispmedia-server
```

3. Configure um proxy reverso (nginx) para servir ficheiros estáticos
4. Configure SSL/HTTPS
5. Configure backup automático da base de dados

## Segurança

- Todas as passwords são hasheadas com bcrypt
- Autenticação via JWT
- Rate limiting implementado
- Helmet.js para cabeçalhos de segurança
- Validação de entrada com express-validator
- CORS configurado adequadamente

## Suporte

Para questões ou problemas, contacte a equipa de desenvolvimento.
