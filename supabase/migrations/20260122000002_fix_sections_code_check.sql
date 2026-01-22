-- Ensure sections.code supports all wizard sections (1-5 and 3.1-3.7) plus intake

ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_code_check;

ALTER TABLE sections ADD CONSTRAINT sections_code_check
  CHECK (
    code IN (
      'intake',
      '1',
      '2',
      '3.1',
      '3.2',
      '3.3',
      '3.4',
      '3.5',
      '3.6',
      '3.7',
      '4',
      '5'
    )
  );
