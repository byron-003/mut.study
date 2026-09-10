import { query } from '../config/database.js';

/**
 * Search across programs, courses, and study materials
 */
export const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    console.log('🔍 Search request received:', { query: q });

    if (!q || q.trim().length < 2) {
      console.log('⚠️ Query too short or empty');
      return res.json({
        success: true,
        data: {
          programs: [],
          courses: [],
          resources: []
        }
      });
    }

    const searchTerm = q.trim();
    console.log('🔍 Searching for:', searchTerm);

    // Search programs using ILIKE (case-insensitive pattern matching)
    const programsResult = await query(
      `SELECT 
        p.id, p.name, p.code, p.level,
        d.name as department_name,
        s.name as school_name, s.code as school_code
      FROM programs p
      JOIN departments d ON p.department_id = d.id
      JOIN schools s ON d.school_id = s.id
      WHERE 
        p.name ILIKE $1 OR 
        p.code ILIKE $1 OR
        d.name ILIKE $1 OR
        s.name ILIKE $1
      ORDER BY 
        CASE 
          WHEN p.code ILIKE $1 THEN 1
          WHEN p.name ILIKE $1 THEN 2
          ELSE 3
        END,
        p.name
      LIMIT 10`,
      [`%${searchTerm}%`]
    );

    // Search courses using ILIKE
    const coursesResult = await query(
      `SELECT 
        c.id, c.unit_code, c.unit_title, c.academic_year, c.semester, c.credits,
        p.name as program_name, p.code as program_code, p.level,
        d.name as department_name,
        s.name as school_name
      FROM courses c
      JOIN programs p ON c.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN schools s ON d.school_id = s.id
      WHERE 
        c.unit_code ILIKE $1 OR 
        c.unit_title ILIKE $1
      ORDER BY 
        CASE 
          WHEN c.unit_code ILIKE $1 THEN 1
          WHEN c.unit_title ILIKE $1 THEN 2
          ELSE 3
        END,
        c.unit_code
      LIMIT 15`,
      [`%${searchTerm}%`]
    );

    // Search study materials (only approved resources)
    const resourcesResult = await query(
      `SELECT 
        sm.id, sm.title, sm.description, sm.category, sm.file_size, sm.download_count,
        sm.created_at, sm.file_url,
        c.unit_code, c.unit_title, c.academic_year, c.semester,
        p.name as program_name, p.code as program_code,
        u.first_name as uploader_first_name, u.last_name as uploader_last_name
      FROM study_materials sm
      JOIN courses c ON sm.course_id = c.id
      JOIN programs p ON c.program_id = p.id
      JOIN users u ON sm.uploader_id = u.id
      WHERE 
        sm.status = 'approved' AND
        (sm.title ILIKE $1 OR 
         sm.description ILIKE $1 OR
         c.unit_code ILIKE $1 OR
         c.unit_title ILIKE $1)
      ORDER BY 
        CASE 
          WHEN sm.title ILIKE $1 THEN 1
          WHEN c.unit_code ILIKE $1 THEN 2
          ELSE 3
        END,
        sm.download_count DESC,
        sm.created_at DESC
      LIMIT 20`,
      [`%${searchTerm}%`]
    );

    console.log('📊 Search results:', {
      programs: programsResult.rows.length,
      courses: coursesResult.rows.length,
      resources: resourcesResult.rows.length
    });

    res.json({
      success: true,
      data: {
        programs: programsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          code: row.code,
          level: row.level,
          department: row.department_name,
          school: row.school_name,
          schoolCode: row.school_code
        })),
        courses: coursesResult.rows.map(row => ({
          id: row.id,
          unitCode: row.unit_code,
          unitTitle: row.unit_title,
          year: row.academic_year,
          semester: row.semester,
          credits: row.credits,
          program: {
            name: row.program_name,
            code: row.program_code,
            level: row.level
          },
          department: row.department_name,
          school: row.school_name
        })),
        resources: resourcesResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.category,
          category: row.category,
          fileSize: row.file_size,
          downloadCount: row.download_count,
          fileUrl: row.file_url,
          course: {
            unitCode: row.unit_code,
            unitTitle: row.unit_title,
            year: row.academic_year,
            semester: row.semester
          },
          program: {
            name: row.program_name,
            code: row.program_code
          },
          uploader: {
            firstName: row.uploader_first_name,
            lastName: row.uploader_last_name
          },
          createdAt: row.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get autocomplete suggestions
 */
export const autocomplete = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = `%${q.trim()}%`;
    let results = [];

    if (type === 'programs' || type === 'all') {
      const programsResult = await query(
        `SELECT 
          'program' as type,
          p.id, 
          p.name as label, 
          p.code,
          s.name as school_name
        FROM programs p
        JOIN departments d ON p.department_id = d.id
        JOIN schools s ON d.school_id = s.id
        WHERE p.name ILIKE $1 OR p.code ILIKE $1
        ORDER BY p.name
        LIMIT 5`,
        [searchTerm]
      );
      results = [...results, ...programsResult.rows];
    }

    if (type === 'courses' || type === 'all') {
      const coursesResult = await query(
        `SELECT 
          'course' as type,
          c.id, 
          c.unit_code || ' - ' || c.unit_title as label,
          c.unit_code as code,
          p.name as program_name
        FROM courses c
        JOIN programs p ON c.program_id = p.id
        WHERE c.unit_code ILIKE $1 OR c.unit_title ILIKE $1
        ORDER BY c.unit_code
        LIMIT 5`,
        [searchTerm]
      );
      results = [...results, ...coursesResult.rows];
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
