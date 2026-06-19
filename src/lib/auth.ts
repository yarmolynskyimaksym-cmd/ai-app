// Місце для конфігурації авторизації
// Варіанти: NextAuth.js, Clerk, Auth0, Supabase Auth
//
// Приклад з NextAuth.js:
//   import NextAuth from "next-auth"
//   export const { handlers, signIn, signOut, auth } = NextAuth({ providers: [...] })
//
// Поки що — заглушка
export const getSession = async () => {
  return null; // замінити реальною реалізацією
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
};
