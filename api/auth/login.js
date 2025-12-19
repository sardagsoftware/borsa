/**
 * USER LOGIN ENDPOINT
 * Authenticates users and issues JWT tokens
 *
 * @version 2.0.0
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');
const {
    generateAccessToken,
    generateRefreshToken
} = require('./jwt-middleware');

/**
 * Database client singleton
 */
let dbClient = null;

async function getDbClient() {
    if (!dbClient) {
        dbClient = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        await dbClient.connect();
    }
    return dbClient;
}

/**
 * Login user with email and password
 */
async function loginUser(email, password) {
    const db = await getDbClient();

    // Find user by email
    const userResult = await db.query(
        'SELECT id, email, password, role, full_name, status FROM users WHERE email = $1',
        [email]
    );

    if (userResult.rows.length === 0) {
        throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
        throw new Error(`Account is ${user.status}. Please contact support.`);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(
        user.id,
        user.email,
        user.role || 'patient',
        {
            fullName: user.full_name
        }
    );

    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in database
    await db.query(
        `INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at)
         VALUES (uuid_generate_v4(), $1, $2, NOW() + INTERVAL '7 days', NOW())`,
        [user.id, refreshToken]
    );

    // Log login activity
    await db.query(
        `INSERT INTO user_activity_feed (id, user_id, activity_type, title, description, created_at)
         VALUES (uuid_generate_v4(), $1, 'user_login', 'User Login', 'Successful login from new session', NOW())`,
        [user.id]
    );

    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role || 'patient'
        },
        accessToken,
        refreshToken,
        expiresIn: '15m'
    };
}

/**
 * API Handler
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
                code: 'INVALID_EMAIL'
            });
        }

        // Attempt login
        const loginResult = await loginUser(email, password);

        // Set refresh token as HTTP-only cookie for security
        res.setHeader('Set-Cookie', `refresh_token=${loginResult.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);

        return res.status(200).json({
            success: true,
            data: {
                user: loginResult.user,
                accessToken: loginResult.accessToken,
                expiresIn: loginResult.expiresIn
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);

        if (error.message.includes('Invalid email or password')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        if (error.message.includes('Account is')) {
            return res.status(403).json({
                success: false,
                error: error.message,
                code: 'ACCOUNT_DISABLED'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Login failed',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
}
