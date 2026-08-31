const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { projectId, status, priority, assigneeId, search } = req.query;

  let query = 'SELECT t.*, p.name as project_name, u.name as assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.user_id = ?';
  const params = [req.user.id];

  if (projectId) {
    query += ' AND t.project_id = ?';
    params.push(Number(projectId));
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  if (assigneeId) {
    query += ' AND t.assignee_id = ?';
    params.push(Number(assigneeId));
  }

  if (search) {
    query += ' AND t.title LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  return sendSuccess(res, 200, tasks);
});

router.post(
  '/',
  [
    body('title').trim().isLength({ min: 2 }).withMessage('Título da tarefa deve ter pelo menos 2 caracteres.'),
    body('projectId').isNumeric().withMessage('Projeto inválido.'),
    body('status').optional().isIn(['backlog', 'in_progress', 'in_review', 'done']).withMessage('Status inválido.'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Prioridade inválida.'),
    body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Prazo inválido.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Dados inválidos.', errors.array());
    }

    const { projectId, title, description, status, priority, dueDate, assigneeId } = req.body;
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(projectId, req.user.id);
    if (!project) {
      return sendError(res, 404, 'Projeto não encontrado.');
    }

    if (assigneeId) {
      const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, assigneeId);
      if (!member) {
        return sendError(res, 400, 'Usuário não pertence a este projeto.');
      }
    }

    const result = db.prepare(
      'INSERT INTO tasks (project_id, user_id, assignee_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(projectId, req.user.id, assigneeId || null, title.trim(), description ? description.trim() : null, status || 'backlog', priority || 'medium', dueDate || null);

    const task = db.prepare('SELECT t.*, p.name as project_name, u.name as assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?').get(result.lastInsertRowid);
    return sendSuccess(res, 201, task, 'Tarefa criada com sucesso.');
  }
);

router.put(
  '/:id',
  [
    body('title').trim().isLength({ min: 2 }).withMessage('Título da tarefa deve ter pelo menos 2 caracteres.'),
    body('status').optional().isIn(['backlog', 'in_progress', 'in_review', 'done']).withMessage('Status inválido.'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Prioridade inválida.'),
    body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Prazo inválido.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Dados inválidos.', errors.array());
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!task) {
      return sendError(res, 404, 'Tarefa não encontrada.');
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    if (assigneeId) {
      const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, assigneeId);
      if (!member) {
        return sendError(res, 400, 'Usuário não pertence a este projeto.');
      }
    }

    db.prepare(
      'UPDATE tasks SET assignee_id = ?, title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?'
    ).run(assigneeId || null, title.trim(), description ? description.trim() : null, status || task.status, priority || task.priority, dueDate || null, req.params.id, req.user.id);

    const updated = db.prepare('SELECT t.*, p.name as project_name, u.name as assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?').get(req.params.id);
    return sendSuccess(res, 200, updated, 'Tarefa atualizada com sucesso.');
  }
);

router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) {
    return sendError(res, 404, 'Tarefa não encontrada.');
  }

  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return sendSuccess(res, 200, { id: Number(req.params.id) }, 'Tarefa excluída com sucesso.');
});

module.exports = router;
