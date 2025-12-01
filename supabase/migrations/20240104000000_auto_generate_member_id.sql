-- Function to generate member ID in format: 0000-MOIS
-- Example: 0001-NOV, 0002-DEC, etc.
-- The number resets each month, and the month abbreviation is in French
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TRIGGER AS $$
DECLARE
  month_abbr TEXT;
  sequence_num INTEGER;
  new_member_id TEXT;
BEGIN
  -- Get month abbreviation in French
  month_abbr := CASE EXTRACT(MONTH FROM NOW())
    WHEN 1 THEN 'JAN'
    WHEN 2 THEN 'FEV'
    WHEN 3 THEN 'MAR'
    WHEN 4 THEN 'AVR'
    WHEN 5 THEN 'MAI'
    WHEN 6 THEN 'JUN'
    WHEN 7 THEN 'JUL'
    WHEN 8 THEN 'AOU'
    WHEN 9 THEN 'SEP'
    WHEN 10 THEN 'OCT'
    WHEN 11 THEN 'NOV'
    WHEN 12 THEN 'DEC'
  END;

  -- Get the next sequence number for this month
  -- Count existing members created in the same month
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(member_id FROM '^([0-9]+)') AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM public.members
  WHERE member_id LIKE '%-' || month_abbr
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  -- Format: 0000-MOIS (4 digits, zero-padded)
  new_member_id := LPAD(sequence_num::TEXT, 4, '0') || '-' || month_abbr;

  -- Set the member_id if not provided
  IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
    NEW.member_id := new_member_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate member_id before insert
DROP TRIGGER IF EXISTS auto_generate_member_id_trigger ON public.members;
CREATE TRIGGER auto_generate_member_id_trigger
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_member_id();

-- Add comment explaining the format
COMMENT ON FUNCTION public.generate_member_id() IS 
'Generates automatic member ID in format 0000-MOIS (e.g., 0001-NOV, 0002-DEC) based on creation month. The sequence resets each month.';


