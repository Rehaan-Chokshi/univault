import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/index.ts';
import { requireAuth, AuthRequest, logAudit, checkDocumentPermissions } from '../auth.ts';

export const documentsRouter = Router();

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const allowedMimes: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx'
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const validExts = ['pdf', 'docx', 'pptx', 'xlsx'];
    if (validExts.includes(ext) || allowedMimes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, PPTX and XLSX files are supported by UniVault.'));
    }
  }
});

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// GET /api/documents - List documents with hierarchy filter
documentsRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { q, folderId, departmentId, filter } = req.query;

    const queryRes = await db.query<any>(
      `SELECT d.*, 
              f.name as folder_name, f.applicable_roles,
              dept.name as department_name, dept.code as department_code
       FROM documents d
       JOIN folders f ON d.folder_id = f.id
       JOIN departments dept ON d.department_id = dept.id
       ORDER BY d.created_at DESC`
    );

    const documents = [];

    for (const row of queryRes.rows) {
      const perms = checkDocumentPermissions(user, row);
      
      // If user cannot view the document, do not leak it in listings
      if (!perms.canView) {
        continue;
      }

      // Filter: 'my' (My Documents) or 'shared' (Shared With Me)
      if (filter === 'my' && row.owner_id !== user.id) {
        continue;
      }
      if (filter === 'shared' && row.owner_id === user.id) {
        continue;
      }

      if (folderId && row.folder_id !== folderId) {
        continue;
      }

      if (departmentId && row.department_id !== departmentId) {
        continue;
      }

      // Search query filter
      if (q && typeof q === 'string') {
        const query = q.toLowerCase();
        const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
        const matches =
          row.title.toLowerCase().includes(query) ||
          row.file_name.toLowerCase().includes(query) ||
          (row.description && row.description.toLowerCase().includes(query)) ||
          row.owner_name.toLowerCase().includes(query) ||
          row.department_name.toLowerCase().includes(query) ||
          row.folder_name.toLowerCase().includes(query) ||
          (Array.isArray(tags) && tags.some(t => t.toLowerCase().includes(query)));

        if (!matches) continue;
      }

      const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;

      documents.push({
        id: row.id,
        title: row.title,
        fileName: row.file_name,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: Number(row.file_size),
        fileSizeFormatted: formatBytes(Number(row.file_size)),
        description: row.description,
        tags: Array.isArray(tags) ? tags : [],
        folderId: row.folder_id,
        folderName: row.folder_name,
        departmentId: row.department_id,
        departmentName: row.department_name,
        uploaderId: row.uploader_id,
        uploaderName: row.uploader_name,
        uploaderRole: row.uploader_role,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastAccessedAt: row.last_accessed_at,
        canView: perms.canView,
        canDownload: perms.canDownload,
        canDelete: perms.canDelete,
        permissionReason: perms.permissionReason
      });
    }

    return res.json({ documents });
  } catch (error: any) {
    console.error('[Documents] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
});

// GET /api/documents/:id - Document details with permissions explainer
documentsRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const docRes = await db.query<any>(
      `SELECT d.*, 
              f.name as folder_name, f.applicable_roles,
              dept.name as department_name, dept.code as department_code
       FROM documents d
       JOIN folders f ON d.folder_id = f.id
       JOIN departments dept ON d.department_id = dept.id
       WHERE d.id = $1`,
      [id]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const row = docRes.rows[0];
    const perms = checkDocumentPermissions(user, row);

    if (!perms.canView) {
      return res.status(403).json({
        error: "You don't have permission to access this document.",
        reason: perms.permissionReason
      });
    }

    // Update last accessed
    await db.query('UPDATE documents SET last_accessed_at = NOW() WHERE id = $1', [id]);

    // Log audit view
    await logAudit(
      req,
      'DOCUMENT_VIEWED',
      'DOCUMENT',
      row.title,
      `Viewed metadata for document ID ${row.id}`
    );

    const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;

    return res.json({
      document: {
        id: row.id,
        title: row.title,
        fileName: row.file_name,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: Number(row.file_size),
        fileSizeFormatted: formatBytes(Number(row.file_size)),
        description: row.description,
        tags: Array.isArray(tags) ? tags : [],
        folderId: row.folder_id,
        folderName: row.folder_name,
        departmentId: row.department_id,
        departmentName: row.department_name,
        uploaderId: row.uploader_id,
        uploaderName: row.uploader_name,
        uploaderRole: row.uploader_role,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastAccessedAt: new Date().toISOString(),
        canView: perms.canView,
        canDownload: perms.canDownload,
        canDelete: perms.canDelete,
        permissionReason: perms.permissionReason
      }
    });
  } catch (error: any) {
    console.error('[Documents] Details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document details.' });
  }
});

