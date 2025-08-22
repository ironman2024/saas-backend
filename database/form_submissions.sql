CREATE TABLE IF NOT EXISTS form_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  form_type ENUM('basic', 'realtime') NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  aadhaar VARCHAR(20) NULL,
  pan VARCHAR(20) NULL,
  bank_account VARCHAR(50) NULL,
  amount_charged DECIMAL(10,2) NOT NULL,
  status ENUM('submitted', 'processing', 'approved', 'rejected') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_submissions (user_id, created_at),
  INDEX idx_form_type (form_type),
  INDEX idx_status (status)
);