-- ==========================================
-- MEDICAL FILE TRACKING & USER UPLOADS
-- Complete tracking system for all file uploads and medical operations
-- ==========================================

-- User Uploaded Files
CREATE TABLE IF NOT EXISTS user_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- File Information
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(255),

    -- Medical File Specific
    is_medical BOOLEAN DEFAULT FALSE,
    medical_type VARCHAR(100), -- 'DICOM', 'X-Ray', 'MRI', 'CT', 'Lab Result', 'Medical Record'
    dicom_metadata JSONB,
    detected_device JSONB,

    -- Storage Information
    storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'azure', 'aws'
    storage_path TEXT,
    azure_blob_url TEXT,

    -- Processing Status
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed', 'deleted')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,

    -- Analysis Results
    ai_analysis_results JSONB DEFAULT '[]',
    analysis_summary TEXT,
    confidence_scores JSONB,

    -- Security & Privacy
    encrypted BOOLEAN DEFAULT FALSE,
    encryption_key_id VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'organization', 'public')),
    shared_with UUID[],

    -- Metadata
    tags TEXT[],
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit
    upload_ip INET,
    upload_device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes for fast queries
    CONSTRAINT valid_file_size CHECK (file_size > 0)
);

-- Medical Analysis Sessions
CREATE TABLE IF NOT EXISTS medical_analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,

    -- Session Information
    session_type VARCHAR(100) NOT NULL, -- 'fireworks_ai', 'velocity_rag', 'device_detection', 'azure_vision'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

    -- Analysis Details
    model_used VARCHAR(255),
    analysis_type VARCHAR(100),
    input_parameters JSONB DEFAULT '{}',

    -- Results
    analysis_result JSONB,
    confidence_score DECIMAL(5,4),
    processing_time_ms INTEGER,

    -- Tokens & Costs
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost DECIMAL(10,6),

    -- Error Handling
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Medical Device Detection Results
CREATE TABLE IF NOT EXISTS medical_device_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES medical_analysis_sessions(id),

    -- Device Information
    detected BOOLEAN DEFAULT FALSE,
    manufacturer VARCHAR(255),
    manufacturer_full_name VARCHAR(255),
    device_model VARCHAR(255),
    device_type VARCHAR(255),
    device_serial VARCHAR(255),

    -- Modality Information
    modality VARCHAR(50),
    modality_full VARCHAR(255),
    study_description TEXT,

    -- DICOM Tags
    station_name VARCHAR(255),
    institution_name VARCHAR(255),
    software_versions TEXT,
    acquisition_date DATE,
    acquisition_time TIME,

    -- Detection Quality
    confidence DECIMAL(5,4),
    detection_method VARCHAR(100),

    -- Raw Data
    dicom_tags JSONB,
    raw_metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Upload Statistics
CREATE TABLE IF NOT EXISTS user_upload_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Upload Counts
    total_uploads INTEGER DEFAULT 0,
    medical_uploads INTEGER DEFAULT 0,
    document_uploads INTEGER DEFAULT 0,
    image_uploads INTEGER DEFAULT 0,

    -- File Types
    dicom_files INTEGER DEFAULT 0,
    pdf_files INTEGER DEFAULT 0,
    image_files INTEGER DEFAULT 0,
    other_files INTEGER DEFAULT 0,

    -- Storage
    total_bytes BIGINT DEFAULT 0,
    storage_used_mb DECIMAL(12,2) DEFAULT 0,

    -- Analysis
    ai_analyses_run INTEGER DEFAULT 0,
    device_detections INTEGER DEFAULT 0,
    successful_analyses INTEGER DEFAULT 0,
    failed_analyses INTEGER DEFAULT 0,

    -- Costs
    total_tokens_used INTEGER DEFAULT 0,
    estimated_total_cost DECIMAL(10,6) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- File Sharing & Access Control
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Access Information
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'edit', 'delete', 'share')),
    success BOOLEAN DEFAULT TRUE,

    -- Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Consultation Records (linking files to consultations)
