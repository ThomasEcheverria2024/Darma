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

      if (!error && data) {
        return { user: data as AuthUser };
      }
    } catch {
      // Ignorar error de llamada y pasar al fallback local
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

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("register_user", {
        p_id: crypto.randomUUID(),
        p_name: normalizedName,
        p_email: normalizedEmail,
        p_password: normalizedPassword,
      });

      if (!error && data) {
        return { user: data as AuthUser };
      }
    } catch {
      // Fallback local
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

  const user: AuthUser = { id: newUser.id, name: newUser.name, email: newUser.email };
  return { user };
}
