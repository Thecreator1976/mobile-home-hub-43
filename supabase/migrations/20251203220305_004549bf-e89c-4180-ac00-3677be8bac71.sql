-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to view receipts
CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);