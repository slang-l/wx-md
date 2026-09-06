CREATE TABLE wechat_accounts (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  app_secret_ciphertext text NOT NULL,
  default_author text NOT NULL DEFAULT '',
  default_digest text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wechat_accounts_app_id_valid
    CHECK (app_id ~ '^wx[A-Za-z0-9]{16}$'),
  CONSTRAINT wechat_accounts_secret_not_empty
    CHECK (char_length(app_secret_ciphertext) > 0),
  CONSTRAINT wechat_accounts_author_length
    CHECK (char_length(default_author) <= 32),
  CONSTRAINT wechat_accounts_digest_length
    CHECK (char_length(default_digest) <= 120)
);
