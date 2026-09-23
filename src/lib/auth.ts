import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

const USERS_STORAGE_KEY = "darma-auth-users";

type StoredUser = AuthUser & { password: string };

const defaultUsers: StoredUser[] = [
  { id: "demo-admin", name: "Administrador", email: "admin@darma.com", password: "darma123" },
];

function getLocalUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return defaultUsers;
  }

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }

    const parsed = JSON.parse(stored) as StoredUser[];
    return parsed.length ? parsed : defaultUsers;
  } catch {
    return defaultUsers;
  }
}

function saveLocalUsers(users: StoredUser[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

function mapSupabaseAuthError(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("ya está registrado")) {
    return "Ese email ya está registrado.";
  }

  if (message.includes("6 caracteres")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (message.includes("obligatorio")) {
    return "El nombre es obligatorio para crear un usuario.";
  }

  if (message.includes("PGRST202")) {
    return "No se encontró la función de registro en Supabase. Ejecutá la sección de usuarios de supabase/schema.sql en el SQL Editor.";
  }

  return "No se pudo completar la operación. Intentá de nuevo.";
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("login_user", {
        p_email: normalizedEmail,
        p_password: normalizedPassword,
      });

      if (!error) {
        if (data) {
          return { user: data as AuthUser };
        }
        return { user: null, error: "Credenciales inválidas. Revisá el email y la contraseña." };
      }

      // The login RPC returns null for invalid credentials. Other RPC errors mean
      // remote auth is unavailable, so allow the seeded/local demo account to work.
    } catch {
      // Fall through to local fallback
    }
  }

  const matchedUser = getLocalUsers().find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === normalizedPassword,
  );

  if (matchedUser) {
    const user: AuthUser = { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email };
    return { user };
  }

  return { user: null, error: "Credenciales inválidas. Revisá el email y la contraseña." };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error?: string }> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedName) {
    return { user: null, error: "El nombre es obligatorio para crear un usuario." };
  }

  if (!normalizedEmail) {
    return { user: null, error: "Ingresá un email válido." };
  }

  if (normalizedPassword.length < 6) {
    return { user: null, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (!supabase) {
    return {
      user: null,
      error: "Supabase no está configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para crear cuentas persistentes.",
    };
  }

  try {
    const { data, error } = await supabase.rpc("register_user", {
      p_id: crypto.randomUUID(),
      p_name: normalizedName,
      p_email: normalizedEmail,
      p_password: normalizedPassword,
    });

    if (error) {
      if (error.code === "PGRST202") {
        return {
          user: null,
          error: "No se encontró la función register_user en Supabase. Ejecutá la sección de usuarios de supabase/schema.sql en el SQL Editor.",
        };
      }
      return { user: null, error: mapSupabaseAuthError(error) };
    }

    if (!data) {
      return { user: null, error: "Supabase no devolvió los datos de la cuenta creada." };
    }

    return { user: data as AuthUser };
  } catch {
    return {
      user: null,
      error: "No se pudo conectar con Supabase. Revisá la URL y la clave pública configuradas.",
    };
  }
}
