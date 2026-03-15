ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_color VARCHAR(8);

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
