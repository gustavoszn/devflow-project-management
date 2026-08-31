import { useEffect, useState } from 'react';
import apiRequest from '../services/api';

const statusOrder = ['backlog', 'in_progress', 'in_review', 'done'];
const columns = {
  backlog: 'Backlog',
  in_progress: 'Em andamento',
  in_review: 'Em revisão',
  done: 'Concluído',
};

const emptyForm = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  status: 'backlog',
  priority: 'medium',
  dueDate: '',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ projectId: '', status: '', priority: '', assigneeId: '', search: '' });

  async function loadData() {
    try {
      const [taskResponse, projectResponse] = await Promise.all([
        apiRequest(`/tasks?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) }).toString()}`),
        apiRequest('/projects'),
      ]);
      setTasks(taskResponse.data || []);
      setProjects(projectResponse.data || []);
      const userList = Array.from(
        new Map((projectResponse.data || []).flatMap((project) => project.members || []).map((user) => [user.id, user])).values()
      );
      setUsers(userList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filters]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, projectId: Number(form.projectId) };
      if (editingId) {
        await apiRequest(`/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir esta tarefa?')) return;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDrop(status, taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: task.title,
        description: task.description || '',
        status,
        priority: task.priority,
        assigneeId: task.assignee_id || null,
        dueDate: task.due_date || null,
      }),
    })
      .then(() => loadData())
      .catch((err) => setError(err.message));
  }

  function startEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || '',
      projectId: task.project_id,
      assigneeId: task.assignee_id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || '',
    });
  }

  const groupedTasks = statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  if (loading) {
    return <div className="card section-card">Carregando tarefas...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="muted" style={{ margin: 0 }}>Fluxo de trabalho</p>
          <h1 className="page-title">Kanban</h1>
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: '18px' }}>{error}</div>}

      <div className="card section-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Título</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="field">
              <span>Projeto</span>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                <option value="">Selecione</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Responsável</span>
              <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Sem responsável</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="backlog">Backlog</option>
                <option value="in_progress">Em andamento</option>
                <option value="in_review">Em revisão</option>
                <option value="done">Concluído</option>
              </select>
            </label>
            <label className="field">
              <span>Prioridade</span>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label className="field">
              <span>Prazo</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </label>
          </div>
          <label className="field" style={{ marginTop: '16px' }}>
            <span>Descrição</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit">{editingId ? 'Salvar tarefa' : 'Adicionar tarefa'}</button>
            {editingId && <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card section-card" style={{ marginBottom: '20px' }}>
        <div className="filters">
          <input placeholder="Buscar tarefa" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
            <option value="">Projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Status</option>
            {Object.entries(columns).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">Prioridade</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="kanban">
        {statusOrder.map((status) => (
          <div className="card kanban-column" key={status} onDragOver={(e) => e.preventDefault()} onDrop={(event) => {
            event.preventDefault();
            const taskId = Number(event.dataTransfer.getData('text/plain'));
            if (taskId) handleDrop(status, taskId);
          }}>
            <h3>{columns[status]}</h3>
            {groupedTasks[status]?.length === 0 ? (
              <div className="empty-state">Sem tarefas</div>
            ) : (
              groupedTasks[status].map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', String(task.id))}
                >
                  <h4>{task.title}</h4>
                  <div className="muted" style={{ marginBottom: '10px' }}>{task.project_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <span className={`badge ${task.priority}`}>{task.priority}</span>
                    <span className={`badge ${task.status}`}>{columns[task.status]}</span>
                  </div>
                  <div className="muted">Responsável: {task.assignee_name || 'Não atribuído'}</div>
                  <div className="muted">Prazo: {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => startEdit(task)}>Editar</button>
                    <button className="btn btn-danger" type="button" onClick={() => handleDelete(task.id)}>Excluir</button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </>
  );
}
