import dotenv from 'dotenv';
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: './server/.env' });
}

import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { DiscussionComment } from '../models/DiscussionComment.js';
import { DiscussionVote } from '../models/DiscussionVote.js';
import { SavedDiscussion } from '../models/SavedDiscussion.js';
import { ContentReport } from '../models/ContentReport.js';
import {
  DISCUSSION_CATEGORIES,
  DISCUSSION_TYPES,
  DISCUSSION_STATUS,
  REPORT_REASONS,
} from '../utils/constants.js';

const seedDiscussions = async () => {
  try {
    await connectDB();
    console.log('[Seed Discussions] Connected to MongoDB Atlas.');

    // Find users to author discussions and comments
    const users = await User.find({}).limit(5);
    if (!users || users.length === 0) {
      console.error('No users found in database. Run seedDemo.js or register a user first.');
      process.exit(1);
    }

    const u1 = users[0];
    const u2 = users[1] || users[0];
    const u3 = users[2] || users[0];

    // Check if discussions already exist
    const existingCount = await DiscussionPost.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed Discussions] Found ${existingCount} existing discussions. Skipping seeding to prevent duplicates.`);
      process.exit(0);
    }

    console.log('[Seed Discussions] Seeding initial discussions, questions, and resources...');

    // 1. Question: Technical / DSA (with accepted answer)
    const q1 = await DiscussionPost.create({
      author: u1._id,
      title: 'How should a 3rd-year CS student approach Dynamic Programming for campus placement interviews?',
      content: `I have covered basic recursion and memoization, but I struggle when transitioning to 2D DP problems (like Knapsack variations, Edit Distance, and Longest Common Subsequence). 

What is the most effective mental framework to recognize overlapping subproblems and state transitions during a 45-minute live coding round? Also, what problem sets or curated lists should I prioritize?`,
      type: DISCUSSION_TYPES.QUESTION,
      category: 'Programming & DSA',
      tags: ['algorithms', 'dynamic-programming', 'placements', 'leetcode', 'interviews'],
      upvoteCount: 18,
      commentCount: 2,
      saveCount: 9,
      views: 142,
      status: DISCUSSION_STATUS.RESOLVED,
    });

    const c1 = await DiscussionComment.create({
      post: q1._id,
      author: u2._id,
      content: `Here is the framework that helped me crack top product-based company rounds:

1. **State Definition**: Clearly write down what \`dp[i][j]\` represents in plain English before writing code.
2. **Base Cases**: Think of what happens at the boundary (e.g., empty string or 0 capacity).
3. **Transition Formula**: Focus only on the last choice made.
4. **Iterative vs Recursive**: Always start top-down with memoization. It is easier to explain to an interviewer!

Recommended problem set: Striver's DP Series and NeetCode 150 DP category.`,
      isAcceptedAnswer: true,
    });

    const c2 = await DiscussionComment.create({
      post: q1._id,
      author: u3._id,
      content: `Great breakdown! Also don't forget to practice drawing the recursion tree on a whiteboard. Interviewers care more about your intuition than getting the 1D space optimization on the first try.`,
      isAcceptedAnswer: false,
    });

    q1.acceptedAnswer = c1._id;
    await q1.save();

    // 2. Resource Post: AI & Research
    const r1 = await DiscussionPost.create({
      author: u2._id,
      title: 'Curated Open-Source LLM and Transformer Architecture Learning Roadmap (2026 Edition)',
      content: `Over the past semester, our campus research team compiled the most high-impact resources for students wanting to specialize in Modern Natural Language Processing and Generative AI.

This collection includes:
- Mathematical prerequisites (Linear Algebra & Matrix Calculus for Attention)
- PyTorch implementation of Multi-Head Self-Attention from scratch
- Fine-tuning with LoRA / QLoRA on consumer GPUs
- Evaluation benchmarks and retrieval-augmented generation (RAG) architectural patterns.

Feel free to bookmark this post and share questions below!`,
      type: DISCUSSION_TYPES.RESOURCE,
      category: 'Research',
      tags: ['machine-learning', 'llm', 'transformers', 'pytorch', 'ai-research'],
      resourceUrl: 'https://github.com/huggingface/transformers',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      upvoteCount: 27,
      commentCount: 1,
      saveCount: 16,
      views: 310,
      status: DISCUSSION_STATUS.OPEN,
    });

    await DiscussionComment.create({
      post: r1._id,
      author: u1._id,
      content: `Incredible compilation! Are you planning to organize a weekly study group or paper-reading session at the campus innovation lab?`,
    });

    // 3. Project Collaboration Post
    const p1 = await DiscussionPost.create({
      author: u3._id,
      title: 'Seeking 2 Full-Stack & UI/UX Teammates for Smart Campus Parking & EV Charging IoT Project',
      content: `We are building a smart campus sensor network using ESP32 microcontrollers, Node.js WebSocket streaming, and a React Native mobile client to show live available parking spots and EV charger queues across university lots.

We currently have the hardware schematics and backend ingestion pipeline working. We need:
- 1 Frontend / React developer comfortable with Tailwind and real-time state.
- 1 UI/UX designer with Figma skills to design the student dashboard and mobile app.

We plan to submit this to the upcoming University Tech Expo and compete for departmental seed funding. Drop a reply or your GitHub profile if interested!`,
      type: DISCUSSION_TYPES.PROJECT,
      category: 'Projects',
      tags: ['iot', 'hardware', 'react', 'collaboration', 'hackathon'],
      resourceUrl: 'https://github.com',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      upvoteCount: 14,
      commentCount: 1,
      saveCount: 5,
      views: 98,
      status: DISCUSSION_STATUS.OPEN,
    });

    await DiscussionComment.create({
      post: p1._id,
      author: u1._id,
      content: `I would love to contribute to the frontend dashboard! I have experience with Vite, React, and WebSocket integration. Sent you a DM on campus Slack.`,
    });

    // 4. General Discussion Post
    await DiscussionPost.create({
      author: u1._id,
      title: 'Tips for balancing academic coursework, club leadership, and personal projects without burning out',
      content: `As midterms approach, many students find themselves overwhelmed trying to juggle engineering assignments, campus club responsibilities, hackathons, and placement prep.

What daily routines, time-blocking methods, or habit-tracking workflows have genuinely worked for you? Let's compile a realistic guide for freshmen and sophomores.`,
      type: DISCUSSION_TYPES.DISCUSSION,
      category: 'Campus Life',
      tags: ['student-life', 'productivity', 'wellbeing', 'college-advice'],
      upvoteCount: 32,
      commentCount: 0,
      saveCount: 12,
      views: 220,
      status: DISCUSSION_STATUS.OPEN,
    });

    // 5. Unanswered Question: Placements & Internships
    await DiscussionPost.create({
      author: u2._id,
      title: 'Off-campus vs On-campus internship applications: How early should we start reaching out to alumni on LinkedIn?',
      content: `For summer 2027 internships, when is the sweet spot to begin cold emailing and requesting referrals? Also, what should a concise, respectful referral message template look like when contacting campus alumni?`,
      type: DISCUSSION_TYPES.QUESTION,
      category: 'Placements & Internships',
      tags: ['internships', 'career', 'referrals', 'linkedin'],
      upvoteCount: 9,
      commentCount: 0,
      saveCount: 8,
      views: 75,
      status: DISCUSSION_STATUS.OPEN,
    });

    // Add sample votes and bookmarks
    await DiscussionVote.create({ post: q1._id, user: u2._id });
    await DiscussionVote.create({ post: r1._id, user: u1._id });
    await SavedDiscussion.create({ post: r1._id, user: u1._id });
    await SavedDiscussion.create({ post: q1._id, user: u3._id });

    console.log('[Seed Discussions] Successfully seeded Module 4 discussions with realistic campus data!');
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Discussions] Error during seeding:', error.message);
    await closeDB();
    process.exit(1);
  }
};

seedDiscussions();
