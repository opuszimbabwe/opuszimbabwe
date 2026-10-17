-- 0010_project_screenshots.sql
-- Admin-uploaded screenshots for Live Work projects.
--
-- Additive: existing rows keep rendering (empty screenshot = the site shows a
-- neutral browser-frame placeholder), and the admin can upload a real
-- screenshot per project from /admin → Live Work (Projects).

ALTER TABLE projects ADD COLUMN screenshot TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_projects_screenshot ON projects (screenshot);
