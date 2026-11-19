import mongoose from 'mongoose';
import { CLUB_CATEGORIES, CLUB_STATUS } from '../utils/constants.js';

const collegeClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Club name must be at least 3 characters'],
      maxlength: [120, 'Club name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Club category is required'],
      enum: {
        values: CLUB_CATEGORIES,
        message: 'Invalid club category',
      },
    },
    description: {
      type: String,
      required: [true, 'Club description is required'],
      trim: true,
    },
    objectives: {
      type: String,
      required: [true, 'Club objectives and mission are required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    facultyAdvisor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      name: {
        type: String,
        required: [true, 'Faculty advisor name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Faculty advisor email is required'],
        lowercase: true,
        trim: true,
      },
      department: {
        type: String,
        default: 'Faculty Administration',
        trim: true,
      },
      designation: {
        type: String,
        default: 'Professor & Club Advisor',
        trim: true,
      },
      confirmed: {
        type: Boolean,
        default: true,
      },
    },
    leadership: {
      secretaryGeneral: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      generalSecretary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      jointSecretary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      executiveMembers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      coordinators: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      committeeMembers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(CLUB_STATUS),
      default: CLUB_STATUS.ACTIVE,
    },
    rules: {
      type: [String],
      default: [],
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
    },
    memberCount: {
      type: Number,
      default: 1,
      min: [0, 'Member count cannot be negative'],
    },
    eventCount: {
      type: Number,
      default: 0,
      min: [0, 'Event count cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubProposal',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

collegeClubSchema.index({ status: 1 });
collegeClubSchema.index({ category: 1 });
collegeClubSchema.index({ memberCount: -1 });
collegeClubSchema.index({ name: 'text', description: 'text', objectives: 'text' });

export const CollegeClub = mongoose.model('CollegeClub', collegeClubSchema);

