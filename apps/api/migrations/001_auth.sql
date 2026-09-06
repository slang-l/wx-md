CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT users_email_not_empty CHECK (char_length(email) > 0),
  CONSTRAINT users_password_hash_not_empty CHECK (char_length(password_hash) > 0),
  CONSTRAINT users_name_not_empty CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT users_role_valid CHECK (role IN ('user', 'admin')),
  CONSTRAINT users_status_valid CHECK (status IN ('active', 'disabled'))
);

CREATE TABLE refresh_sessions (
  id uuid PRIMARY KEY,
  token_hash char(64) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_hash char(64),
  ip text,
  user_agent text,
  CONSTRAINT refresh_sessions_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT refresh_sessions_token_hash_valid
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT refresh_sessions_replaced_by_hash_valid
    CHECK (
      replaced_by_hash IS NULL
      OR replaced_by_hash ~ '^[0-9a-f]{64}$'
    ),
  CONSTRAINT refresh_sessions_replacement_is_different
    CHECK (replaced_by_hash IS NULL OR replaced_by_hash <> token_hash)
);

CREATE INDEX refresh_sessions_user_id_idx
  ON refresh_sessions (user_id);

CREATE INDEX refresh_sessions_family_id_idx
  ON refresh_sessions (family_id);

CREATE INDEX refresh_sessions_active_expiry_idx
  ON refresh_sessions (expires_at)
  WHERE revoked_at IS NULL;