CREATE TABLE IF NOT EXISTS medical_consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Consultation Info
    consultation_type VARCHAR(100) NOT NULL,
    patient_info JSONB, -- encrypted patient data

    -- Medical Professional (if applicable)
    physician_id UUID REFERENCES users(id),
    physician_name VARCHAR(255),
    physician_specialty VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER,

    -- Results
    diagnosis TEXT,
    recommendations TEXT,
    prescription JSONB,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultation Files (many-to-many relationship)
CREATE TABLE IF NOT EXISTS consultation_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES medical_consultations(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,

    -- Relationship Info
    file_role VARCHAR(100), -- 'primary_scan', 'supporting_document', 'lab_result', 'previous_record'
    relevance_score DECIMAL(3,2),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(consultation_id, file_id)
);

-- User Activity Feed
CREATE TABLE IF NOT EXISTS user_activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Activity Information
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Related Entities
    related_file_id UUID REFERENCES user_files(id) ON DELETE SET NULL,
    related_consultation_id UUID REFERENCES medical_consultations(id) ON DELETE SET NULL,
    related_analysis_id UUID REFERENCES medical_analysis_sessions(id) ON DELETE SET NULL,

    -- Display
    icon VARCHAR(100),
    color VARCHAR(50),
    action_url TEXT,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for timeline queries
    CONSTRAINT activity_created_at_idx CHECK (created_at IS NOT NULL)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- User Files Indexes
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_created_at ON user_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_files_status ON user_files(status);
CREATE INDEX IF NOT EXISTS idx_user_files_medical_type ON user_files(medical_type) WHERE is_medical = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_files_file_type ON user_files(file_type);
CREATE INDEX IF NOT EXISTS idx_user_files_deleted_at ON user_files(deleted_at) WHERE deleted_at IS NULL;

-- Analysis Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON medical_analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_file_id ON medical_analysis_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON medical_analysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON medical_analysis_sessions(created_at DESC);

-- Device Detections Indexes
CREATE INDEX IF NOT EXISTS idx_device_detections_file_id ON medical_device_detections(file_id);
CREATE INDEX IF NOT EXISTS idx_device_detections_manufacturer ON medical_device_detections(manufacturer);
CREATE INDEX IF NOT EXISTS idx_device_detections_modality ON medical_device_detections(modality);

-- Upload Stats Indexes
CREATE INDEX IF NOT EXISTS idx_upload_stats_user_date ON user_upload_stats(user_id, date DESC);

-- Access Logs Indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON file_access_logs(created_at DESC);

