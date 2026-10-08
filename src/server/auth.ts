import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { Role } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'univault-secret-university-key-2026';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  roles: Role[];
  activeRole: Role;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function createToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required to access this resource.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userRes = await db.query<any>(
      `SELECT u.id, u.name, u.email, u.department_id, u.status,
              d.name as department_name, d.code as department_code
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: User account not found.' });
    }

    const u = userRes.rows[0];
    if (u.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Forbidden: Account is inactive. Contact the University Registrar.' });
    }

    // Fetch user roles
    const rolesRes = await db.query<any>(
      `SELECT r.id, r.name, r.level, r.description, r.permissions
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.level ASC`,
      [u.id]
    );

    const roles: Role[] = rolesRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
      description: r.description,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions
    }));

    if (roles.length === 0) {
      return res.status(403).json({ error: 'Forbidden: No roles assigned to this account.' });
    }

    // Determine active role: client may pass x-active-role-id in headers
    const reqRoleId = req.headers['x-active-role-id'] as string;
    let activeRole = roles.find(r => r.id === reqRoleId) || roles[0];

    req.user = {
      id: u.id,
      name: u.name,
      email: u.email,
      departmentId: u.department_id,
      departmentName: u.department_name,
      departmentCode: u.department_code,
      roles,
      activeRole
    };

    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired. Please log in again.' });
  }
}

// Log audit activity helper
export async function logAudit(
  req: AuthRequest,
  action: string,
  targetType: string,
  target: string,
  details?: string
) {
  try {
    const id = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const userId = req.user?.id || null;
    const userName = req.user?.name || 'Anonymous';
    const userEmail = req.user?.email || 'System';
    const userRole = req.user?.activeRole?.name || 'Guest';
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || '127.0.0.1';

    await db.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_email, user_role, action, target_type, target, details, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [id, userId, userName, userEmail, userRole, action, targetType, target, details || null, ip]
    );
  } catch (err) {
    console.error('[Audit] Failed to record audit log:', err);
  }
}

// Permission checking algorithms
export function checkDocumentPermissions(user: AuthenticatedUser, doc: any) {
  const isOwner = doc.owner_id === user.id;
  const userLevel = user.activeRole.level;
  const isSameDept = doc.department_id === user.departmentId;

  // Senior Management (Level 1) & Dean (Level 2) have university-wide viewing oversight
  let canView = false;
  let permissionReason = '';

  if (isOwner) {
    canView = true;
    permissionReason = 'Owner (You uploaded this document)';
  } else if (userLevel <= 2) {
    canView = true;
    permissionReason = `Role hierarchy access (Level ${userLevel}: ${user.activeRole.name} university-wide oversight)`;
  } else if (isSameDept) {
    if (userLevel === 3) {
      canView = true;
      permissionReason = 'Department Head access (All CSE documents in your department)';
    } else if (userLevel === 4) {
      canView = true;
      permissionReason = 'Associate HoD access (Departmental oversight)';
    } else {
      // Teaching / Non-Teaching Staff
      // Check if folder is restricted to HoD/Admin
      const applicableRoles = typeof doc.applicable_roles === 'string'
        ? JSON.parse(doc.applicable_roles)
        : (doc.applicable_roles || []);
      
      const isRoleApplicable = applicableRoles.length === 0 || applicableRoles.includes(user.activeRole.name);
      
      if (isRoleApplicable) {
        canView = true;
        permissionReason = `Department access (${user.departmentName} repository)`;
      } else {
        canView = false;
        permissionReason = 'Restricted folder: accessible only by Department Administration or higher';
      }
    }
  } else {
    // Unrelated department!
    canView = false;
    permissionReason = `Access Denied: Document belongs to ${doc.department_name || 'another department'}. Your department is ${user.departmentName}.`;
  }

  const canDownload = canView;

  // STRICT RULE: ONLY OWNER CAN DELETE
  // Even Senior Management, Dean, HoD cannot delete another user's document!
  const canDelete = isOwner;

  return { canView, canDownload, canDelete, permissionReason, isOwner };
}
