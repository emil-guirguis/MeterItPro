ALTER TABLE cost
  ADD COLUMN modified_by_users_id INTEGER REFERENCES users(users_id) ON DELETE SET NULL;
