/**
 * Ailydian Ultra Pro - Authentication Server
 * Main server with user authentication system
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const authRoutes = require('./api/auth');
app.use('/api/auth', authRoutes);

// Azure Multimodal Legal AI Routes
try {
    const azureMultimodalRoutes = require('./routes/azure-multimodal-routes');
    app.use('/api/azure/legal', azureMultimodalRoutes);
    console.log('✅ Azure Multimodal Legal AI routes loaded');
} catch (e) {
    console.warn('⚠️ Azure Multimodal routes not available:', e.message);
}

// Legal AI Routes (Translation, GDPR, etc.)
try {
    const legalAIRoutes = require('./routes/legal-ai-routes');
    app.use('/api/legal-ai', legalAIRoutes);
    console.log('✅ Legal AI routes loaded (Translation, GDPR, Legal Systems)');
} catch (e) {
    console.warn('⚠️ Legal AI routes not available:', e.message);
}

// Chat API (for legal analysis)
try {
    const chatService = require('./services/specialized-chat-service');
    app.post('/api/chat', async (req, res) => {
        try {
            const { model, message, temperature, max_tokens, history } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            const result = await chatService.chat({
                model: model || 'gpt-4-turbo',
                messages: [
                    ...(history || []),
                    { role: 'user', content: message }
                ],
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 2048
            });

            res.json({
                success: true,
                response: result.content,
                model: result.model,
                usage: result.usage
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    console.log('✅ Chat API endpoint loaded');
} catch (e) {
    console.warn('⚠️ Chat service not available:', e.message);
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Database status
app.get('/api/db-status', (req, res) => {
    try {
        const { getDatabase } = require('./database/init-db');
        const db = getDatabase();

        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expiresAt > datetime("now")').get();

        db.close();

        res.json({
            success: true,
            database: 'connected',
            users: userCount.count,
            activeSessions: sessionCount.count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database error'
        });
    }
});

// Catch-all route for SPA (removed - causing Express 5 compatibility issues)
// Let static files middleware handle all routes

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   AILYDIAN ULTRA PRO - AUTHENTICATION SERVER');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(`   🚀 Server running on: http://localhost:${PORT}`);
    console.log(`   🔐 Login page: http://localhost:${PORT}/login.html`);
    console.log(`   📝 Register page: http://localhost:${PORT}/register.html`);
    console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`   🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`   💾 Database status: http://localhost:${PORT}/api/db-status`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
