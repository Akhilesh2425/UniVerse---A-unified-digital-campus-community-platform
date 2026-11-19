import { FormWishlist } from '../models/FormWishlist.js';
import { FormReminderLog } from '../models/FormReminderLog.js';
import { StudentForm } from '../models/StudentForm.js';
import { sendFormReminderEmail } from './emailService.js';

export const runFormDeadlineReminders = async () => {
  const todayStr = new Date().toISOString().split('T')[0]; 
  const results = {
    processed: 0,
    sent: 0,
    skippedDuplicates: 0,
    expired: 0,
    errors: 0,
  };

  try {
    const wishlists = await FormWishlist.find({ reminderEnabled: true })
      .populate('user', 'name email status')
      .populate('form');

    const now = new Date();

    for (const item of wishlists) {
      results.processed += 1;

      if (!item.user || item.user.status !== 'active' || !item.user.email) {
        continue;
      }

      const form = item.form;
      if (!form || form.status !== 'open') {
        continue;
      }

      const deadline = new Date(form.deadline);
      if (deadline < now) {
        results.expired += 1;
        continue; 
      }

      const diffMs = deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining > 7) {
        continue;
      }

      const alreadySent = await FormReminderLog.findOne({
        user: item.user._id,
        form: form._id,
        reminderDate: todayStr,
      });

      if (alreadySent) {
        results.skippedDuplicates += 1;
        continue;
      }

      try {
        const deadlineFormatted = deadline.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        const sendResult = await sendFormReminderEmail({
          to: item.user.email,
          recipientId: item.user._id,
          formTitle: form.title,
          deadlineStr: deadlineFormatted,
          daysRemaining,
          formUrl: form.formUrl,
          formId: form._id,
        });

        await FormReminderLog.create({
          user: item.user._id,
          form: form._id,
          reminderDate: todayStr,
          daysRemaining,
          deliveryStatus: sendResult.simulated ? 'simulated' : sendResult.success ? 'sent' : 'failed',
        });

        results.sent += 1;
      } catch (err) {
        results.errors += 1;
        console.error(`[Form Reminder Error for ${item.user.email}]:`, err.message);
      }
    }

    return results;
  } catch (error) {
    console.error('[Form Reminder Scheduler Error]:', error.message);
    throw error;
  }
};

