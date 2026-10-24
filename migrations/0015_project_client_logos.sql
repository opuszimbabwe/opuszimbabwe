-- First-time client identity only. Future admin logo choices (including clears) stay editable.
UPDATE projects SET logo = '/images/project-great-couples-logo.png', updated_at = datetime('now')
WHERE id = 'great-couples' AND COALESCE(logo, '') = '';
UPDATE projects SET logo = '/images/project-prime-logo.png', updated_at = datetime('now')
WHERE id = 'prime-pidg' AND COALESCE(logo, '') = '';
