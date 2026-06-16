const cron = require('node-cron');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

const startCronJobs = () => {
  // Run every Sunday at midnight for reminders
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly rent reminder cron job...');
    try {
      const tenantsWithDueRent = await User.find({ role: 'tenant', rentDue: { $gt: 0 } });
      
      for (const tenant of tenantsWithDueRent) {
        console.log(`[REMINDER] Sending reminder to ${tenant.email} for unpaid rent of $${tenant.rentDue}`);
        tenant.lastReminderSent = new Date();
        await tenant.save();
      }
      console.log('Weekly rent reminder job completed.');
    } catch (error) {
      console.error('Error in rent reminder cron job:', error);
    }
  });

  // Run on the 1st of every month at midnight to regulate rent
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly rent increment cron job...');
    try {
      const activeTenants = await User.find({ role: 'tenant', approvalStatus: 'approved', property: { $ne: null } }).populate('property');
      
      for (const tenant of activeTenants) {
        if (tenant.property && tenant.property.baseRent) {
          tenant.rentDue += tenant.property.baseRent;
          await tenant.save();

          // Notify Tenant
          await Notification.create({
            user: tenant._id,
            message: `Your monthly rent of ₹${tenant.property.baseRent} for ${tenant.property.name} has been added to your dues.`
          });

          console.log(`[RENT UPDATED] Added ₹${tenant.property.baseRent} to ${tenant.email}'s rentDue.`);
        }
      }
      console.log('Monthly rent increment job completed.');
    } catch (error) {
      console.error('Error in monthly rent cron job:', error);
    }
  });
};

module.exports = { startCronJobs };
