-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Agents can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND is_admin_or_agent(auth.uid())
);

CREATE POLICY "Agents can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND is_admin_or_agent(auth.uid())
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'admin')
);