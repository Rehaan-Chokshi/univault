export type HierarchyLevel = 1 | 2 | 3 | 4 | 5;

export interface Role {
  id: string;
  name: string;
  level: HierarchyLevel;
  description: string;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  roles: Role[];
  activeRoleId: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  departmentId?: string | null; // null means global / university-wide
  departmentName?: string;
  scope: 'GLOBAL' | 'DEPARTMENT';
  createdById: string;
  createdByRole: string;
  applicableRoleNames?: string[]; // which role names find this folder APPLICABLE
  documentCount?: number;
  isApplicable?: boolean;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'xlsx' | string;
  fileSize: number;
  fileSizeFormatted: string;
  description?: string;
  tags: string[];
  folderId: string;
  folderName?: string;
  departmentId: string;
  departmentName?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  canView?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;
  permissionReason?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VIEWED'
    | 'DOCUMENT_DOWNLOADED'
    | 'DOCUMENT_DELETED'
    | 'FOLDER_CREATED'
    | 'ROLE_CHANGED'
    | 'PERMISSION_CHANGED'
    | 'USER_CREATED'
    | 'USER_UPDATED';
  targetType: 'DOCUMENT' | 'FOLDER' | 'USER' | 'ROLE' | 'AUTH' | 'SYSTEM';
  target: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalDocuments: number;
  myDocuments: number;
  sharedWithMe: number;
  activityCountToday: number;
}
