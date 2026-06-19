// Замінити на реальну форму логіну (NextAuth signIn, Clerk <SignIn />, etc.)
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded-2xl p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Увійти</h1>
        <p className="text-sm text-gray-400 text-center">
          Підключи провайдера авторизації: NextAuth, Clerk або Auth0
        </p>
      </div>
    </div>
  );
}
