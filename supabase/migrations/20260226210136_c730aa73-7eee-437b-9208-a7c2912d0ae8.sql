-- Corrigir pré-oportunidade com LID 64188537950415 para telefone real
UPDATE pre_oportunidades
SET phone_number = '5513978014584',
    phone_name = 'Eletrikus Pós Venda'
WHERE id = 'a0e4ce36-5f1e-4a68-bc0a-4a98c44eae7b'
  AND phone_number = '64188537950415';
