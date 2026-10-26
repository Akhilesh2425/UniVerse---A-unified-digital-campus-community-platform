import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ROLES } from '../utils/constants.js';

const seedAdmin = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI is missing from environment variables.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@universe.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';

  if (!adminPassword || adminPassword.length < 6) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  try {
    if (uri.startsWith('mongodb+srv://')) {
      try {
        const dns = await import('dns');
        dns.default.setServers(['8.8.8.8', '1.1.1.1']);
      } catch {}
    }

    await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'universe' });
    console.log('[Seed Admin] Connected to database.');

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      if (existingAdmin.role === ROLES.ADMIN) {
        console.log(`[Seed Admin] Admin with email ${normalizedEmail} already exists. Leaving existing password unchanged.`);
      } else {
        existingAdmin.role = ROLES.ADMIN;
        await existingAdmin.save();
        console.log(`[Seed Admin] Promoted existing account ${normalizedEmail} to administrator.`);
      }
    } else {
      await User.create({
        name: 'UniVerse Administrator',
        email: normalizedEmail,
        password: adminPassword,
        role: ROLES.ADMIN,
        department: 'Campus Administration',
        academicYear: 'Staff',
        interests: ['Campus Life', 'Technology', 'Event Coordination'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      });
      console.log(`[Seed Admin] Successfully created new administrator: ${normalizedEmail}`);
    }

    await mongoose.connection.close();
    console.log('[Seed Admin] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Admin Error]: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
