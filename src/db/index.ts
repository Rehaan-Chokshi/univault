import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Initialize PGlite database
const dataDir = path.resolve(process.cwd(), 'data/pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new PGlite(dataDir);

// Initialize uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function initDatabase() {
  console.log('[Database] Initializing PostgreSQL schemas...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      department_id TEXT NOT NULL REFERENCES departments(id),
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      scope TEXT NOT NULL DEFAULT 'DEPARTMENT', -- 'GLOBAL' or 'DEPARTMENT'
      created_by_id TEXT NOT NULL REFERENCES users(id),
      created_by_role TEXT NOT NULL,
      applicable_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      description TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      folder_id TEXT NOT NULL REFERENCES folders(id),
      department_id TEXT NOT NULL REFERENCES departments(id),
      uploader_id TEXT NOT NULL REFERENCES users(id),
      uploader_name TEXT NOT NULL,
      uploader_role TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      owner_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_accessed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Check if seeded
  const usersCountResult = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  const count = parseInt(usersCountResult.rows[0]?.count || '0', 10);

  if (count === 0) {
    console.log('[Database] Seeding initial university data...');
    await seedDatabase();
  } else {
    console.log('[Database] Database already initialized with users.');
  }
}

async function seedDatabase() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Departments
  const departments = [
    { id: 'dept-adm', name: 'University Administration', code: 'ADM', description: 'Central Executive and Administrative Offices' },
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
    { id: 'dept-it', name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
    { id: 'dept-me', name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
    { id: 'dept-mgmt', name: 'Management Studies', code: 'MGMT', description: 'School of Management' },
    { id: 'dept-ece', name: 'Electronics & Communication', code: 'ECE', description: 'Department of Electronics' }
  ];

  for (const dept of departments) {
    await db.query(
      'INSERT INTO departments (id, name, code, description) VALUES ($1, $2, $3, $4)',
      [dept.id, dept.name, dept.code, dept.description]
    );
  }

  // 2. Roles (Hierarchy Level 1 to 5)
  const roles = [
    {
      id: 'role-senior',
      name: 'Senior Management',
      level: 1,
      description: 'Vice Chancellor, Board of Trustees, Executive Leadership',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'CREATE_GLOBAL_FOLDERS', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_AUDIT_LOGS']
    },
    {
      id: 'role-dean',
      name: 'Dean / Administration',
      level: 2,
      description: 'Deans of Faculties, Academic Directors, University Registrar',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'CREATE_GLOBAL_FOLDERS', 'CREATE_DEPT_FOLDERS', 'MANAGE_USERS', 'VIEW_AUDIT_LOGS']
    },
    {
      id: 'role-hod',
      name: 'HoD',
      level: 3,
      description: 'Head of Academic Department',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'CREATE_DEPT_FOLDERS', 'VIEW_DEPT_AUDIT_LOGS']
    },
    {
      id: 'role-assoc-hod',
      name: 'Associate HoD',
      level: 4,
      description: 'Associate Head of Academic Department',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS']
    },
    {
      id: 'role-teaching',
      name: 'Teaching Staff',
      level: 5,
      description: 'Professors, Assistant Professors, Lecturers',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS']
    },
    {
      id: 'role-non-teaching',
      name: 'Non-Teaching Staff',
      level: 5,
      description: 'Laboratory Technicians, Department Staff',
      permissions: ['VIEW_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'UPLOAD_DOCUMENTS']
    }
  ];

  for (const role of roles) {
    await db.query(
      'INSERT INTO roles (id, name, level, description, permissions) VALUES ($1, $2, $3, $4, $5)',
      [role.id, role.name, role.level, role.description, JSON.stringify(role.permissions)]
    );
  }

  // 3. Demo Users
  const users = [
    {
      id: 'usr-senior',
      name: 'Dr. Rajesh Mehta',
      email: 'senior@university.edu',
      department_id: 'dept-adm',
      role_ids: ['role-senior']
    },
    {
      id: 'usr-dean',
      name: 'Dr. Priya Shah',
      email: 'dean@university.edu',
      department_id: 'dept-adm',
      role_ids: ['role-dean']
    },
    {
      id: 'usr-hod-cse',
      name: 'Dr. Amit Patel',
      email: 'hod.cse@university.edu',
      department_id: 'dept-cse',
      // Multi-role demo user: HoD AND Teaching Staff!
      role_ids: ['role-hod', 'role-teaching']
    },
    {
      id: 'usr-assoc-cse',
      name: 'Dr. Neha Desai',
      email: 'associatehod.cse@university.edu',
      department_id: 'dept-cse',
      // Multi-role demo user: Associate HoD AND Teaching Staff!
      role_ids: ['role-assoc-hod', 'role-teaching']
    },
    {
      id: 'usr-fac-cse',
      name: 'Rahul Sharma',
      email: 'faculty.cse@university.edu',
      department_id: 'dept-cse',
      role_ids: ['role-teaching']
    },
    {
      id: 'usr-staff-cse',
      name: 'Karan Joshi',
      email: 'staff.cse@university.edu',
      department_id: 'dept-cse',
      role_ids: ['role-non-teaching']
    },
    {
      id: 'usr-fac-me',
      name: 'Prof. Vikram Joshi',
      email: 'faculty.me@university.edu',
      department_id: 'dept-me',
      role_ids: ['role-teaching']
    }
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, department_id, status, last_login)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
      [u.id, u.name, u.email, passwordHash, u.department_id]
    );

    for (const rId of u.role_ids) {
      await db.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [u.id, rId]
      );
    }
  }

  // 4. Predefined Folders
  // Teaching Staff folders: Mentor-Mentee, Academics, Proposal, Research, Training, Other
  // Associate HoD folders: Academics, Research, Proposal, Training, Department Reports, Other
  // HoD folders: Department Administration, Academics, Faculty Records, Research, Proposals, Reports, Other
  // Admin/Dean: Administration, Academic Affairs, Department Reports, Research, Policies, Official Documents, Other
  // Senior: Strategic Documents, University Policies, Administration, Academic Affairs, Reports, Official Documents, Other

  const initialFolders = [
    // CSE Department folders
    {
      id: 'fld-cse-mentor',
      name: 'Mentor-Mentee',
      description: 'Student mentoring session records and advising documents',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD']
    },
    {
      id: 'fld-cse-academics',
      name: 'Academics',
      description: 'Syllabus, course files, lecture plans, and exam papers',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD', 'Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-cse-proposals',
      name: 'Proposals',
      description: 'Academic, grant, and laboratory procurement proposals',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD', 'Dean / Administration']
    },
    {
      id: 'fld-cse-research',
      name: 'Research',
      description: 'Published papers, patent drafts, and active research materials',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD', 'Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-cse-training',
      name: 'Training',
      description: 'Faculty development programs, workshops, and student internships',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD', 'Non-Teaching Staff']
    },
    {
      id: 'fld-cse-admin',
      name: 'Department Administration',
      description: 'Budget allocations, departmental committee minutes, and official rosters',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['HoD', 'Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-cse-faculty-records',
      name: 'Faculty Records',
      description: 'Confidential performance appraisals, leave registers, and staff files',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['HoD', 'Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-cse-reports',
      name: 'Department Reports',
      description: 'Accreditation (NAAC/NBA), semester audits, and departmental reviews',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Associate HoD', 'HoD', 'Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-cse-other',
      name: 'Other',
      description: 'General department notices and supplementary items',
      department_id: 'dept-cse',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-hod-cse',
      created_by_role: 'HoD',
      applicable_roles: ['Teaching Staff', 'Associate HoD', 'HoD', 'Non-Teaching Staff']
    },

    // Global / University-wide folders
    {
      id: 'fld-global-strat',
      name: 'Strategic Documents',
      description: 'University master strategy, 10-year roadmaps, and institutional targets',
      department_id: null,
      scope: 'GLOBAL',
      created_by_id: 'usr-senior',
      created_by_role: 'Senior Management',
      applicable_roles: ['Senior Management']
    },
    {
      id: 'fld-global-policies',
      name: 'University Policies',
      description: 'Statutory guidelines, academic handbooks, and HR governance',
      department_id: null,
      scope: 'GLOBAL',
      created_by_id: 'usr-senior',
      created_by_role: 'Senior Management',
      applicable_roles: ['Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-global-official',
      name: 'Official Documents',
      description: 'Executive decrees, university gazettes, and board resolutions',
      department_id: null,
      scope: 'GLOBAL',
      created_by_id: 'usr-dean',
      created_by_role: 'Dean / Administration',
      applicable_roles: ['Dean / Administration', 'Senior Management']
    },
    {
      id: 'fld-global-acad-affairs',
      name: 'Academic Affairs',
      description: 'Curriculum development, academic council notes, and exam schedules',
      department_id: null,
      scope: 'GLOBAL',
      created_by_id: 'usr-dean',
      created_by_role: 'Dean / Administration',
      applicable_roles: ['Dean / Administration', 'Senior Management']
    },

    // Mechanical Engineering folder (to demonstrate department isolation)
    {
      id: 'fld-me-research',
      name: 'Mechanical Research',
      description: 'Thermodynamics and Robotics research papers',
      department_id: 'dept-me',
      scope: 'DEPARTMENT',
      created_by_id: 'usr-fac-me',
      created_by_role: 'Teaching Staff',
      applicable_roles: ['Teaching Staff', 'HoD', 'Dean / Administration', 'Senior Management']
    }
  ];

  for (const f of initialFolders) {
    await db.query(
      `INSERT INTO folders (id, name, description, department_id, scope, created_by_id, created_by_role, applicable_roles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [f.id, f.name, f.description, f.department_id, f.scope, f.created_by_id, f.created_by_role, JSON.stringify(f.applicable_roles)]
    );
  }

  // 5. Seed Real Initial Physical Files in /uploads/
  const sampleFiles = [
    {
      id: 'doc-1',
      title: 'AI Research Proposal.pdf',
      fileName: 'AI_Research_Proposal.pdf',
      fileType: 'pdf',
      fileSize: 245000,
      description: 'Grant proposal for scalable neural architecture search in distributed university environments.',
      tags: ['research', 'ai', 'grant', 'cse'],
      folderId: 'fld-cse-proposals',
      departmentId: 'dept-cse',
      uploaderId: 'usr-fac-cse', // Rahul Sharma (Faculty CSE)
      uploaderName: 'Rahul Sharma',
      uploaderRole: 'Teaching Staff',
      ownerId: 'usr-fac-cse',
      ownerName: 'Rahul Sharma',
      content: '%PDF-1.4\n% UniVault GSFC University Document\nAI Research Proposal - Dept of Computer Science & Engineering\nPrincipal Investigator: Rahul Sharma\nFocus: Distributed Machine Learning and High-Performance Compute Infrastructure'
    },
    {
      id: 'doc-2',
      title: 'CSE Academic Report.pdf',
      fileName: 'CSE_Academic_Report.pdf',
      fileType: 'pdf',
      fileSize: 512000,
      description: 'Annual department academic performance and student outcomes report.',
      tags: ['academics', 'annual-report', 'cse'],
      folderId: 'fld-cse-reports',
      departmentId: 'dept-cse',
      uploaderId: 'usr-hod-cse',
      uploaderName: 'Dr. Amit Patel',
      uploaderRole: 'HoD',
      ownerId: 'usr-hod-cse',
      ownerName: 'Dr. Amit Patel',
      content: '%PDF-1.4\n% UniVault GSFC University Document\nCSE Academic Report - Session 2025-2026\nApproved by: Dr. Amit Patel, Head of Department'
    },
    {
      id: 'doc-3',
      title: 'Faculty Training Report.pdf',
      fileName: 'Faculty_Training_Report.pdf',
      fileType: 'pdf',
      fileSize: 180000,
      description: 'Summary of semester workshop on modern curriculum delivery and pedagogical tools.',
      tags: ['training', 'faculty', 'cse'],
      folderId: 'fld-cse-training',
      departmentId: 'dept-cse',
      uploaderId: 'usr-assoc-cse',
      uploaderName: 'Dr. Neha Desai',
      uploaderRole: 'Associate HoD',
      ownerId: 'usr-assoc-cse',
      ownerName: 'Dr. Neha Desai',
      content: '%PDF-1.4\n% UniVault GSFC University Document\nFaculty Training Report - Conducted by Associate HoD Dr. Neha Desai'
    },
    {
      id: 'doc-4',
      title: 'Mentor Mentee Records.xlsx',
      fileName: 'Mentor_Mentee_Records.xlsx',
      fileType: 'xlsx',
      fileSize: 95000,
      description: 'Quarterly counseling and academic progress tracking for assigned student cohorts.',
      tags: ['mentoring', 'records', 'students'],
      folderId: 'fld-cse-mentor',
      departmentId: 'dept-cse',
      uploaderId: 'usr-fac-cse',
      uploaderName: 'Rahul Sharma',
      uploaderRole: 'Teaching Staff',
      ownerId: 'usr-fac-cse',
      ownerName: 'Rahul Sharma',
      content: 'PK\x03\x04 UniVault GSFC University Spreadsheet - Mentor Mentee Cohort Records'
    },
    {
      id: 'doc-5',
      title: 'Department Meeting.pptx',
      fileName: 'Department_Meeting.pptx',
      fileType: 'pptx',
      fileSize: 1240000,
      description: 'Departmental faculty meeting presentation slides covering mid-term agenda.',
      tags: ['meeting', 'presentation', 'cse'],
      folderId: 'fld-cse-admin',
      departmentId: 'dept-cse',
      uploaderId: 'usr-hod-cse',
      uploaderName: 'Dr. Amit Patel',
      uploaderRole: 'HoD',
      ownerId: 'usr-hod-cse',
      ownerName: 'Dr. Amit Patel',
      content: 'PK\x03\x04 UniVault GSFC University Presentation - Minutes and Strategy'
    },
    {
      id: 'doc-6',
      title: 'Annual Department Report.pdf',
      fileName: 'Annual_Department_Report.pdf',
      fileType: 'pdf',
      fileSize: 840000,
      description: 'Consolidated university annual audit submitted to executive council.',
      tags: ['audit', 'annual', 'executive'],
      folderId: 'fld-global-official',
      departmentId: 'dept-adm',
      uploaderId: 'usr-dean',
      uploaderName: 'Dr. Priya Shah',
      uploaderRole: 'Dean / Administration',
      ownerId: 'usr-dean',
      ownerName: 'Dr. Priya Shah',
      content: '%PDF-1.4\n% UniVault GSFC University Document\nOffice of the Dean - Institutional Audit'
    },
    {
      id: 'doc-7',
      title: 'Mechanical Thermal Analysis.pdf',
      fileName: 'Mechanical_Thermal_Analysis.pdf',
      fileType: 'pdf',
      fileSize: 320000,
      description: 'Experimental thermal distribution in turbine blades.',
      tags: ['thermal', 'mechanical', 'research'],
      folderId: 'fld-me-research',
      departmentId: 'dept-me',
      uploaderId: 'usr-fac-me',
      uploaderName: 'Prof. Vikram Joshi',
      uploaderRole: 'Teaching Staff',
      ownerId: 'usr-fac-me',
      ownerName: 'Prof. Vikram Joshi',
      content: '%PDF-1.4\n% UniVault GSFC University Document\nMechanical Engineering Department - Thermal Laboratory Report'
    }
  ];

  for (const doc of sampleFiles) {
    const filePath = path.join(uploadsDir, `${doc.id}_${doc.fileName}`);
    fs.writeFileSync(filePath, doc.content, 'utf8');

    await db.query(
      `INSERT INTO documents (
        id, title, file_name, file_path, file_type, file_size, description, tags,
        folder_id, department_id, uploader_id, uploader_name, uploader_role,
        owner_id, owner_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
      [
        doc.id,
        doc.title,
        doc.fileName,
        filePath,
        doc.fileType,
        doc.fileSize,
        doc.description,
        JSON.stringify(doc.tags),
        doc.folderId,
        doc.departmentId,
        doc.uploaderId,
        doc.uploaderName,
        doc.uploaderRole,
        doc.ownerId,
        doc.ownerName
      ]
    );
  }

  // 6. Initial Audit Logs
  const initialLogs = [
    {
      id: 'log-1',
      user_id: 'usr-senior',
      user_name: 'Dr. Rajesh Mehta',
      user_email: 'senior@university.edu',
      user_role: 'Senior Management',
      action: 'LOGIN',
      target_type: 'AUTH',
      target: 'senior@university.edu',
      details: 'User logged into UniVault Secure Gateway',
      ip_address: '192.168.1.10'
    },
    {
      id: 'log-2',
      user_id: 'usr-dean',
      user_name: 'Dr. Priya Shah',
      user_email: 'dean@university.edu',
      user_role: 'Dean / Administration',
      action: 'FOLDER_CREATED',
      target_type: 'FOLDER',
      target: 'Official Documents',
      details: 'Created global university archive folder',
      ip_address: '192.168.1.15'
    },
    {
      id: 'log-3',
      user_id: 'usr-hod-cse',
      user_name: 'Dr. Amit Patel',
      user_email: 'hod.cse@university.edu',
      user_role: 'HoD',
      action: 'DOCUMENT_UPLOADED',
      target_type: 'DOCUMENT',
      target: 'CSE Academic Report.pdf',
      details: 'Uploaded department performance review',
      ip_address: '192.168.1.22'
    },
    {
      id: 'log-4',
      user_id: 'usr-fac-cse',
      user_name: 'Rahul Sharma',
      user_email: 'faculty.cse@university.edu',
      user_role: 'Teaching Staff',
      action: 'DOCUMENT_UPLOADED',
      target_type: 'DOCUMENT',
      target: 'AI Research Proposal.pdf',
      details: 'Uploaded neural architecture search proposal',
      ip_address: '192.168.1.45'
    }
  ];

  for (const log of initialLogs) {
    await db.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_email, user_role, action, target_type, target, details, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - INTERVAL '1 hour')`,
      [log.id, log.user_id, log.user_name, log.user_email, log.user_role, log.action, log.target_type, log.target, log.details, log.ip_address]
    );
  }

  console.log('[Database] Seeding successfully completed!');
}
