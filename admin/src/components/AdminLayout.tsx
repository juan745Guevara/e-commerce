import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/productos" className="brand">
          Atelier
        </NavLink>
        <nav className="nav">
          <NavLink to="/productos">Productos</NavLink>
          <NavLink to="/pedidos">Pedidos</NavLink>
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
