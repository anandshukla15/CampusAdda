ALTER TABLE event_activities
    ADD COLUMN IF NOT EXISTS registration_open TINYINT(1) DEFAULT 1;

CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    registration_id VARCHAR(50) UNIQUE,
    status ENUM('registered', 'cancelled', 'completed') DEFAULT 'registered',
    payment_status ENUM('free', 'pending', 'paid') DEFAULT 'free',
    attendance_status ENUM('pending', 'present', 'absent') DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES event_activities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_activity (user_id, activity_id),
    INDEX idx_registrations_activity (activity_id),
    INDEX idx_registrations_user (user_id),
    INDEX idx_registrations_status (status)
);