import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-serif text-4xl">Crear cuenta</h1>
      <RegisterForm />
      <p className="text-sm text-ink/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
