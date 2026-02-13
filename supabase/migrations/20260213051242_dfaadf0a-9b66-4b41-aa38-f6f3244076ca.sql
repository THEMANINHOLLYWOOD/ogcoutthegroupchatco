
-- Create a security definer function to check friendship status (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_friend_of(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND addressee_id = target_user_id)
      OR (addressee_id = auth.uid() AND requester_id = target_user_id)
    )
  )
$$;

-- Allow friends to view visited cities
CREATE POLICY "Users can view friends visited cities"
ON visited_cities FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_friend_of(user_id)
);

-- Allow friends to view visited states
CREATE POLICY "Users can view friends visited states"
ON visited_states FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_friend_of(user_id)
);

-- Allow friends to view visited countries
CREATE POLICY "Users can view friends visited countries"
ON visited_countries FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_friend_of(user_id)
);
