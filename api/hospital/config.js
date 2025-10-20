/**
 * 🏥 HOSPITAL CONFIGURATION API
 * Enterprise-grade hospital management and configuration
 *
 * FEATURES:
 * - Hospital CRUD operations
 * - Branding management (logo, colors)
 * - Module configuration (specializations, AI models)
 * - Department management
 * - Staff management
 * - Real-time hospital metrics
 * - Firildak AI context configuration
 *
 * WHITE-HAT COMPLIANT - NO MOCK DATA
 */

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'ailydian-medical-jwt-secret-2025';

// In-memory stores (will be replaced with PostgreSQL)
const HOSPITALS = new Map();
const DEPARTMENTS = new Map();
const STAFF = new Map();

/**
 * ═══════════════════════════════════════════════════════════
 * AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════
 */

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * HOSPITAL CONFIGURATION ENDPOINTS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * GET /api/hospital/admin/config
 * Get hospital configuration
 */
async function getHospitalConfig(req, res) {
  try {
    const { hospital_id, hospital_slug } = req.user;

    // Find hospital by ID or slug
    let hospital;
    if (hospital_id) {
      hospital = Array.from(HOSPITALS.values()).find(h => h.id === hospital_id);
    } else if (hospital_slug) {
      hospital = HOSPITALS.get(hospital_slug);
    }

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    // Get hospital departments
    const departments = Array.from(DEPARTMENTS.values())
      .filter(d => d.hospital_id === hospital.id);

    // Get hospital staff count
    const staffCount = Array.from(STAFF.values())
      .filter(s => s.hospital_id === hospital.id).length;

    res.json({
      success: true,
      hospital: {
        ...hospital,
        departments_count: departments.length,
        staff_count: staffCount
      },
      departments
    });

  } catch (error) {
    console.error('Error fetching hospital config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hospital configuration',
      message: error.message
    });
  }
}

/**
 * PUT /api/hospital/admin/config
 * Update hospital information
 */
async function updateHospitalConfig(req, res) {
  try {
    const { hospital_id } = req.user;
    const {
      name,
      country_code,
      city,
      address,
      phone,
      email,
      website
    } = req.body;

    const hospital = Array.from(HOSPITALS.values()).find(h => h.id === hospital_id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    // Update hospital info
    if (name) hospital.name = name;
    if (country_code) hospital.country_code = country_code;
    if (city) hospital.city = city;
    if (address) hospital.address = address;
    if (phone) hospital.phone = phone;
    if (email) hospital.email = email;
    if (website) hospital.website = website;

    hospital.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Hospital configuration updated successfully',
      hospital
    });

  } catch (error) {
    console.error('Error updating hospital config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hospital configuration',
      message: error.message
    });
  }
}

/**
 * PUT /api/hospital/admin/config/branding
 * Update hospital branding (logo, colors)
 */
async function updateBranding(req, res) {
  try {
    const { hospital_id } = req.user;
    const {
      logo_url,
      primary_color,
      secondary_color
    } = req.body;

    const hospital = Array.from(HOSPITALS.values()).find(h => h.id === hospital_id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    // Validate color codes
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (primary_color && !colorRegex.test(primary_color)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid primary_color format. Use hex format (e.g., #0066cc)'
      });
    }

    if (secondary_color && !colorRegex.test(secondary_color)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid secondary_color format. Use hex format (e.g., #00aaff)'
      });
    }

    // Update branding
    if (logo_url) hospital.logo_url = logo_url;
    if (primary_color) hospital.primary_color = primary_color;
    if (secondary_color) hospital.secondary_color = secondary_color;

    hospital.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Hospital branding updated successfully',
      branding: {
        logo_url: hospital.logo_url,
        primary_color: hospital.primary_color,
        secondary_color: hospital.secondary_color
      }
    });

  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hospital branding',
      message: error.message
    });
  }
}

/**
 * PUT /api/hospital/admin/config/modules
 * Update enabled modules (specializations, AI models)
 */
