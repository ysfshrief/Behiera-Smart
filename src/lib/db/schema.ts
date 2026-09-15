/**
 * مخطط قاعدة البيانات.
 * الحقول القابلة للاستعلام أعمدة حقيقية بفهارس؛ المجموعات المتداخلة
 * (المستندات، الأماكن، الأحداث) تُخزَّن JSON — لأنها تُقرأ دائمًا مع أصلها
 * ولا يُستعلم عنها منفردة.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  phone              TEXT NOT NULL,
  national_id_masked TEXT,
  role               TEXT NOT NULL,
  markaz             TEXT,
  interests          TEXT NOT NULL DEFAULT '[]',
  created_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS news (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  summary          TEXT NOT NULL,
  body             TEXT NOT NULL,
  category         TEXT NOT NULL,
  cover_image      TEXT,
  source           TEXT NOT NULL,
  is_urgent        INTEGER NOT NULL DEFAULT 0,
  published_at     TEXT NOT NULL,
  attachments      TEXT NOT NULL DEFAULT '[]',
  related_services TEXT NOT NULL DEFAULT '[]',
  related_courses  TEXT NOT NULL DEFAULT '[]',
  tags             TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category  ON news(category);

CREATE TABLE IF NOT EXISTS services (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  aliases           TEXT NOT NULL DEFAULT '[]',
  short_description TEXT NOT NULL,
  description       TEXT NOT NULL,
  eligibility       TEXT NOT NULL DEFAULT '[]',
  life_events       TEXT NOT NULL DEFAULT '[]',
  authority         TEXT NOT NULL,
  fees              TEXT NOT NULL DEFAULT '[]',
  duration_label    TEXT NOT NULL,
  documents         TEXT NOT NULL DEFAULT '[]',
  locations         TEXT NOT NULL DEFAULT '[]',
  conditions        TEXT NOT NULL DEFAULT '[]',
  notes             TEXT NOT NULL DEFAULT '[]',
  related_services  TEXT NOT NULL DEFAULT '[]',
  is_online         INTEGER NOT NULL DEFAULT 0,
  online_url        TEXT,
  source_label      TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  popularity        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_services_popularity ON services(popularity DESC);

CREATE TABLE IF NOT EXISTS instructors (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  title     TEXT NOT NULL,
  bio       TEXT NOT NULL,
  expertise TEXT NOT NULL DEFAULT '[]',
  initials  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_paths (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  course_slugs TEXT NOT NULL DEFAULT '[]',
  outcome     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  summary        TEXT NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL,
  level          TEXT NOT NULL,
  format         TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  seats_total    INTEGER NOT NULL,
  seats_taken    INTEGER NOT NULL DEFAULT 0,
  price_egp      INTEGER NOT NULL DEFAULT 0,
  prerequisites  TEXT NOT NULL DEFAULT '[]',
  outcomes       TEXT NOT NULL DEFAULT '[]',
  has_certificate INTEGER NOT NULL DEFAULT 1,
  instructor_id  TEXT NOT NULL,
  path_slug      TEXT,
  starts_at      TEXT NOT NULL,
  schedule       TEXT NOT NULL,
  location_label TEXT NOT NULL,
  status         TEXT NOT NULL,
  sessions       TEXT NOT NULL DEFAULT '[]',
  tags           TEXT NOT NULL DEFAULT '[]',
  rating         REAL NOT NULL DEFAULT 0,
  rating_count   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_starts   ON courses(starts_at);

CREATE TABLE IF NOT EXISTS enrollments (
  id          TEXT PRIMARY KEY,
  ref_code    TEXT NOT NULL UNIQUE,
  course_slug TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  status      TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enroll_user   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_course ON enrollments(course_slug);

CREATE TABLE IF NOT EXISTS complaint_categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  authority TEXT NOT NULL,
  sla_days  INTEGER NOT NULL,
  keywords  TEXT NOT NULL DEFAULT '[]',
  icon      TEXT NOT NULL,
  color     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS complaints (
  id                 TEXT PRIMARY KEY,
  ref_code           TEXT NOT NULL UNIQUE,
  user_id            TEXT NOT NULL,
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  category_id        TEXT NOT NULL,
  priority           TEXT NOT NULL,
  status             TEXT NOT NULL,
  markaz             TEXT NOT NULL,
  address            TEXT NOT NULL DEFAULT '',
  lat                REAL NOT NULL,
  lng                REAL NOT NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  ai_classification  TEXT,
  citizen_overrode_ai INTEGER NOT NULL DEFAULT 0,
  cluster_id         TEXT,
  attachments        TEXT NOT NULL DEFAULT '[]',
  events             TEXT NOT NULL DEFAULT '[]',
  is_public          INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created  ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_user     ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_markaz   ON complaints(markaz);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  is_urgent  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS saved_items (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  UNIQUE(user_id, entity_type, entity_id)
);
`;
