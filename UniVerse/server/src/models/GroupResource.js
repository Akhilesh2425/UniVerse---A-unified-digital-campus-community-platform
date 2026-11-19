import mongoose from 'mongoose';

const groupResourceSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or resource link is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'document', 'spreadsheet', 'presentation', 'image', 'code', 'link', 'other'],
      default: 'document',
    },
    fileSize: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

groupResourceSchema.index({ group: 1, createdAt: -1 });

export const GroupResource = mongoose.model('GroupResource', groupResourceSchema);

