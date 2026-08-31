import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleAlert, Clock3, FileText, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiRequest from '../services/api';

function Skeleton() {
  return <div className="skeleton-layout"><div className="skeleton hero" /><div className="skeleton-grid">{[1,2,3].map((item) => <div className="skeleton block" key={item} />)}</div><div className="skeleton table" /></div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { apiRequest('/dashboard').then((response) => setData(response.data)).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const greeting = useMemo(() => new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite', []);
  if (loading) return <Skeleton />;
  if (error) return <div className="feedback error-banner"><CircleAlert size={19} />{error}</div>;

  const summary = data?.summary || {};
  const activities = data?.latestTasks || [];
  return (
    <>
      <section className="work-hero">
        <div><span className="eyebrow">Central de trabalho</span><h1>{greeting}, {user?.name?.split(' ')[0]}.</h1><p>Estas são as prioridades que precisam da sua atenção hoje.</p></div>
        <Link className="btn btn-primary" to="/tasks"><Plus size={17} /> Novo registro</Link>
      </section>

      <section className="attention-grid" aria-label="Resumo operacional">
        <article className="attention-item"><span className="attention-icon blue"><BriefcaseBusiness /></span><div><small>Operações ativas</small><strong>{summary.activeProjects || 0}</strong><span>em acompanhamento</span></div><ArrowRight /></article>
        <article className="attention-item"><span className="attention-icon amber"><Clock3 /></span><div><small>Itens pendentes</small><strong>{summary.pendingTasks || 0}</strong><span>{summary.overdueTasks || 0} requerem atenção</span></div><ArrowRight /></article>
        <article className="attention-item"><span className="attention-icon green"><CheckCircle2 /></span><div><small>Concluídos</small><strong>{summary.completedTasks || 0}</strong><span>registros finalizados</span></div><ArrowRight /></article>
      </section>

      <div className="work-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><span className="eyebrow">Acompanhamento</span><h2>Atividade recente</h2></div><Link to="/tasks">Ver todos <ArrowRight size={15} /></Link></div>
          <div className="activity-list">
            {activities.length === 0 ? <div className="empty-state"><FileText /><strong>Nenhuma atividade registrada</strong><span>Os novos registros aparecerão aqui.</span></div> : activities.map((task, index) => (
              <article className="activity-row" key={task.id} style={{ '--delay': `${index * 45}ms` }}>
                <span className={`status-rail ${task.status}`} />
                <span className="record-code">REG-{String(task.id).padStart(4, '0')}</span>
                <div className="activity-main"><strong>{task.title}</strong><span>{task.projectName}</span></div>
                <span className={`badge ${task.status}`}>{task.status === 'done' ? 'Concluído' : task.status === 'in_progress' ? 'Em execução' : task.status === 'in_review' ? 'Em análise' : 'Aberto'}</span>
                <time>{new Date(task.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</time>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel quick-panel">
          <div className="panel-heading"><div><span className="eyebrow">Atalhos</span><h2>Acesso rápido</h2></div></div>
          <Link to="/projects"><span><BriefcaseBusiness />Operações</span><ArrowRight /></Link>
          <Link to="/tasks"><span><ClipboardListIcon />Solicitações</span><ArrowRight /></Link>
          <button type="button"><span><Users />Equipe</span><span className="soon">Em breve</span></button>
          <button type="button"><span><FileText />Documentos</span><span className="soon">Em breve</span></button>
          <div className="support-note"><CircleAlert /><div><strong>Precisa de ajuda?</strong><span>Consulte os procedimentos operacionais.</span></div></div>
        </aside>
      </div>
    </>
  );
}

function ClipboardListIcon() { return <FileText />; }
