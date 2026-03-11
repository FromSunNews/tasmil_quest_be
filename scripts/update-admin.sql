-- Update user role to admin
UPDATE users SET role='admin' WHERE id='913d30b5-5c0f-4c0b-8137-f54b3fd6d1aa';

-- Verify the update
SELECT id, username, wallet_address, role FROM users WHERE id='913d30b5-5c0f-4c0b-8137-f54b3fd6d1aa';