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

    const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@universe.edu').toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: mainAdminEmail });

    if (existingAdmin) {
      if (existingAdmin.role === ROLES.MAIN_ADMIN) {
        console.log(`[Seed Admin] Main Admin with email ${mainAdminEmail} already exists.`);
      } else {
        existingAdmin.role = ROLES.MAIN_ADMIN;
        await existingAdmin.save();
        console.log(`[Seed Admin] Elevated existing account ${mainAdminEmail} to Main College Administrator.`);
      }
    } else {
      await User.create({
        name: 'Main College Administrator',
        email: mainAdminEmail,
        password: adminPassword,
        role: ROLES.MAIN_ADMIN,
        department: 'Campus Administration',
        academicYear: 'Leadership',
        interests: ['Platform Oversight', 'College Clubs', 'Campus Community'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      });
      console.log(`[Seed Admin] Successfully created Main College Administrator: ${mainAdminEmail}`);
    }

    const demoStudentEmail = 'student@universe.edu';
    const demoStudentPassword = 'StudentSecure2026!';
    const existingStudent = await User.findOne({ email: demoStudentEmail });

    if (!existingStudent) {
      await User.create({
        name: 'Alex Rivera (Demo Student)',
        email: demoStudentEmail,
        password: demoStudentPassword,
        role: ROLES.STUDENT,
        department: 'Computer Science & Engineering',
        academicYear: '3rd Year (Junior)',
        interests: ['Hackathons', 'Web Development', 'Robotics', 'Campus Events'],
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      });
      console.log(`[Seed Admin] Successfully created Demo Student: ${demoStudentEmail}`);
    } else {
      console.log(`[Seed Admin] Demo Student ${demoStudentEmail} already exists.`);
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
