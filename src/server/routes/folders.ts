import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest, logAudit } from '../auth.ts';

export const foldersRouter = Router();

// GET /api/folders - List all folders with dynamic Applicable / Not Applicable computation
foldersRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    const foldersRes = await db.query<any>(
      `SELECT f.*, d.name as department_name, d.code as department_code,
              COUNT(doc.id) as doc_count
       FROM folders f
       LEFT JOIN departments d ON f.department_id = d.id
       LEFT JOIN documents doc ON f.id = doc.folder_id
       GROUP BY f.id, d.name, d.code
       ORDER BY f.scope DESC, f.name ASC`
    );

    const folders = foldersRes.rows.map(row => {
      const applicableRoles = typeof row.applicable_roles === 'string'
        ? JSON.parse(row.applicable_roles)
        : (row.applicable_roles || []);

      const userLevel = user.activeRole.level;
      const isGlobal = row.scope === 'GLOBAL';
      const isSameDept = row.department_id === user.departmentId;

      let isApplicable = false;
      let statusReason = '';

      if (userLevel === 1) {
        // Senior Management: all folders are applicable
        isApplicable = true;
        statusReason = 'Accessible via Executive Leadership';
      } else if (userLevel === 2) {
        // Dean / Administration: all university & academic folders
        isApplicable = true;
        statusReason = 'Accessible via University Administration';
      } else if (isGlobal) {
        // Global folder for department users
        if (applicableRoles.includes(user.activeRole.name)) {
          isApplicable = true;
          statusReason = 'Applicable for your role';
        } else {
          isApplicable = false;
          statusReason = 'Not applicable for current role tier';
        }
      } else if (!isSameDept) {
        // Folder belongs to an unrelated department!
        isApplicable = false;
        statusReason = `Restricted: Belongs to ${row.department_name || 'unrelated department'}`;
      } else {
        // Same department folder
        if (applicableRoles.length === 0 || applicableRoles.includes(user.activeRole.name)) {
          isApplicable = true;
          statusReason = 'Applicable for active department role';
        } else {
          isApplicable = false;
          statusReason = `Restricted to ${applicableRoles.join(', ')}`;
        }
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        departmentId: row.department_id,
        departmentName: row.department_name,
        scope: row.scope,
        createdById: row.created_by_id,
        createdByRole: row.created_by_role,
        applicableRoles,
        documentCount: parseInt(row.doc_count || '0', 10),
        isApplicable,
        statusReason,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return res.json({ folders });
  } catch (error: any) {
    console.error('[Folders] List error:', error);
    return res.status(500).json({ error: 'Failed to retrieve folders.' });
  }
});

// POST /api/folders - Authorized folder creation
foldersRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const userLevel = user.activeRole.level;
    const { name, description, scope = 'DEPARTMENT', departmentId, applicableRoles } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required.' });
    }

    // Role verification:
    // Only Level 1 & 2 can create GLOBAL folders.
    // Level 3 (HoD) can create DEPARTMENT folders for their department.
    // Level 4 & 5 cannot create folders.
    if (scope === 'GLOBAL' && userLevel > 2) {
      return res.status(403).json({
        error: 'Forbidden: Only Senior Management and Deans can create Global University folders.'
      });
    }

    if (userLevel > 3) {
      return res.status(403).json({
        error: 'Forbidden: Teaching Staff and Associate HoDs cannot create repository folders. Please consult your Head of Department.'
      });
    }

    const folderId = 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const targetDeptId = scope === 'GLOBAL' ? null : (departmentId || user.departmentId);

    const rolesList = Array.isArray(applicableRoles) && applicableRoles.length > 0
      ? applicableRoles
      : ['Teaching Staff', 'Associate HoD', 'HoD', 'Dean / Administration', 'Senior Management'];

    await db.query(
      `INSERT INTO folders (id, name, description, department_id, scope, created_by_id, created_by_role, applicable_roles, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        folderId,
        name.trim(),
        description || '',
        targetDeptId,
        scope,
        user.id,
        user.activeRole.name,
        JSON.stringify(rolesList)
      ]
    );

    await logAudit(
      req,
      'FOLDER_CREATED',
      'FOLDER',
      name.trim(),
      `Created ${scope} folder with ${rolesList.length} applicable roles`
    );

    return res.status(201).json({
      success: true,
      message: `Folder "${name.trim()}" created successfully.`,
      folderId
    });
  } catch (error: any) {
    console.error('[Folders] Create error:', error);
    return res.status(500).json({ error: 'Failed to create folder.' });
  }
});
