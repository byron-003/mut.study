-- Create study progress tracking table
CREATE TABLE IF NOT EXISTS study_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_position VARCHAR(500), -- Stores scroll position, page number, or timestamp for videos
    completed BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0, -- Total time spent in seconds
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id)
);

-- Create index for faster lookups
CREATE INDEX idx_study_progress_user_id ON study_progress(user_id);
CREATE INDEX idx_study_progress_resource_id ON study_progress(resource_id);
CREATE INDEX idx_study_progress_completed ON study_progress(completed);
CREATE INDEX idx_study_progress_last_accessed ON study_progress(last_accessed DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_study_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Auto-complete if progress is 100%
    IF NEW.progress_percentage >= 100 AND NEW.completed = FALSE THEN
        NEW.completed = TRUE;
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamps
CREATE TRIGGER trigger_update_study_progress_updated_at
    BEFORE UPDATE ON study_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_study_progress_updated_at();

-- Create study streaks table
CREATE TABLE IF NOT EXISTS study_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_study_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create index for study streaks
CREATE INDEX idx_study_streaks_user_id ON study_streaks(user_id);

-- Create function to update study streaks
CREATE OR REPLACE FUNCTION update_study_streak(p_user_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_last_study_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    -- Get current streak data
    SELECT last_study_date, current_streak, longest_streak
    INTO v_last_study_date, v_current_streak, v_longest_streak
    FROM study_streaks
    WHERE user_id = p_user_id;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO study_streaks (user_id, current_streak, longest_streak, last_study_date)
        VALUES (p_user_id, 1, 1, CURRENT_DATE);
        RETURN;
    END IF;
    
    -- If studying today for the first time
    IF v_last_study_date < CURRENT_DATE THEN
        -- Check if it's consecutive day
        IF v_last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Increment streak
            v_current_streak := v_current_streak + 1;
            
            -- Update longest streak if needed
            IF v_current_streak > v_longest_streak THEN
                v_longest_streak := v_current_streak;
            END IF;
        ELSE
            -- Streak broken, reset to 1
            v_current_streak := 1;
        END IF;
        
        -- Update the record
        UPDATE study_streaks
        SET current_streak = v_current_streak,
            longest_streak = v_longest_streak,
            last_study_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create study sessions table for detailed analytics
CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    duration INTEGER, -- Duration in seconds
    progress_at_start INTEGER DEFAULT 0,
    progress_at_end INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for study sessions
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_resource_id ON study_sessions(resource_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at DESC);

-- Insert initial data for existing users (optional)
-- This creates empty progress records that will be updated as users study
-- Not inserting anything by default - progress will be created on first access

COMMENT ON TABLE study_progress IS 'Tracks student progress through study materials';
COMMENT ON TABLE study_streaks IS 'Tracks daily study streaks for gamification';
COMMENT ON TABLE study_sessions IS 'Detailed session tracking for analytics';
