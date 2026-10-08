import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest, logAudit } from '../auth.ts';

export const usersRouter = Router();

// GET /api/users - List users (Authorized Admin / Senior only)
usersRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.activeRole.level > 2) {
      return res.status(403).json({ error: 'Access restricted to University Administration and Senior Management.' });
    }

    const usersRes = await db.query<any>(
      `SELECT u.id, u.name, u.email, u.status, u.last_login, u.created_at,
              d.id as department_id, d.name as department_name, d.code as department_code
       FROM users u
       JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );

    const userRolesRes = await db.query<any>(
      `SELECT ur.user_id, r.id, r.name, r.level
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       ORDER BY r.level ASC`
    );

    const rolesByUser: Record<string, any[]> = {};
    for (const ur of userRolesRes.rows) {
      if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
      rolesByUser[ur.user_id].push({ id: ur.id, name: ur.name, level: ur.level });
    }

    const users = usersRes.rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      departmentId: u.department_id,
      departmentName: u.department_name,
      departmentCode: u.department_code,
      status: u.status,
      lastLogin: u.last_login,
      createdAt: u.created_at,
      roles: rolesByUser[u.id] || []
    }));

    return res.json({ users });
  } catch (error: any) {
    console.error('[Users] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// POST /api/users - Create new university user
usersRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.activeRole.level > 2) {
      return res.status(403).json({ error: 'Only University Administration can register new staff accounts.' });
    }

    const { name, email, password = 'password123', departmentId, roleIds } = req.body;

    if (!name || !email || !departmentId || !roleIds || roleIds.length === 0) {
      return res.status(400).json({ error: 'Name, university email, department, and at least one role are required.' });
    }

    // Check duplicate email
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A university account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, department_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
      [newUserId, name.trim(), email.trim(), passwordHash, departmentId]
    );

    for (const rId of roleIds) {
      await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [newUserId, rId]);
    }

    await logAudit(
      req,
      'USER_CREATED',
      'USER',
      email.trim(),
      `Created staff profile for ${name.trim()} with ${roleIds.length} roles`
    );

    return res.status(201).json({ success: true, message: 'User account created successfully.', userId: newUserId });
  } catch (error: any) {
    console.error('[Users] Create error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/users/:id - Update user status or roles
usersRouter.post('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.activeRole.level > 2) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACTIVE or INACTIVE.' });
    }

    await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    await logAudit(req, 'USER_UPDATED', 'USER', id, `Updated account status to ${status}`);

    return res.json({ success: true, message: `User status updated to ${status}.` });
  } catch (error: any) {
    console.error('[Users] Status update error:', error);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});
