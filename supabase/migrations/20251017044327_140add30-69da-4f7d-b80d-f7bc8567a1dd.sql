-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create user_settings table for notification preferences
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notification_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Wednesday', 'Friday'],
  notification_time TEXT NOT NULL DEFAULT '10:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create shared_jars table
CREATE TABLE public.shared_jars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jar_name TEXT NOT NULL,
  jar_goal NUMERIC NOT NULL,
  jar_current NUMERIC NOT NULL DEFAULT 0,
  jar_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_jars ENABLE ROW LEVEL SECURITY;

-- Create jar_invitations table (must be created before shared_jars policies that reference it)
CREATE TABLE public.jar_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jar_id UUID NOT NULL REFERENCES public.shared_jars(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jar_invitations ENABLE ROW LEVEL SECURITY;

-- Now add shared_jars policies that can reference jar_invitations
CREATE POLICY "Users can view jars they own or are invited to"
  ON public.shared_jars FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.jar_invitations
      WHERE jar_id = shared_jars.id
      AND invitee_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own jars"
  ON public.shared_jars FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update jars they own or are invited to"
  ON public.shared_jars FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.jar_invitations
      WHERE jar_id = shared_jars.id
      AND invitee_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Owners can delete their jars"
  ON public.shared_jars FOR DELETE
  USING (auth.uid() = owner_id);

-- Add jar_invitations policies
CREATE POLICY "Users can view invitations they sent or received"
  ON public.jar_invitations FOR SELECT
  USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_id OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );

CREATE POLICY "Users can insert invitations for their jars"
  ON public.jar_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (SELECT 1 FROM public.shared_jars WHERE id = jar_id AND owner_id = auth.uid())
  );

CREATE POLICY "Invitees can update invitation status"
  ON public.jar_invitations FOR UPDATE
  USING (
    auth.uid() = invitee_id OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_shared_jars_updated_at
  BEFORE UPDATE ON public.shared_jars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jar_invitations_updated_at
  BEFORE UPDATE ON public.jar_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();