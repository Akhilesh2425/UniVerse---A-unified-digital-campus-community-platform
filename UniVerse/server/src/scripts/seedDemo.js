import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Announcement } from '../models/Announcement.js';
import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { GroupPost } from '../models/GroupPost.js';
import { GroupComment } from '../models/GroupComment.js';
import { ROLES, GROUP_ROLES, GROUP_VISIBILITY } from '../utils/constants.js';

const seedDemo = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI is missing from environment variables.');
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
    console.log('[Seed Demo] Connected to database.');

    // Find or create admin user
    let admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      admin = await User.create({
        name: 'UniVerse Administrator',
        email: 'admin@universe.edu',
        password: 'AdminSecure2026!',
        role: ROLES.ADMIN,
        department: 'Student Affairs',
        academicYear: 'Staff',
        interests: ['Campus Life', 'Tech', 'Student Success'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      });
      console.log('[Seed Demo] Created default admin account.');
    }

    // Realistic Demo Events
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const demoEvents = [
      {
        title: 'UniVerse Hackathon 2026: Build the Future',
        description: 'Join the premier 24-hour collegiate hackathon. Form teams of up to 4 students, create innovative software or hardware solutions, and compete for $5,000 in prizes and mentorship from top industry engineers.',
        category: 'Technical',
        venue: 'Engineering Hall - Innovation Hub 301',
        startDate: new Date(now.getTime() + 4 * day),
        endDate: new Date(now.getTime() + 5 * day),
        registrationDeadline: new Date(now.getTime() + 3 * day),
        maxCapacity: 120,
        registeredCount: 0,
        posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
        createdBy: admin._id,
      },
      {
        title: 'Campus Spring Harmony Music Festival',
        description: 'An evening of live acoustic, jazz, and indie rock performances by talented student bands and special guest performers. Free refreshments, food trucks, and glow merchandise provided!',
        category: 'Cultural',
        venue: 'Grand Amphitheater & Student Quad',
        startDate: new Date(now.getTime() + 7 * day),
        endDate: new Date(now.getTime() + 7 * day + 4 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 6 * day),
        maxCapacity: 350,
        registeredCount: 0,
        posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        createdBy: admin._id,
      },
      {
        title: 'Inter-Department Badminton Championship',
        description: 'Annual campus shuttle tournament featuring Men’s Singles, Women’s Singles, and Mixed Doubles divisions. Open to all registered undergraduate and graduate students.',
        category: 'Sports',
        venue: 'Indoor Sports Complex, Court 1 & 2',
        startDate: new Date(now.getTime() + 10 * day),
        endDate: new Date(now.getTime() + 11 * day),
        registrationDeadline: new Date(now.getTime() + 8 * day),
        maxCapacity: 64,
        registeredCount: 0,
        posterUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
        createdBy: admin._id,
      },
      {
        title: 'Hands-on Workshop: Mastering Modern Full-Stack Web Development',
        description: 'A deep-dive interactive workshop covering React architecture, REST API design, state management, and real-time deployment practices with experienced alumni mentors.',
        category: 'Workshops',
        venue: 'Computer Science Lab B-12',
        startDate: new Date(now.getTime() + 2 * day),
        endDate: new Date(now.getTime() + 2 * day + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 1 * day),
        maxCapacity: 45,
        registeredCount: 0,
        posterUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        createdBy: admin._id,
      },
      {
        title: 'Robotics & AI Club Showcase',
        description: 'Witness autonomous drone obstacle navigation, line-following robots, and computer vision demos. Hands-on testing and club recruitment for the upcoming international competition.',
        category: 'Clubs',
        venue: 'Mechanical Engineering Atrium',
        startDate: new Date(now.getTime() + 14 * day),
        endDate: new Date(now.getTime() + 14 * day + 5 * 60 * 60 * 1000),
        registrationDeadline: null,
        maxCapacity: null, // Unlimited
        registeredCount: 0,
        posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
        createdBy: admin._id,
      },
    ];

    const existingEventsCount = await Event.countDocuments();
    if (existingEventsCount === 0) {
      await Event.insertMany(demoEvents);
      console.log(`[Seed Demo] Seeded ${demoEvents.length} campus events.`);
    }

    // Realistic Demo Announcements
    const demoAnnouncements = [
      {
        title: 'Midterm Examination Schedule & Room Allocations Published',
        content: 'The official Spring Semester midterm exam timetable is now live on the university portal. Students are advised to double-check their assigned hall numbers and bring their physical Student ID cards. Calculators are permitted only for specified STEM courses.',
        category: 'Academic',
        priority: 'important',
        isPublished: true,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        author: admin._id,
      },
      {
        title: 'Campus Central Library 24/7 Extended Hours for Finals Week',
        content: 'Starting this Monday, the Central Library and Quiet Study Pods will remain open 24 hours a day with security patrol. The campus café on the 1st floor will provide hot beverages until 2:00 AM every night.',
        category: 'Campus Updates',
        priority: 'normal',
        isPublished: true,
        publishedAt: new Date(now.getTime() - 1 * day),
        author: admin._id,
      },
      {
        title: 'Annual Placement and Summer Internship Fair Registration Open',
        content: 'Over 65 leading tech and core engineering companies will visit campus for the annual placement drive. Submit your verified resume through the campus career cell portal before Friday at 5:00 PM.',
        category: 'General',
        priority: 'important',
        isPublished: true,
        publishedAt: new Date(now.getTime() - 2 * day),
        author: admin._id,
      },
      {
        title: 'Draft: Campus Parking Lot 3 Maintenance Advisory',
        content: 'Parking Lot 3 adjacent to the Science Complex will be closed for resurfacing next weekend. Please utilize the North Deck instead.',
        category: 'Administrative',
        priority: 'normal',
        isPublished: false,
        publishedAt: null,
        author: admin._id,
      },
    ];

    const existingAnnouncementsCount = await Announcement.countDocuments();
    if (existingAnnouncementsCount === 0) {
      await Announcement.insertMany(demoAnnouncements);
      console.log(`[Seed Demo] Seeded ${demoAnnouncements.length} announcements.`);
    }

    // ==========================================
    // MODULE 3: SEED GROUPS & COMMUNITIES
    // ==========================================
    const existingGroupsCount = await Group.countDocuments();
    if (existingGroupsCount === 0) {
      const demoGroups = [
        {
          name: 'Google Developer Student Club (GDSC)',
          shortDescription: 'Community passionate about building real-world software using cloud, Android, Flutter, and web technologies.',
          description: 'GDSC UniVerse is a university-based community group supported by Google Developers. Students from all undergraduate or graduate programs with an interest in growing as a developer are welcome! We host weekly hands-on codelabs, cloud hack nights, and peer mentor sessions.',
          category: 'Technical',
          tags: ['Web', 'Cloud', 'Open Source', 'Hackathons'],
          coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
          visibility: GROUP_VISIBILITY.PUBLIC,
          rules: [
            'Be respectful and supportive of fellow student learners.',
            'Keep technical discussions constructive and provide code snippets when asking questions.',
            'No commercial spam, self-promotion, or unsolicited advertising.',
          ],
          owner: admin._id,
          memberCount: 1,
          postCount: 0,
        },
        {
          name: 'Competitive Programming & Algorithm Knights',
          shortDescription: 'Sharpen your problem-solving skills for LeetCode, Codeforces, and ICPC collegiate contests.',
          description: 'A focused study and practice group for students dedicated to mastering data structures, dynamic programming, graph algorithms, and competitive coding. We run mock contests every Sunday and discuss optimal approaches.',
          category: 'Coding & Competitive Programming',
          tags: ['Algorithms', 'LeetCode', 'ICPC', 'C++', 'Python'],
          coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80',
          visibility: GROUP_VISIBILITY.PUBLIC,
          rules: [
            'Avoid posting direct solutions during ongoing rated contests.',
            'Always explain the time and space complexity of your shared solution.',
            'Encourage beginners and offer constructive hints.',
          ],
          owner: admin._id,
          memberCount: 1,
          postCount: 0,
        },
        {
          name: 'Collegiate Entrepreneurship & Startup Incubator',
          shortDescription: 'Private incubator for student founders building early-stage campus startups and raising venture grants.',
          description: 'An exclusive peer network for campus innovators, student founders, and product designers. We review investor pitch decks, organize angel mentor office hours, and help form co-founder teams.',
          category: 'Entrepreneurship',
          tags: ['Startups', 'Venture Capital', 'Pitching', 'Product Design'],
          coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
          visibility: GROUP_VISIBILITY.PRIVATE, // Private group to test join requests
          rules: [
            'All project ideas and pitch decks shared within the incubator remain confidential.',
            'Active participation in bi-weekly progress updates is required.',
            'Provide honest, constructive feedback to fellow founders.',
          ],
          owner: admin._id,
          memberCount: 1,
          postCount: 0,
        },
        {
          name: 'UniVerse AI & Deep Learning Society',
          shortDescription: 'Reading group and research collective exploring LLMs, computer vision, and neural networks.',
          description: 'We explore foundational machine learning research and emerging artificial intelligence papers. Members collaborate on Kaggle competitions, GPU cluster projects, and open-source generative AI models.',
          category: 'Artificial Intelligence & Machine Learning',
          tags: ['Machine Learning', 'PyTorch', 'LLMs', 'Neural Networks'],
          coverImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
          visibility: GROUP_VISIBILITY.PUBLIC,
          rules: [
            'Cite papers and original datasets when presenting projects.',
            'Use ethical AI guidelines in all research initiatives.',
          ],
          owner: admin._id,
          memberCount: 1,
          postCount: 0,
        },
        {
          name: 'Campus Shutterbugs & Visual Arts Collective',
          shortDescription: 'Photographers, digital illustrators, and visual storytellers capturing campus life.',
          description: 'From photo walks across campus to digital matte painting workshops, Shutterbugs brings together creatives of all experience levels. We organize the annual campus photography exhibition.',
          category: 'Arts & Photography',
          tags: ['Photography', 'Lightroom', 'Digital Art', 'Campus Life'],
          coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
          visibility: GROUP_VISIBILITY.PUBLIC,
          rules: [
            'Respect copyright and credit student photographers.',
            'Share photo settings (ISO, Aperture, Shutter speed) to facilitate peer learning.',
          ],
          owner: admin._id,
          memberCount: 1,
          postCount: 0,
        },
      ];

      for (const groupData of demoGroups) {
        const createdGroup = await Group.create(groupData);

        // Create owner membership
        await GroupMembership.create({
          group: createdGroup._id,
          user: admin._id,
          role: GROUP_ROLES.OWNER,
          joinedAt: new Date(),
        });

        // Create a welcome post in each group
        const post = await GroupPost.create({
          group: createdGroup._id,
          author: admin._id,
          title: `Welcome to ${createdGroup.name}!`,
          content: `Hello everyone! Welcome to our official campus community space on UniVerse. Feel free to introduce yourself below, share what projects you are currently building, and let us know what topics you'd like to explore this semester!`,
          commentCount: 1,
        });

        // Add a demo comment
        await GroupComment.create({
          post: post._id,
          group: createdGroup._id,
          author: admin._id,
          content: 'Excited to kick off this semester together! Check out our rules tab in the sidebar.',
        });

        await Group.findByIdAndUpdate(createdGroup._id, { $inc: { postCount: 1 } });
      }

      console.log(`[Seed Demo] Seeded ${demoGroups.length} campus groups with welcome discussions.`);
    } else {
      console.log(`[Seed Demo] Found ${existingGroupsCount} existing groups. Skipping group re-seeding.`);
    }

    await mongoose.connection.close();
    console.log('[Seed Demo] Done!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Demo Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDemo();
