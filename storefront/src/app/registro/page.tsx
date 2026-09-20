import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <h1 className="text-headline text-center text-[2rem]">Crear cuenta</h1>
      <RegisterForm />
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