-- Consultations Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON medical_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_physician_id ON medical_consultations(physician_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON medical_consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON medical_consultations(scheduled_at);

-- Activity Feed Indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON user_activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON user_activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_is_read ON user_activity_feed(is_read) WHERE is_read = FALSE;

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Update user_files.updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_files_updated_at BEFORE UPDATE ON user_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON medical_consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_stats_updated_at BEFORE UPDATE ON user_upload_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically create activity feed entry when file is uploaded
CREATE OR REPLACE FUNCTION create_upload_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity_feed (
        user_id,
        activity_type,
        activity_category,
        title,
        description,
        related_file_id,
        icon,
        color,
        metadata
    ) VALUES (
        NEW.user_id,
        'file_uploaded',
        'uploads',
        'File Uploaded',
        'Uploaded ' || NEW.original_filename,
        NEW.id,
        'upload',
        CASE
            WHEN NEW.is_medical THEN '#8B5CF6'
            ELSE '#3B82F6'
        END,
        jsonb_build_object(
            'file_type', NEW.file_type,
            'file_size', NEW.file_size,
            'is_medical', NEW.is_medical
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upload_activity AFTER INSERT ON user_files
    FOR EACH ROW EXECUTE FUNCTION create_upload_activity();

-- Update upload stats when file is uploaded
CREATE OR REPLACE FUNCTION update_upload_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_upload_stats (user_id, date)
    VALUES (NEW.user_id, CURRENT_DATE)
    ON CONFLICT (user_id, date) DO NOTHING;

    UPDATE user_upload_stats
    SET total_uploads = total_uploads + 1,
        medical_uploads = medical_uploads + CASE WHEN NEW.is_medical THEN 1 ELSE 0 END,
        total_bytes = total_bytes + NEW.file_size,
        storage_used_mb = ROUND((total_bytes + NEW.file_size)::numeric / 1048576, 2),
        dicom_files = dicom_files + CASE WHEN NEW.medical_type = 'DICOM' THEN 1 ELSE 0 END,
        pdf_files = pdf_files + CASE WHEN NEW.file_type = 'pdf' THEN 1 ELSE 0 END,
        image_files = image_files + CASE WHEN NEW.file_type IN ('jpg', 'jpeg', 'png') THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_upload_stats AFTER INSERT ON user_files
    FOR EACH ROW EXECUTE FUNCTION update_upload_stats();

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- User Dashboard View
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
    u.id as user_id,
    u.email,
    u.display_name,
    COUNT(DISTINCT uf.id) as total_files,
    COUNT(DISTINCT CASE WHEN uf.is_medical THEN uf.id END) as medical_files,
    COUNT(DISTINCT mas.id) as total_analyses,
    COUNT(DISTINCT mc.id) as total_consultations,
    COALESCE(SUM(uf.file_size), 0) as total_storage_bytes,
    MAX(uf.created_at) as last_upload_date,
    MAX(mas.created_at) as last_analysis_date
FROM users u
LEFT JOIN user_files uf ON u.id = uf.user_id AND uf.deleted_at IS NULL
LEFT JOIN medical_analysis_sessions mas ON u.id = mas.user_id
LEFT JOIN medical_consultations mc ON u.id = mc.user_id
GROUP BY u.id, u.email, u.display_name;

-- Recent Activity View
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT
    uaf.id,
    uaf.user_id,
    uaf.activity_type,
    uaf.title,
    uaf.description,
    uaf.created_at,
    uf.filename as related_filename,
    uf.file_type as related_file_type,
    mc.consultation_type,
    mas.model_used as analysis_model
FROM user_activity_feed uaf
LEFT JOIN user_files uf ON uaf.related_file_id = uf.id
LEFT JOIN medical_consultations mc ON uaf.related_consultation_id = mc.id
LEFT JOIN medical_analysis_sessions mas ON uaf.related_analysis_id = mas.id
ORDER BY uaf.created_at DESC;

-- Medical Files Summary View
CREATE OR REPLACE VIEW medical_files_summary AS
SELECT
    uf.id,
    uf.user_id,
    uf.filename,
    uf.medical_type,
    uf.file_size,
    uf.created_at,
    mdd.manufacturer,
    mdd.device_model,
    mdd.modality,
    mdd.confidence as device_detection_confidence,
    COUNT(DISTINCT mas.id) as analysis_count,
    MAX(mas.completed_at) as last_analysis_date
FROM user_files uf
LEFT JOIN medical_device_detections mdd ON uf.id = mdd.file_id
LEFT JOIN medical_analysis_sessions mas ON uf.id = mas.file_id
WHERE uf.is_medical = TRUE AND uf.deleted_at IS NULL
GROUP BY uf.id, uf.user_id, uf.filename, uf.medical_type, uf.file_size, uf.created_at,
         mdd.manufacturer, mdd.device_model, mdd.modality, mdd.confidence;

-- Comments
COMMENT ON TABLE user_files IS 'Stores all user-uploaded files with metadata and processing status';
COMMENT ON TABLE medical_analysis_sessions IS 'Tracks all AI analysis sessions for medical files';
COMMENT ON TABLE medical_device_detections IS 'Stores detected medical device information from DICOM files';
COMMENT ON TABLE user_upload_stats IS 'Daily aggregated statistics for user uploads and usage';
COMMENT ON TABLE medical_consultations IS 'Medical consultation records linking users, files, and physicians';
COMMENT ON TABLE user_activity_feed IS 'Real-time activity feed for user dashboard';

-- ============================================================================
-- JWT AUTHENTICATION TABLES
-- ============================================================================

-- User Sessions for Refresh Token Management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(refresh_token)
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked) WHERE revoked = FALSE;

-- Trigger to update user_sessions updated_at
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_sessions IS 'JWT refresh token sessions for user authentication';
