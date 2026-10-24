-- Optional client identity and hover film for the project showcase.
ALTER TABLE projects ADD COLUMN logo TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN preview_video TEXT NOT NULL DEFAULT '';
