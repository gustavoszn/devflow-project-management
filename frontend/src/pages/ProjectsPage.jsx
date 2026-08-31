import { useEffect, useState } from 'react';
import apiRequest from '../services/api';

const emptyForm = {
  name: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  status: 'active',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadProjects() {
    try {
      const response = await apiRequest('/projects');
      setProjects(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await apiRequest(`/projects/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/projects', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir este projeto?')) return;
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(project) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description || '',
      startDate: project.start_date,
      dueDate: project.due_date || '',
      status: project.status,
    });
  }

  if (loading) {
    return <div className="card section-card">Carregando projetos...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="muted" style={{ margin: 0 }}>Portfolio de entregas</p>
          <h1 className="page-title">Projetos</h1>
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: '18px' }}>{error}</div>}

      <div className="card section-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Nome do projeto</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Data inicial</span>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </label>
            <label className="field">
              <span>Prazo</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="on_hold">Em espera</option>
                <option value="completed">Concluído</option>
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: '16px' }}>
            <span>Descrição</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button className="btn btn-primary" type="submit">{editingId ? 'Salvar projeto' : 'Adicionar projeto'}</button>
            {editingId && <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card section-card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Progresso</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="5"><div className="empty-state">Nenhum projeto cadastrado.</div></td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.name}</strong>
                      <div className="muted">{project.description || 'Sem descrição'}</div>
                    </td>
                    <td><span className="badge active">{project.status === 'active' ? 'Ativo' : project.status === 'on_hold' ? 'Em espera' : 'Concluído'}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ width: '130px', display: 'inline-block' }}>
                          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                        <span>{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td>{project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" type="button" onClick={() => startEdit(project)}>Editar</button>
                        <button className="btn btn-danger" type="button" onClick={() => handleDelete(project.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
