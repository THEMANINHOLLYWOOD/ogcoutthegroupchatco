-- Allow authenticated users to search other profiles (for adding travelers)
CREATE POLICY "Authenticated users can search profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);