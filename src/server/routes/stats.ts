import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest, checkDocumentPermissions } from '../auth.ts';

export const statsRouter = Router();

// GET /api/stats - Dashboard metrics
statsRouter.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Fetch all documents and check permissions for this user
    const docsRes = await db.query<any>(
      `SELECT d.*, f.applicable_roles, dept.name as department_name
       FROM documents d
       JOIN folders f ON d.folder_id = f.id
       JOIN departments dept ON d.department_id = dept.id`
    );

    let totalAccessible = 0;
    let myDocuments = 0;
    let sharedWithMe = 0;

    for (const doc of docsRes.rows) {
      const perms = checkDocumentPermissions(user, doc);
      if (perms.canView) {
        totalAccessible++;
        if (doc.owner_id === user.id) {
          myDocuments++;
        } else {
          sharedWithMe++;
        }
      }
    }

    // Activity count today
    const activityRes = await db.query<any>(
      `SELECT COUNT(*) as count FROM audit_logs
       WHERE timestamp >= CURRENT_DATE`
    );
    const activityToday = parseInt(activityRes.rows[0]?.count || '0', 10);

    return res.json({
      stats: {
        totalDocuments: totalAccessible,
        myDocuments,
        sharedWithMe,
        activityCountToday: activityToday
      }
    });
  } catch (error: any) {
    console.error('[Stats] Error:', error);
    return res.status(500).json({ error: 'Failed to compute statistics.' });
  }
});

// GET /api/stats/departments - List all departments
statsRouter.get('/departments', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const deptRes = await db.query<any>('SELECT * FROM departments ORDER BY name ASC');
    return res.json({ departments: deptRes.rows });
  } catch (error: any) {
    console.error('[Departments] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
});
