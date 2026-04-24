import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="space-y-6">
      <AuthForm mode="register" />
    </main>
  );
}
