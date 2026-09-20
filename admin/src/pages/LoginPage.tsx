import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user?.role === 'admin') {
    return <Navigate to="/productos" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await login(
        String(form.get('email') ?? ''),
        String(form.get('password') ?? ''),
      );
      navigate('/productos', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card stack">
        <p className="kicker">Panel</p>
        <h1>Entrar como admin</h1>
        <p className="muted">
          Usa una cuenta con rol <code>admin</code>. El JWT se guarda en
          sessionStorage.
        </p>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
