import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';

async function addAdminWallet() {
  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.error('❌ Wallet address is required');
    console.error('Usage: ts-node scripts/add-admin-wallet.ts <wallet_address>');
    process.exit(1);
  }

  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    // Check if user exists
    const user = await AppDataSource.query(
      'SELECT id, username, wallet_address, role FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.length === 0) {
      console.error(`❌ User with wallet ${walletAddress} not found`);
      process.exit(1);
    }

    console.log('Found user:', user[0]);

    // Update user role to admin
    await AppDataSource.query(
      'UPDATE users SET role = $1 WHERE wallet_address = $2',
      ['admin', walletAddress]
    );

    console.log(`✅ User ${user[0].username} (${walletAddress}) is now admin`);

    // Verify the update
    const updatedUser = await AppDataSource.query(
      'SELECT id, username, wallet_address, role FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    console.log('Updated user:', updatedUser[0]);

    await AppDataSource.destroy();
    console.log('✅ Success!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAdminWallet();
