-- Database structure for Helpdesk PDB
-- Note: Create the database manually in your hosting panel first, then import this file.

-- Table for Leave Requests
CREATE TABLE IF NOT EXISTS requests (
    id VARCHAR(50) PRIMARY KEY,
    studentName VARCHAR(255) NOT NULL,
    studentId VARCHAR(50) NOT NULL,
    studentClass VARCHAR(50) NOT NULL,
    courseName VARCHAR(255) NOT NULL,
    lecturerName VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    evidenceUrl TEXT,
    status VARCHAR(50) DEFAULT 'Menunggu',
    rejectionReason TEXT,
    generatedLetter TEXT,
    createdAt BIGINT NOT NULL
);

-- Table for Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(50) PRIMARY KEY,
    studentName VARCHAR(255) NOT NULL,
    studentId VARCHAR(50) NOT NULL,
    studentClass VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    adminNote TEXT,
    createdAt BIGINT NOT NULL
);
