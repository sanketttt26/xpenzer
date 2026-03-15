-- =============== DATABASE INITIALIZATION SCRIPT =============
-- This script creates all the necessary tables for the Xpenzer application
-- Run this once when setting up on a new machine

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    phone VARCHAR(10) UNIQUE,
	is_registered BOOLEAN DEFAULT TRUE,
    password VARCHAR(255),
    profile_color VARCHAR(8)
);

-- Create friends table
CREATE TABLE friends (
    user_id INT,
    friend_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	balance DECIMAL(10,2) DEFAULT 0,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (friend_id) REFERENCES users(user_id)
);

-- Create spendings table
CREATE TABLE spendings (
    spending_id SERIAL PRIMARY KEY,
    user_id INT,
    amount DECIMAL(10, 2),
    description TEXT,
    date date DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create contributions table
CREATE TABLE contributions (
    contri_id SERIAL PRIMARY KEY,
    spending_id INT,
	spending_user INT,
    user_id INT,
    amount DECIMAL(10, 2),
    settled BOOLEAN DEFAULT false,
    FOREIGN KEY (spending_id) REFERENCES spendings(spending_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
	FOREIGN KEY (spending_user) REFERENCES users(user_id)
);

-- Create personal_expenses table
CREATE TABLE personal_expenses (
    expense_id SERIAL PRIMARY KEY,
    user_id INT,
    amount DECIMAL(10, 2),
    description TEXT,
    date date DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create groups table
CREATE TABLE groups (
	group_id SERIAL PRIMARY KEY,
	group_name VARCHAR(100) NOT NULL,
	group_profile VARCHAR(8) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group_members table
CREATE TABLE group_members(
	group_id INT,
	user_id INT, 
	joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(group_id, user_id),
	FOREIGN KEY(group_id) REFERENCES groups(group_id),
	FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Create group_spendings table
CREATE TABLE group_spendings(
	group_id INT,
	spending_id INT,
	PRIMARY KEY(group_id, spending_id),
	FOREIGN KEY(group_id) REFERENCES groups(group_id),
	FOREIGN KEY(spending_id) REFERENCES spendings(spending_id)
);

-- Create notifications table
CREATE TABLE notifications(
	notification_id SERIAL PRIMARY KEY,
	user_id INT,
	sender_id INT,
	message TEXT,
	content JSONB, 
	notification_type VARCHAR(50) DEFAULT 'DEFAULT',
	is_read BOOLEAN DEFAULT false,
	date DATE DEFAULT CURRENT_DATE,
	FOREIGN KEY(user_id) REFERENCES users(user_id),
	FOREIGN KEY(sender_id) REFERENCES users(user_id)
);

-- =========== VIEWS =============
CREATE OR REPLACE VIEW user_groups AS
SELECT
    g.group_id,
    g.group_name,
    g.group_profile,
    gm.user_id,
    u.username,
    u.profile_color
FROM groups g
JOIN group_members gm USING(group_id)
JOIN users u USING(user_id);

CREATE OR REPLACE VIEW group_spendings_details AS
SELECT
    g.group_id,
    s.spending_id,
    s.description,
    s.date,
    s.amount,
    u.user_id,
    u.username,
    u.profile_color
FROM group_spendings g
JOIN spendings s USING(spending_id)
JOIN users u USING(user_id);

CREATE OR REPLACE VIEW user_friends AS
SELECT
    u1.user_id,
    u2.user_id AS friend_id,
    u2.username AS friend_name,
    COALESCE(f2.balance, 0) - f1.balance AS net_balance
FROM friends f1
LEFT JOIN friends f2
    ON f1.user_id = f2.friend_id
    AND f1.friend_id = f2.user_id
JOIN users u1
    ON f1.user_id = u1.user_id
JOIN users u2
    ON f1.friend_id = u2.user_id;

CREATE OR REPLACE VIEW user_contributions AS
SELECT
    s.spending_id,
    s.user_id AS spending_user,
    s.date AS spending_date,
    c.contri_id,
    c.user_id AS contri_user,
    c.settled,
    u.username AS contri_username,
    c.amount AS contri_amount,
    s.amount AS spending_amount,
    s.description
FROM contributions c
JOIN spendings s USING(spending_id)
JOIN users u
    ON u.user_id = c.user_id;

-- =========== INDEXES =============
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_spendings_user_id ON spendings(user_id);
CREATE INDEX idx_contributions_spending_id ON contributions(spending_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_personal_expenses_user_id ON personal_expenses(user_id);
CREATE INDEX idx_friends_user_friend ON friends(user_id, friend_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_spending_description ON spendings(description);
CREATE INDEX idx_expense_description ON personal_expenses(description);
