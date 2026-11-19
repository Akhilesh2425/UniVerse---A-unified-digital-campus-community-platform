import mongoose from 'mongoose';
import { CLUB_CATEGORIES, CLUB_PROPOSAL_STATUS } from '../utils/constants.js';

const clubProposalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Proposed club name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
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
    proposedFacultyAdvisor: {
      name: {
        type: String,
        required: [true, 'Proposed faculty advisor name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Proposed faculty advisor email is required'],
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
        default: 'Faculty Advisor',
        trim: true,
      },
    },
    proposedLeadership: {
      secretaryGeneralName: {
        type: String,
        required: [true, 'Secretary General nominee name is required'],
        trim: true,
      },
      generalSecretaryName: {
        type: String,
        default: '',
        trim: true,
      },
      jointSecretaryName: {
        type: String,
        default: '',
        trim: true,
      },
      executiveNominees: {
        type: [String],
        default: [],
      },
    },
    proposedActivities: {
      type: String,
      default: '',
      trim: true,
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
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CLUB_PROPOSAL_STATUS),
      default: CLUB_PROPOSAL_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewReason: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

clubProposalSchema.index({ status: 1, createdAt: -1 });

export const ClubProposal = mongoose.model('ClubProposal', clubProposalSchema);

