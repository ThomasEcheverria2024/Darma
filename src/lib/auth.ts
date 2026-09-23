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
    const { password: _, ...user } = matchedUser;
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

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("register_user", {
        p_id: crypto.randomUUID(),
        p_name: normalizedName,
        p_email: normalizedEmail,
        p_password: normalizedPassword,
      });

      if (!error) {
        return { user: data as AuthUser };
      }

      if (error.code && error.code !== "PGRST202" && !error.message?.includes("404")) {
        return { user: null, error: mapSupabaseAuthError(error) };
      }
    } catch {
      // Fall through to local fallback
    }
  }

  const users = getLocalUsers();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { user: null, error: "Ese email ya está registrado." };
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
  };

  saveLocalUsers([newUser, ...users]);

  const { password: _, ...user } = newUser;
  return { user };
}
