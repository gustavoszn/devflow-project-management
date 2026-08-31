import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import apiRequest from '../services/api';

const COLORS = ['#8b5cf6', '#2563eb', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest('/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="card section-card">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const summary = data?.summary || { activeProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0 };
  const tasksByStatus = data?.tasksByStatus || [];

  return (
    <>
      <div className="page-header">
        <div>
          <p className="muted" style={{ margin: 0 }}>Resumo da operação</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
      </div>

      <div className="summary-grid">
        <div className="card summary-card">
          <div className="summary-label">Projetos ativos</div>
          <div className="summary-value">{summary.activeProjects}</div>
          <div className="summary-trend">Em execução</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">Total de tarefas</div>
          <div className="summary-value">{summary.totalTasks}</div>
          <div className="summary-trend">No backlog geral</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">Concluídas</div>
          <div className="summary-value">{summary.completedTasks}</div>
          <div className="summary-trend">Já entregues</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">Pendentes</div>
          <div className="summary-value">{summary.pendingTasks}</div>
          <div className="summary-trend">{summary.overdueTasks} atrasadas</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card chart-panel">
          <h3>Distribuição por status</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-panel">
          <h3>Fluxo de tarefas</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={tasksByStatus} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
