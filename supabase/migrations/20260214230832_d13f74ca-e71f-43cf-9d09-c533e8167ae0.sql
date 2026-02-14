
-- 1.1 Nova coluna em etapas_funil para mapear etiqueta WhatsApp
ALTER TABLE etapas_funil
ADD COLUMN etiqueta_whatsapp varchar(255) DEFAULT NULL;

-- 1.2 Novas colunas em sessoes_whatsapp para config de etiquetas
ALTER TABLE sessoes_whatsapp
ADD COLUMN etiqueta_move_oportunidade boolean DEFAULT false,
ADD COLUMN etiqueta_comportamento_fechada varchar(20) DEFAULT 'criar_nova'
  CHECK (etiqueta_comportamento_fechada IN ('criar_nova', 'ignorar', 'criar_se_fechada'));
