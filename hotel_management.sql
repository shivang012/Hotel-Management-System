-- Create the database
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL, -- SHA-256 hashed password
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Guests Table
CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    amenities JSON, -- Store amenities as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_id INT, -- Can be NULL until assigned
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('confirmed', 'checked-in', 'checked-out', 'cancelled') NOT NULL DEFAULT 'confirmed',
    special_requests TEXT,
    created_by INT NOT NULL, -- User who created the reservation
    updated_by INT, -- User who last updated the reservation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX idx_reservations_check_in ON reservations (check_in_date);
CREATE INDEX idx_reservations_check_out ON reservations (check_out_date);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_rooms_status ON rooms (status);
CREATE INDEX idx_guests_email ON guests (email);
CREATE INDEX idx_users_username ON users (username);

-- Sample Data (Optional)
-- Insert a default admin user
INSERT INTO users (username, password, role) 
VALUES ('admin', SHA2('adminpassword', 256), 'admin');

-- my username and password
INSERT INTO users (username, password, role)
VALUES ('tithi', SHA2('hms@123', 256), 'admin');

-- Insert a sample room type
INSERT INTO room_types (name, description, base_price, amenities) 
VALUES ('Deluxe Room', 'A luxurious room with a king-sized bed and ocean view.', 200.00, '["WiFi", "TV", "Mini Bar"]');

-- Insert a sample room
INSERT INTO rooms (room_number, room_type_id, status) 
VALUES ('101', 1, 'available');

-- Insert a sample guest
INSERT INTO guests (name, email, phone) 
VALUES ('John Doe', 'john.doe@example.com', '+1234567890');

-- Insert a sample reservation
INSERT INTO reservations (
    guest_id, room_type_id, check_in_date, check_out_date, 
    num_guests, total_price, status, created_by
) VALUES (
    1, 1, '2023-10-01', '2023-10-05', 2, 800.00, 'confirmed', 1
);

-- Create the services table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data if the table is empty
INSERT INTO services (name, type, price, status, description)
SELECT * FROM (
    SELECT 'Room Cleaning', 'cleaning', 25.00, 'active', 'Daily room cleaning service' UNION
    SELECT 'Airport Transfer', 'transport', 50.00, 'active', 'Round-trip airport transfer' UNION
    SELECT 'Spa Package', 'spa', 120.00, 'active', 'Full spa treatment package'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);