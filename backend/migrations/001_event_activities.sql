ALTER TABLE events
  ADD COLUMN location VARCHAR(255) NULL AFTER description;

CREATE TABLE IF NOT EXISTS event_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_description TEXT NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NULL,
  registration_link VARCHAR(500) NULL,
  max_participants INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_activities_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_activities_event_id (event_id),
  INDEX idx_event_activities_event_date (event_date)
);
