import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../utils/constants.js';

const adminAuditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin actor reference is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target resource type is required'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Audit log description is required'],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, 
  }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ actor: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
export default AdminAuditLog;
