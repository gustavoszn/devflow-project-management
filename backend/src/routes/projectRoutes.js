const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

async function buildProjectProgress(projectId) {
  const tasks = await db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId);
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  return Math.round((doneCount / tasks.length) * 100);
}

async function getProjectMembers(projectId) {
  return await db.prepare(`
    SELECT u.id, u.name, u.email, pm.role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY CASE pm.role WHEN 'owner' THEN 0 ELSE 1 END, u.name
  `).all(projectId);
}

router.get('/', async (req, res) => {
  const projects = await db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const data = await Promise.all(projects.map(async (project) => ({
    ...project,
    progress: await buildProjectProgress(project.id),
    taskCount: Number((await db.prepare('SELECT COUNT(*) as total FROM tasks WHERE project_id = ?').get(project.id)).total),
    members: await getProjectMembers(project.id),
  })));
  return sendSuccess(res, 200, data);
});

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Nome do projeto deve ter pelo menos 2 caracteres.'),
    body('description').optional().trim(),
    body('startDate').isISO8601().withMessage('Data inicial inválida.'),
    body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Prazo inválido.'),
    body('status').optional().isIn(['active', 'on_hold', 'completed']).withMessage('Status inválido.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Dados inválidos.', errors.array());
    }

    const { name, description, startDate, dueDate, status } = req.body;
    const result = await db.prepare(
      'INSERT INTO projects (user_id, name, description, start_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, name.trim(), description ? description.trim() : null, startDate, dueDate || null, status || 'active');

    const projectId = result.lastInsertRowid;
    await db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, req.user.id, 'owner');

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    return sendSuccess(res, 201, { ...project, progress: 0, taskCount: 0, members: await getProjectMembers(projectId) }, 'Projeto criado com sucesso.');
  }
);

router.put(
  '/:id',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Nome do projeto deve ter pelo menos 2 caracteres.'),
    body('description').optional().trim(),
    body('startDate').isISO8601().withMessage('Data inicial inválida.'),
    body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Prazo inválido.'),
    body('status').optional().isIn(['active', 'on_hold', 'completed']).withMessage('Status inválido.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Dados inválidos.', errors.array());
    }

    const project = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) {
      return sendError(res, 404, 'Projeto não encontrado.');
    }

    const { name, description, startDate, dueDate, status } = req.body;
    await db.prepare(
      'UPDATE projects SET name = ?, description = ?, start_date = ?, due_date = ?, status = ? WHERE id = ? AND user_id = ?'
    ).run(name.trim(), description ? description.trim() : null, startDate, dueDate || null, status || 'active', req.params.id, req.user.id);

    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    return sendSuccess(res, 200, { ...updated, progress: await buildProjectProgress(updated.id), members: await getProjectMembers(updated.id) }, 'Projeto atualizado com sucesso.');
  }
);

router.delete('/:id', async (req, res) => {
  const project = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!project) {
    return sendError(res, 404, 'Projeto não encontrado.');
  }

  await db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return sendSuccess(res, 200, { id: Number(req.params.id) }, 'Projeto excluído com sucesso.');
});

module.exports = router;
