SELECT u.id,u.name,u.email,u.role,u.is_active,u.created_at,
       (u.password IS NULL) AS password_null,
       CHAR_LENGTH(u.password) AS password_len
FROM users u
WHERE u.id = 18 OR u.email = 'cristinasantos.adm@gmail.com'
ORDER BY u.id;
