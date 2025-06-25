const mysql = require('mysql2/promise');
require('dotenv').config();

const createAndPopulateDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Criar base de dados se não existir
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ispmedia'}`);
    console.log('✅ Base de dados criada com sucesso!');
    
    await connection.query(`USE ${process.env.DB_NAME || 'ispmedia'}`);

    // ==================== CRIAÇÃO DAS TABELAS ====================
    
    // Tabela de utilizadores
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        is_editor BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabela de artistas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS artists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        biography TEXT,
        genre VARCHAR(50),
        country VARCHAR(50),
        formed_year INT,
        image_url VARCHAR(255),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Tabela de álbuns
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        artist_id INT NOT NULL,
        genre VARCHAR(50),
        release_date DATE,
        cover_url VARCHAR(255),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Tabela de músicas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        album_id INT,
        artist_id INT NOT NULL,
        duration INT, -- em segundos
        track_number INT,
        lyrics TEXT,
        composer VARCHAR(100),
        file_url VARCHAR(255),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Tabela de vídeos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        artist_id INT,
        duration INT, -- em segundos
        video_url VARCHAR(255),
        thumbnail_url VARCHAR(255),
        genre VARCHAR(50),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Tabela de reviews
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        album_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_review (album_id, user_id)
      )
    `);

    // Tabela de ficheiros partilhados
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shared_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        music_id INT,
        video_id INT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE SET NULL,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
      )
    `);

    // Tabela de partilha de ficheiros entre utilizadores
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS file_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        shared_with_user_id INT NOT NULL,
        shared_by_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES shared_files(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_share (file_id, shared_with_user_id)
      )
    `);

    // Tabela de grupos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS groups_friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabela de membros dos grupos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        is_owner BOOLEAN DEFAULT FALSE,
        is_editor BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups_friends(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_membership (group_id, user_id)
      )
    `);

    // Tabela de notificações
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('editor_promotion', 'content_update', 'group_invitation', 'file_share') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabela de playlists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        user_id INT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabela de músicas nas playlists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS playlist_music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        music_id INT NOT NULL,
        position INT DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        UNIQUE KEY unique_playlist_music (playlist_id, music_id)
      )
    `);

    console.log('✅ Todas as tabelas foram criadas com sucesso!');

    // ==================== POPULAÇÃO COM DADOS INICIAIS ====================

    // Verificar se já existem dados
    const [userCheck] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if (userCheck[0].count === 0) {
      console.log('📝 Inserindo dados iniciais...');

      // Inserir utilizadores (senha: 123456 - hash bcrypt)
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);

      await connection.execute(`
        INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_editor) VALUES
        ('admin', 'admin@ispmedia.com', ?, 'Administrador', 'Sistema', TRUE, TRUE),
        ('editor1', 'editor@ispmedia.com', ?, 'Editor', 'Chefe', FALSE, TRUE),
        ('joao_silva', 'joao@email.com', ?, 'João', 'Silva', FALSE, FALSE),
        ('maria_santos', 'maria@email.com', ?, 'Maria', 'Santos', FALSE, FALSE),
        ('carlos_costa', 'carlos@email.com', ?, 'Carlos', 'Costa', FALSE, FALSE)
      `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

      // Inserir artistas angolanos e internacionais
      await connection.execute(`
        INSERT INTO artists (name, biography, genre, country, formed_year, created_by) VALUES
        ('Paulo Flores', 'Cantor e compositor angolano, conhecido pelas suas baladas românticas e semba.', 'Semba/Kizomba', 'Angola', 1980, 1),
        ('Bonga', 'Lenda da música angolana, pioneiro do semba moderno e ativista cultural.', 'Semba/Folk', 'Angola', 1970, 1),
        ('C4 Pedro', 'Artista angolano de kizomba e zouk, conhecido internacionalmente.', 'Kizomba/Zouk', 'Angola', 2010, 1),
        ('Anselmo Ralph', 'Cantor de R&B e kizomba, um dos maiores nomes da música angolana contemporânea.', 'R&B/Kizomba', 'Angola', 2005, 1),
        ('Yuri da Cunha', 'Cantor angolano de semba e kizomba, filho do lendário Bonga.', 'Semba/Kizomba', 'Angola', 2008, 1),
        ('The Beatles', 'Banda britânica que revolucionou a música popular mundial.', 'Rock/Pop', 'Reino Unido', 1960, 1),
        ('Bob Marley', 'Lenda do reggae jamaicano e ícone da música mundial.', 'Reggae', 'Jamaica', 1963, 1),
        ('Michael Jackson', 'Rei do Pop, um dos artistas mais influentes da história da música.', 'Pop/R&B', 'Estados Unidos', 1971, 1)
      `);

      // Inserir álbuns
      await connection.execute(`
        INSERT INTO albums (title, description, artist_id, genre, release_date, created_by) VALUES
        ('Semba & Kizomba', 'Coletânea dos maiores sucessos de Paulo Flores', 1, 'Semba/Kizomba', '2020-05-15', 1),
        ('Angola 74', 'Álbum histórico de Bonga sobre a independência de Angola', 2, 'Semba/Folk', '1974-11-11', 1),
        ('King Ckwa', 'Álbum de estreia internacional de C4 Pedro', 3, 'Kizomba/Zouk', '2018-03-20', 1),
        ('Histórias de Amor', 'Coletânea romântica de Anselmo Ralph', 4, 'R&B/Kizomba', '2019-02-14', 1),
        ('Abbey Road', 'Último álbum gravado pelos Beatles', 6, 'Rock', '1969-09-26', 1),
        ('Legend', 'Coletânea dos maiores sucessos de Bob Marley', 7, 'Reggae', '1984-05-08', 1),
        ('Thriller', 'Álbum mais vendido de Michael Jackson', 8, 'Pop', '1982-11-30', 1)
      `);

      // Inserir músicas
      await connection.execute(`
        INSERT INTO music (title, album_id, artist_id, duration, track_number, composer, created_by) VALUES
        ('Ngola', 1, 1, 245, 1, 'Paulo Flores', 1),
        ('Semba na Rua', 1, 1, 198, 2, 'Paulo Flores', 1),
        ('Mona Ki Ngi Xica', 2, 2, 312, 1, 'Bonga', 1),
        ('Sodade', 2, 2, 267, 2, 'Bonga', 1),
        ('African Beauty', 3, 3, 223, 1, 'C4 Pedro', 1),
        ('Vamos Ficar Por Aqui', 3, 3, 201, 2, 'C4 Pedro', 1),
        ('Não Me Toca', 4, 4, 234, 1, 'Anselmo Ralph', 1),
        ('Curtir a Vida', 4, 4, 276, 2, 'Anselmo Ralph', 1),
        ('Come Together', 5, 6, 259, 1, 'Lennon-McCartney', 1),
        ('Something', 5, 6, 183, 2, 'George Harrison', 1),
        ('No Woman No Cry', 6, 7, 427, 1, 'Bob Marley', 1),
        ('Three Little Birds', 6, 7, 180, 2, 'Bob Marley', 1),
        ('Billie Jean', 7, 8, 294, 1, 'Michael Jackson', 1),
        ('Beat It', 7, 8, 258, 2, 'Michael Jackson', 1)
      `);

      // Inserir vídeos
      await connection.execute(`
        INSERT INTO videos (title, description, artist_id, duration, genre, created_by) VALUES
        ('Paulo Flores - Ngola (Video Oficial)', 'Videoclipe oficial da música Ngola', 1, 245, 'Semba', 1),
        ('Bonga - Mona Ki Ngi Xica (Live)', 'Performance ao vivo histórica', 2, 312, 'Semba', 1),
        ('C4 Pedro - African Beauty', 'Videoclipe oficial', 3, 223, 'Kizomba', 1),
        ('Anselmo Ralph - Não Me Toca', 'Videoclipe romântico', 4, 234, 'R&B', 1),
        ('The Beatles - Come Together', 'Videoclipe clássico', 6, 259, 'Rock', 1)
      `);

      // Inserir grupo público padrão
      await connection.execute(`
        INSERT IGNORE INTO groups_friends (id, name, description, created_by, is_public) 
        VALUES (1, 'Público', 'Grupo público padrão para todos os utilizadores', 1, TRUE)
      `);

      // Adicionar todos os utilizadores ao grupo público
      await connection.execute(`
        INSERT INTO group_members (group_id, user_id, status) VALUES
        (1, 1, 'approved'),
        (1, 2, 'approved'),
        (1, 3, 'approved'),
        (1, 4, 'approved'),
        (1, 5, 'approved')
      `);

      // Criar algumas playlists
      await connection.execute(`
        INSERT INTO playlists (name, description, user_id, is_public) VALUES
        ('Música Angolana', 'Os melhores da música angolana', 3, TRUE),
        ('Clássicos Internacionais', 'Sucessos atemporais da música mundial', 4, TRUE),
        ('Kizomba & Semba', 'Para dançar e relaxar', 5, FALSE)
      `);

      // Adicionar músicas às playlists
      await connection.execute(`
        INSERT INTO playlist_music (playlist_id, music_id, position) VALUES
        (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 7, 5), (1, 8, 6),
        (2, 9, 1), (2, 10, 2), (2, 11, 3), (2, 12, 4), (2, 13, 5), (2, 14, 6),
        (3, 1, 1), (3, 5, 2), (3, 6, 3), (3, 7, 4)
      `);

      // Inserir algumas reviews
      await connection.execute(`
        INSERT INTO reviews (album_id, user_id, rating, comment) VALUES
        (1, 3, 5, 'Excelente álbum! Paulo Flores é um mestre da música angolana.'),
        (1, 4, 4, 'Muito bom, traz muitas memórias da minha juventude.'),
        (2, 3, 5, 'Bonga é uma lenda! Este álbum é histórico para Angola.'),
        (3, 4, 4, 'C4 Pedro tem uma voz incrível, gosto muito do estilo dele.'),
        (5, 5, 5, 'Abbey Road é simplesmente perfeito! Os Beatles são únicos.'),
        (7, 3, 5, 'Thriller é o melhor álbum de todos os tempos!')
      `);

      console.log('✅ Dados iniciais inseridos com sucesso!');
      console.log('');
      console.log('👤 Utilizadores criados:');
      console.log('   - admin@ispmedia.com (senha: 123456) - Administrador');
      console.log('   - editor@ispmedia.com (senha: 123456) - Editor');
      console.log('   - joao@email.com (senha: 123456) - Utilizador');
      console.log('   - maria@email.com (senha: 123456) - Utilizador');
      console.log('   - carlos@email.com (senha: 123456) - Utilizador');
      console.log('');
      console.log('🎵 Artistas: Paulo Flores, Bonga, C4 Pedro, Anselmo Ralph, Yuri da Cunha, The Beatles, Bob Marley, Michael Jackson');
      console.log('💿 Álbuns: 7 álbuns com suas respetivas músicas');
      console.log('🎬 Vídeos: 5 vídeos de exemplo');
      console.log('📝 Playlists: 3 playlists com músicas');
      console.log('⭐ Reviews: 6 avaliações de álbuns');
      
    } else {
      console.log('ℹ️  Dados já existem na base de dados. Pulando inserção inicial.');
    }

    console.log('');
    console.log('🎉 Base de dados ISPMedia configurada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar base de dados:', error);
  } finally {
    await connection.end();
  }
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  createAndPopulateDatabase();
}

module.exports = createAndPopulateDatabase;