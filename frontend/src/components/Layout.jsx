import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, BriefcaseBusiness, ChevronDown, ClipboardList, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="corporate-header">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label="Nexora — início">
            <span className="brand-mark">N</span>
            <span className="brand-copy"><strong>Nexora</strong><small>Enterprise Operations</small></span>
          </NavLink>

          <nav className={`nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
            <NavLink className="nav-link" to="/" onClick={() => setMenuOpen(false)}>Central de trabalho</NavLink>
            <NavLink className="nav-link" to="/projects" onClick={() => setMenuOpen(false)}><BriefcaseBusiness size={16} /> Operações</NavLink>
            <NavLink className="nav-link" to="/tasks" onClick={() => setMenuOpen(false)}><ClipboardList size={16} /> Registros</NavLink>
          </nav>

          <div className="header-actions">
            <label className="global-search">
              <Search size={17} />
              <input aria-label="Pesquisa global" placeholder="Pesquisar na Nexora" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-btn" type="button" aria-label="Notificações" data-tooltip="Notificações"><Bell size={18} /><span className="notification-dot" /></button>
            <button className="profile-trigger" type="button">
              <span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="profile-copy"><strong>{user?.name}</strong><small>Administrador</small></span>
              <ChevronDown size={15} />
            </button>
            <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      <div className="workspace-bar">
        <div className="workspace-inner">
          <span>Ambiente principal</span><span className="environment-status"><i /> Operação normal</span>
          <div className="workspace-actions"><button type="button"><Settings size={15} /> Configurações</button><button type="button" onClick={logout}><LogOut size={15} /> Sair</button></div>
        </div>
      </div>

      <main className="content"><div className="container page-enter">{children}</div></main>
    </div>
  );
}
