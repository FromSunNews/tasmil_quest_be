import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';

async function updateUserRole() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    const userId = '913d30b5-5c0f-4c0b-8137-f54b3fd6d1aa';
    
    // Update user role
    const result = await AppDataSource.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', userId]
    );

    console.log(`Updated ${result[1]} user(s)`);

    // Verify the update
    const user = await AppDataSource.query(
      'SELECT id, username, wallet_address, role FROM users WHERE id = $1',
      [userId]
    );

    console.log('Updated user:', user[0]);

    await AppDataSource.destroy();
    console.log('✅ User role updated successfully');
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  }
}

updateUserRole();