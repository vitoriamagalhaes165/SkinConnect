CREATE DATABASE IF NOT EXISTS skinconnect_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skinconnect_v2;

CREATE TABLE IF NOT EXISTS Clinicas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,            
  responsavel   VARCHAR(150) NOT NULL,           
  telefone      VARCHAR(30)  NULL,
  cidade        VARCHAR(100) NULL,
  especialidade VARCHAR(100) NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(100) NULL,              
  codigo        CHAR(8) NOT NULL UNIQUE,         
  criado_em     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Pacientes (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id       INT UNSIGNED NULL,             
  nome             VARCHAR(150) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE, 
  telefone         VARCHAR(30) NULL,
  data_nascimento  DATE NULL,
  tipo_pele        ENUM('normal','seca','oleosa','mista','sensivel') NULL,
  observacoes      TEXT NULL,
  senha_hash       VARCHAR(100) NULL,            
  conta_vinculada  TINYINT(1) NOT NULL DEFAULT 0, 
  criado_em        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pac_clinica FOREIGN KEY (clinica_id) REFERENCES Clinicas(id) ON DELETE SET NULL,
  INDEX idx_pac_clinica (clinica_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Planos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id   INT UNSIGNED NOT NULL,
  paciente_id  INT UNSIGNED NOT NULL,
  titulo       VARCHAR(150) NOT NULL,
  objetivo     VARCHAR(200) NULL,
  descricao    TEXT NULL,
  data_inicio  DATE NOT NULL,
  data_fim     DATE NULL,
  ativo        TINYINT(1) NOT NULL DEFAULT 1,
  criado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plano_clinica  FOREIGN KEY (clinica_id)  REFERENCES Clinicas(id)  ON DELETE CASCADE,
  CONSTRAINT fk_plano_paciente FOREIGN KEY (paciente_id) REFERENCES Pacientes(id) ON DELETE CASCADE,
  INDEX idx_plano_paciente (paciente_id, ativo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Rotinas (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plano_id   INT UNSIGNED NOT NULL,
  titulo     VARCHAR(150) NOT NULL,
  produto    VARCHAR(150) NULL,
  instrucoes VARCHAR(500) NULL,
  horario    TIME NOT NULL,                       
  CONSTRAINT fk_rotina_plano FOREIGN KEY (plano_id) REFERENCES Planos(id) ON DELETE CASCADE,
  INDEX idx_rotina_plano (plano_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Execucoes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rotina_id     INT UNSIGNED NOT NULL,
  paciente_id   INT UNSIGNED NOT NULL,
  data          DATE NOT NULL,
  concluida_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exec_rotina   FOREIGN KEY (rotina_id)   REFERENCES Rotinas(id)   ON DELETE CASCADE,
  CONSTRAINT fk_exec_paciente FOREIGN KEY (paciente_id) REFERENCES Pacientes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_exec_rotina_dia (rotina_id, data),
  INDEX idx_exec_paciente_data (paciente_id, data)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Fotos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id  INT UNSIGNED NOT NULL,
  caminho      VARCHAR(120) NOT NULL,
  descricao    VARCHAR(200) NULL,
  tipo         ENUM('antes','evolucao','depois') NOT NULL DEFAULT 'evolucao',
  criado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_foto_paciente FOREIGN KEY (paciente_id) REFERENCES Pacientes(id) ON DELETE CASCADE,
  INDEX idx_foto_paciente (paciente_id, criado_em)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS RedefinicoesSenha (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perfil      ENUM('clinica','paciente') NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL UNIQUE,           
  expira_em   DATETIME NOT NULL,
  usado       TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;
