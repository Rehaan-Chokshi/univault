import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../db/index.ts';
import { createToken, requireAuth, logAudit, AuthRequest } from '../auth.ts';
import { Role } from '../../types/index.ts';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await db.query<any>(
      `SELECT u.id, u.name, u.email, u.password_hash, u.department_id, u.status,
              d.name as department_name, d.code as department_code
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid university credentials.' });
    }

    const user = userRes.rows[0];
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account suspended or inactive. Please contact University Administration.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid university credentials.' });
    }

    // Fetch roles
    const rolesRes = await db.query<any>(
      `SELECT r.id, r.name, r.level, r.description, r.permissions
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.level ASC`,
      [user.id]
    );

    const roles: Role[] = rolesRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
      description: r.description,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions
    }));

    if (roles.length === 0) {
      return res.status(403).json({ error: 'No authorized university roles assigned to this account.' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = createToken({ userId: user.id });
    const activeRole = roles[0]; // Default to highest hierarchy level role

    // Audit log
    await logAudit(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          departmentId: user.department_id,
          departmentName: user.department_name,
          departmentCode: user.department_code,
          roles,
          activeRole
        },
        headers: req.headers,
        socket: req.socket
      } as any,
      'LOGIN',
      'AUTH',
      user.email,
      `User signed in with active role ${activeRole.name}`
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        departmentId: user.department_id,
        departmentName: user.department_name,
        departmentCode: user.department_code,
        roles,
        activeRoleId: activeRole.id,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      departmentCode: user.departmentCode,
      roles: user.roles,
      activeRoleId: user.activeRole.id
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  await logAudit(req, 'LOGOUT', 'AUTH', req.user!.email, 'User logged out of session');
  return res.json({ success: true, message: 'Successfully logged out.' });
});

// POST /api/auth/switch-role
authRouter.post('/switch-role', requireAuth, async (req: AuthRequest, res: Response) => {
  const { roleId } = req.body;
  const targetRole = req.user!.roles.find(r => r.id === roleId);

  if (!targetRole) {
    return res.status(400).json({ error: 'Role not assigned to your account.' });
  }

  await logAudit(
    req,
    'ROLE_CHANGED',
    'ROLE',
    targetRole.name,
    `Active role switched from ${req.user!.activeRole.name} to ${targetRole.name}`
  );

  return res.json({
    success: true,
    activeRoleId: targetRole.id,
    activeRole: targetRole
  });
});
