CREATE TABLE brand_assets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  image_data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_assets_name_not_empty
    CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT brand_assets_name_length
    CHECK (char_length(name) <= 80),
  CONSTRAINT brand_assets_category_valid
    CHECK (category IN ('logo', 'qr-code', 'avatar', 'product', 'other')),
  CONSTRAINT brand_assets_mime_type_valid
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/gif')),
  CONSTRAINT brand_assets_size_valid
    CHECK (size_bytes > 0 AND size_bytes <= 1500000),
  CONSTRAINT brand_assets_data_size_matches
    CHECK (octet_length(image_data) = size_bytes),
  CONSTRAINT brand_assets_tag_count
    CHECK (cardinality(tags) <= 8)
);

CREATE INDEX brand_assets_user_updated_idx
  ON brand_assets (user_id, updated_at DESC);

