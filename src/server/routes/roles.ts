import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest, logAudit } from '../auth.ts';

export const rolesRouter = Router();

// GET /api/roles - List all roles with hierarchy levels and permissions
rolesRouter.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const rolesRes = await db.query<any>(
      `SELECT r.*, COUNT(ur.user_id) as user_count
       FROM roles r
       LEFT JOIN user_roles ur ON r.id = ur.role_id
       GROUP BY r.id
       ORDER BY r.level ASC`
    );

    const roles = rolesRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
      description: r.description,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
      userCount: parseInt(r.user_count || '0', 10)
    }));

    return res.json({ roles });
  } catch (error: any) {
    console.error('[Roles] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

// PUT /api/roles/:id - Update role permissions (Senior Management only)
rolesRouter.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.activeRole.level !== 1) {
      return res.status(403).json({ error: 'Only Senior Management can modify institutional role permissions.' });
    }

    const { id } = req.params;
    const { permissions, description } = req.body;

    await db.query(
      `UPDATE roles SET permissions = $1, description = COALESCE($2, description) WHERE id = $3`,
      [JSON.stringify(permissions), description || null, id]
    );

    await logAudit(
      req,
      'PERMISSION_CHANGED',
      'ROLE',
      id,
      `Modified permission matrix for role ID ${id}`
    );

    return res.json({ success: true, message: 'Role permissions updated successfully.' });
  } catch (error: any) {
    console.error('[Roles] Update error:', error);
    return res.status(500).json({ error: 'Failed to update role permissions.' });
  }
});
