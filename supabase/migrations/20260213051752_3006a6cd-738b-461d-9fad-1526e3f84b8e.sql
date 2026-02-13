-- Fix existing contact message that was incorrectly stored as 'text'
UPDATE mensagens 
SET 
  tipo = 'contact', 
  vcard = raw_data->'vCards'->>0,
  body = 'Contato: Açai Boom'
WHERE id = 'facfefbe-ff03-4e25-a096-a018694d4423'
  AND tipo = 'text';