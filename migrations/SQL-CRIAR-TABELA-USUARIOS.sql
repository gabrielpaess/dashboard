-- Criar tabela de usuários para sistema de login
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nivel VARCHAR(50) NOT NULL CHECK (nivel IN ('admin', 'vendas', 'desenvolvimento', 'producao')),
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_nivel ON usuarios(nivel);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Comentários da tabela
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema com níveis de acesso';
COMMENT ON COLUMN usuarios.email IS 'Email único do usuário';
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash da senha criptografada com bcrypt';
COMMENT ON COLUMN usuarios.nivel IS 'Nível de acesso: admin, vendas, desenvolvimento, producao';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.ativo IS 'Status ativo/inativo do usuário';
