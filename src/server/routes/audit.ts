import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest } from '../auth.ts';

export const auditRouter = Router();

// GET /api/audit-logs - View audit trail
auditRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, search } = req.query;

    let sql = `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`;
    let params: any[] = [];

    // Category mapping:
    // 'Login' -> LOGIN, LOGOUT
    // 'Documents' -> DOCUMENT_UPLOADED, DOCUMENT_VIEWED, DOCUMENT_DOWNLOADED, DOCUMENT_DELETED
    // 'Folders' -> FOLDER_CREATED
    // 'Users' -> USER_CREATED, USER_UPDATED, ROLE_CHANGED
    // 'Security' -> PERMISSION_CHANGED, ROLE_CHANGED, LOGIN

    const queryRes = await db.query<any>(
      `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200`
    );

    let logs = queryRes.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userRole: row.user_role,
      action: row.action,
      targetType: row.target_type,
      target: row.target,
      details: row.details,
      ipAddress: row.ip_address,
      timestamp: row.timestamp
    }));

    // Filter by role scope: If staff, only see their own actions
    if (user.activeRole.level > 3) {
      logs = logs.filter(l => l.userId === user.id);
    }

    // Filter by Category
    if (category && category !== 'All') {
      const cat = String(category).toLowerCase();
      if (cat === 'login') {
        logs = logs.filter(l => ['LOGIN', 'LOGOUT'].includes(l.action));
      } else if (cat === 'documents') {
        logs = logs.filter(l => l.action.startsWith('DOCUMENT_'));
      } else if (cat === 'folders') {
        logs = logs.filter(l => l.action.startsWith('FOLDER_'));
      } else if (cat === 'users') {
        logs = logs.filter(l => ['USER_CREATED', 'USER_UPDATED', 'ROLE_CHANGED'].includes(l.action));
      } else if (cat === 'security') {
        logs = logs.filter(l => ['PERMISSION_CHANGED', 'ROLE_CHANGED', 'LOGIN'].includes(l.action));
      }
    }

    // Filter by Search text
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      logs = logs.filter(
        l =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return res.json({ logs });
  } catch (error: any) {
    console.error('[Audit] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});