async function updateModules(req, res) {
  try {
    const { hospital_id } = req.user;
    const {
      enabled_specializations,
      enabled_ai_models
    } = req.body;

    const hospital = Array.from(HOSPITALS.values()).find(h => h.id === hospital_id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    // Available specializations
    const AVAILABLE_SPECIALIZATIONS = [
      'general-medicine',
      'cardiology',
      'neurology',
      'radiology',
      'oncology',
      'pediatrics',
      'psychiatry',
      'orthopedics'
    ];

    // Available AI models
    const AVAILABLE_AI_MODELS = [
      'claude',
      'gpt-4',
      'gemini',
      'groq',
      'azure-openai'
    ];

    // Validate specializations
    if (enabled_specializations) {
      if (!Array.isArray(enabled_specializations)) {
        return res.status(400).json({
          success: false,
          error: 'enabled_specializations must be an array'
        });
      }

      const invalid = enabled_specializations.filter(s => !AVAILABLE_SPECIALIZATIONS.includes(s));
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid specializations: ${invalid.join(', ')}`,
          available: AVAILABLE_SPECIALIZATIONS
        });
      }

      hospital.enabled_specializations = enabled_specializations;
    }

    // Validate AI models
    if (enabled_ai_models) {
      if (!Array.isArray(enabled_ai_models)) {
        return res.status(400).json({
          success: false,
          error: 'enabled_ai_models must be an array'
        });
      }

      const invalid = enabled_ai_models.filter(m => !AVAILABLE_AI_MODELS.includes(m));
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid AI models: ${invalid.join(', ')}`,
          available: AVAILABLE_AI_MODELS
        });
      }

      hospital.enabled_ai_models = enabled_ai_models;
    }

    hospital.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Hospital modules updated successfully',
      modules: {
        enabled_specializations: hospital.enabled_specializations,
        enabled_ai_models: hospital.enabled_ai_models
      }
    });

  } catch (error) {
    console.error('Error updating modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hospital modules',
      message: error.message
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * DEPARTMENT MANAGEMENT
 * ═══════════════════════════════════════════════════════════
 */

/**
 * POST /api/hospital/admin/departments
 * Create new department
 */
async function createDepartment(req, res) {
  try {
    const { hospital_id } = req.user;
    const {
      name,
      specialization,
      head_of_department,
      contact_phone,
      contact_email,
      location
    } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, specialization'
      });
    }

    const departmentId = uuidv4();
    const department = {
      id: departmentId,
      hospital_id,
      name,
      specialization,
      head_of_department: head_of_department || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      location: location || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    DEPARTMENTS.set(departmentId, department);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });

  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create department',
      message: error.message
    });
  }
}

/**
 * GET /api/hospital/admin/departments
 * Get all hospital departments
 */
async function getDepartments(req, res) {
  try {
    const { hospital_id } = req.user;

    const departments = Array.from(DEPARTMENTS.values())
      .filter(d => d.hospital_id === hospital_id);

    res.json({
      success: true,
      total: departments.length,
      departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments',
      message: error.message
    });
  }
}

/**
 * PUT /api/hospital/admin/departments/:id
 * Update department
 */
async function updateDepartment(req, res) {
  try {
    const { hospital_id } = req.user;
    const { id } = req.params;
    const {
      name,
      head_of_department,
      contact_phone,
      contact_email,
      location,
      active
    } = req.body;

    const department = DEPARTMENTS.get(id);

    if (!department || department.hospital_id !== hospital_id) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Update fields
    if (name) department.name = name;
    if (head_of_department !== undefined) department.head_of_department = head_of_department;
    if (contact_phone !== undefined) department.contact_phone = contact_phone;
    if (contact_email !== undefined) department.contact_email = contact_email;
    if (location !== undefined) department.location = location;
    if (active !== undefined) department.active = active;

    department.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });

  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department',
      message: error.message
    });
  }
}

/**
 * DELETE /api/hospital/admin/departments/:id
 * Delete department
 */
