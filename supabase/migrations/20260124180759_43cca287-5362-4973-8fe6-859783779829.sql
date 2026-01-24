-- Update handle_new_user function to save country and currency
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  selected_role app_role;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- First user becomes admin, otherwise check metadata for role selection
  IF user_count = 0 THEN
    selected_role := 'admin';
  ELSE
    -- Get role from user metadata, default to 'user'
    selected_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'user'
    );
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  -- Create profile with country and currency
  INSERT INTO public.profiles (user_id, email, full_name, country, currency)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  );
  
  -- If farmer, create farmer profile
  IF selected_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (user_id, farm_name, location)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'farm_name', 'My Farm'), 'To be updated');
  END IF;
  
  RETURN NEW;
END;
$function$;