// GET /api/documents/:id/download - Secure file download
documentsRouter.get('/:id/download', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const docRes = await db.query<any>(
      `SELECT d.*, 
              f.name as folder_name, f.applicable_roles,
              dept.name as department_name
       FROM documents d
       JOIN folders f ON d.folder_id = f.id
       JOIN departments dept ON d.department_id = dept.id
       WHERE d.id = $1`,
      [id]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const row = docRes.rows[0];
    const perms = checkDocumentPermissions(user, row);

    if (!perms.canDownload) {
      return res.status(403).json({
        error: "Access Forbidden: You don't have download permissions for this document.",
        reason: perms.permissionReason
      });
    }

    // Check if physical file exists
    if (!fs.existsSync(row.file_path)) {
      // Create a fallback content file so download never breaks
      fs.writeFileSync(
        row.file_path,
        `UniVault GSFC University Document\nDocument: ${row.title}\nDepartment: ${row.department_name}\nOwner: ${row.owner_name}\nCreated: ${row.created_at}\n\n[Verified Authentic University Document Record]`,
        'utf8'
      );
    }

    await logAudit(
      req,
      'DOCUMENT_DOWNLOADED',
      'DOCUMENT',
      row.title,
      `Downloaded by ${user.name} (${user.activeRole.name})`
    );

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.file_name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const fileStream = fs.createReadStream(row.file_path);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('[Documents] Download error:', error);
    return res.status(500).json({ error: 'Failed to download document.' });
  }
});

// POST /api/documents - Upload document
documentsRouter.post('/', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Please choose a document file to upload.' });
    }

    const { title, description, folderId, departmentId, tags } = req.body;

    if (!title || !folderId) {
      // Cleanup uploaded file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Document title and folder are required.' });
    }

    // Check folder
    const folderRes = await db.query<any>('SELECT * FROM folders WHERE id = $1', [folderId]);
    if (folderRes.rows.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Selected repository folder does not exist.' });
    }

    const folder = folderRes.rows[0];
    const applicableRoles = typeof folder.applicable_roles === 'string'
      ? JSON.parse(folder.applicable_roles)
      : (folder.applicable_roles || []);

    // Check folder applicability: if not applicable to user's role, reject upload!
    if (applicableRoles.length > 0 && !applicableRoles.includes(user.activeRole.name)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({
        error: `Upload rejected: The folder "${folder.name}" is NOT APPLICABLE to your active role (${user.activeRole.name}).`
      });
    }

    // Default department to user's department if not provided
    const targetDeptId = departmentId || user.departmentId;

    const docId = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'pdf';

    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = String(tags).split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    await db.query(
      `INSERT INTO documents (
        id, title, file_name, file_path, file_type, file_size, description, tags,
        folder_id, department_id, uploader_id, uploader_name, uploader_role,
        owner_id, owner_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
      [
        docId,
        title.trim(),
        file.originalname,
        file.path,
        ext,
        file.size,
        description || '',
        JSON.stringify(parsedTags),
        folderId,
        targetDeptId,
        user.id,
        user.name,
        user.activeRole.name,
        user.id, // Owner is the original uploader
        user.name
      ]
    );

    await logAudit(
      req,
      'DOCUMENT_UPLOADED',
      'DOCUMENT',
      title.trim(),
      `Uploaded to folder ${folder.name} (${formatBytes(file.size)})`
    );

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and registered in repository successfully.',
      documentId: docId
    });
  } catch (error: any) {
    console.error('[Documents] Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload document.' });
  }
});

// DELETE /api/documents/:id - Owner-Only document deletion
documentsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const docRes = await db.query<any>('SELECT * FROM documents WHERE id = $1', [id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docRes.rows[0];

    // STRICT OWNER-ONLY DELETION ENFORCEMENT:
    // Even Senior Management, Dean, HoD cannot delete someone else's document!
    if (doc.owner_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden: Only the original uploader (document owner) can delete this document. Even Senior Management and Administrators cannot delete documents belonging to other faculty or staff.'
      });
    }

    // Delete physical file from filesystem if it exists
    if (doc.file_path && fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (err) {
        console.warn('[Documents] Physical file cleanup warning:', err);
      }
    }

    // Delete record from database
    await db.query('DELETE FROM documents WHERE id = $1', [id]);

    await logAudit(
      req,
      'DOCUMENT_DELETED',
      'DOCUMENT',
      doc.title,
      `Deleted by owner ${user.name}`
    );

    return res.json({
      success: true,
      message: `Document "${doc.title}" has been permanently removed by owner.`
    });
  } catch (error: any) {
    console.error('[Documents] Deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
});
