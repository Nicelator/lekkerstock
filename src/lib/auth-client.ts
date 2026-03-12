import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function signUp(email: string, password: string, name: string, role: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role }
    }
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function useSession() {
  return supabase.auth.getSession();
}