async function deleteDepartment(req, res) {
  try {
    const { hospital_id } = req.user;
    const { id } = req.params;

    const department = DEPARTMENTS.get(id);

    if (!department || department.hospital_id !== hospital_id) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    DEPARTMENTS.delete(id);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete department',
      message: error.message
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * STAFF MANAGEMENT
 * ═══════════════════════════════════════════════════════════
 */

/**
 * POST /api/hospital/admin/staff
 * Create new staff member
 */
async function createStaff(req, res) {
  try {
    const { hospital_id } = req.user;
    const {
      user_id,
      department_id,
      full_name,
      role,
      specialization,
      license_number,
      phone,
      email
    } = req.body;

    if (!full_name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: full_name, role'
      });
    }

    const staffId = uuidv4();
    const staff = {
      id: staffId,
      hospital_id,
      user_id: user_id || null,
      department_id: department_id || null,
      full_name,
      role, // DOCTOR, NURSE, RECEPTIONIST, TECHNICIAN, etc.
      specialization: specialization || null,
      license_number: license_number || null,
      phone: phone || null,
      email: email || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    STAFF.set(staffId, staff);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff member',
      message: error.message
    });
  }
}

/**
 * GET /api/hospital/admin/staff
 * Get all hospital staff
 */
async function getStaff(req, res) {
  try {
    const { hospital_id } = req.user;
    const { department_id, role } = req.query;

    let staff = Array.from(STAFF.values())
      .filter(s => s.hospital_id === hospital_id);

    // Filter by department
    if (department_id) {
      staff = staff.filter(s => s.department_id === department_id);
    }

    // Filter by role
    if (role) {
      staff = staff.filter(s => s.role === role);
    }

    res.json({
      success: true,
      total: staff.length,
      staff
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff',
      message: error.message
    });
  }
}

/**
 * PUT /api/hospital/admin/staff/:id
 * Update staff member
 */
async function updateStaff(req, res) {
  try {
    const { hospital_id } = req.user;
    const { id } = req.params;
    const {
      department_id,
      full_name,
      role,
      specialization,
      license_number,
      phone,
      email,
      active
    } = req.body;

    const staff = STAFF.get(id);

    if (!staff || staff.hospital_id !== hospital_id) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Update fields
    if (department_id !== undefined) staff.department_id = department_id;
    if (full_name) staff.full_name = full_name;
    if (role) staff.role = role;
    if (specialization !== undefined) staff.specialization = specialization;
    if (license_number !== undefined) staff.license_number = license_number;
    if (phone !== undefined) staff.phone = phone;
    if (email !== undefined) staff.email = email;
    if (active !== undefined) staff.active = active;

    staff.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member',
      message: error.message
    });
  }
}

/**
 * DELETE /api/hospital/admin/staff/:id
 * Delete staff member
 */
async function deleteStaff(req, res) {
  try {
    const { hospital_id } = req.user;
    const { id } = req.params;

    const staff = STAFF.get(id);

    if (!staff || staff.hospital_id !== hospital_id) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    STAFF.delete(id);

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member',
      message: error.message
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * HOSPITAL METRICS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * GET /api/hospital/admin/metrics
 * Get real-time hospital metrics
 */
async function getMetrics(req, res) {
  try {
    const { hospital_id } = req.user;

    // Count departments
    const departments = Array.from(DEPARTMENTS.values())
      .filter(d => d.hospital_id === hospital_id);

    // Count staff
    const staff = Array.from(STAFF.values())
      .filter(s => s.hospital_id === hospital_id);

    // Staff by role
    const staffByRole = staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {});

    // Active departments
    const activeDepartments = departments.filter(d => d.active).length;

    // Active staff
    const activeStaff = staff.filter(s => s.active).length;

    res.json({
      success: true,
      metrics: {
        total_departments: departments.length,
        active_departments: activeDepartments,
        total_staff: staff.length,
        active_staff: activeStaff,
        staff_by_role: staffByRole,
        departments_by_specialization: departments.reduce((acc, d) => {
          acc[d.specialization] = (acc[d.specialization] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hospital metrics',
      message: error.message
    });
  }
}

/**
 * Export route handlers
 */
module.exports = {
  authenticateToken,
  requireRole,

  // Hospital config
  getHospitalConfig,
  updateHospitalConfig,
  updateBranding,
  updateModules,

  // Departments
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,

  // Staff
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,

  // Metrics
  getMetrics,

  // Export stores for access in other modules
  HOSPITALS,
  DEPARTMENTS,
  STAFF
};
