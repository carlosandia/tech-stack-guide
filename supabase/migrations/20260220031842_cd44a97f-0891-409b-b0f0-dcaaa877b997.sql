ALTER TABLE paginas_meta
ADD CONSTRAINT paginas_meta_org_page_unique UNIQUE (organizacao_id, page_id);