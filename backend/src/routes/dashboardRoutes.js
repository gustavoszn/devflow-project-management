const express = require('express');
const { db } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const projects = await db.prepare('SELECT * FROM projects WHERE user_id = ?').all(req.user.id);
  const tasks = await db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.user.id);

  const summary = {
    activeProjects: projects.filter((project) => project.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === 'done').length,
    pendingTasks: tasks.filter((task) => task.status !== 'done').length,
    overdueTasks: tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done').length,
  };

  const tasksByStatus = [
    { name: 'Backlog', count: tasks.filter((task) => task.status === 'backlog').length },
    { name: 'Em andamento', count: tasks.filter((task) => task.status === 'in_progress').length },
    { name: 'Em revisão', count: tasks.filter((task) => task.status === 'in_review').length },
    { name: 'Concluído', count: tasks.filter((task) => task.status === 'done').length },
  ];

  const latestTasks = await Promise.all(tasks
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)
    .map(async (task) => ({
      ...task,
      projectName: (await db.prepare('SELECT name FROM projects WHERE id = ?').get(task.project_id))?.name || 'Sem projeto',
    })));

  return sendSuccess(res, 200, { summary, tasksByStatus, latestTasks });
});

module.exports = router;
