/**
 * Governance Authentication API - Register
 *
 * Handles user registration for AI Governance Dashboard
 *
 * @module api/governance/auth/register
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, ROLES } = require('../../../middleware/auth-governance');
const { getPrismaClient, safeQuery } = require('../prisma-client');

const router = express.Router();

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Validate password strength
 *
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    };
  }

  return { valid: true };
}

/**
 * POST /api/governance/auth/register
 *
 * Register a new user for governance dashboard
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   name: string,
 *   role?: string (default: MODEL_OWNER)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   token: string,
 *   user: {
 *     id: string,
 *     email: string,
 *     name: string,
 *     role: string
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, password, and name are required',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: passwordValidation.error,
      });
    }

    // Role validation (if provided)
    const userRole = role || ROLES.MODEL_OWNER;
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent direct ADMIN registration (must be created by another ADMIN)
    if (userRole === ROLES.ADMIN && !req.user) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin accounts must be created by an existing admin',
      });
    }

    // Create user
    const result = await safeQuery(
      async (prisma) => {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          return {
            success: false,
            error: 'user_exists',
          };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12); // 12 rounds

        // Create user
        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            passwordHash,
            role: userRole,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

        // Generate JWT token
        const token = generateToken(user);

        // Create initial session
        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown',
          },
        });

        // Audit log
        await prisma.governanceAuditLog.create({
          data: {
            userId: user.id,
            action: 'USER_REGISTERED',
            resource: 'user',
            details: {
              email: user.email,
              role: user.role,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
          },
        }).catch(() => {
          // Ignore audit log errors
        });

        return {
          success: true,
          token,
          user,
        };
      },
      // Fallback for mock mode
      () => {
        const mockUser = {
          id: 'mock-user-' + Date.now(),
          email: email.toLowerCase(),
          name,
          role: userRole,
          createdAt: new Date(),
        };

        const token = generateToken(mockUser);

        return {
          success: true,
          token,
          user: mockUser,
          warning: 'Using mock authentication (database not available)',
        };
      }
    );

    if (!result.success) {
      if (result.error === 'user_exists') {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'An account with this email already exists',
        });
      }

      throw new Error(result.error);
    }

    // Success response
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during registration',
    });
  }
});

/**
 * GET /api/governance/auth/validate-email
 *
 * Check if email is available
 *
 * Query params:
 * - email: string
 */
router.get('/validate-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required',
      });
    }

    const exists = await safeQuery(
      async (prisma) => {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        });
        return !!user;
      },
      () => false // Mock mode - always available
    );

    res.json({
      success: true,
      available: !exists,
      message: exists ? 'Email already in use' : 'Email available',
    });
  } catch (error) {
    console.error('Email validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message,
    });
  }
});

module.exports = router;
