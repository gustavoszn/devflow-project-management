import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <span>DevFlow</span>
        </div>

        <nav className="nav">
          <NavLink className="nav-link" to="/">Dashboard</NavLink>
          <NavLink className="nav-link" to="/projects">Projetos</NavLink>
          <NavLink className="nav-link" to="/tasks">Tarefas</NavLink>
        </nav>

        <div className="card" style={{ padding: '16px', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Conectado</div>
          <div style={{ marginTop: '8px', fontWeight: 700 }}>{user?.name}</div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '14px' }} onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
