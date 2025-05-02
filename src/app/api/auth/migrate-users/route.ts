import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { adminMiddleware } from '@/lib/auth';

// This route requires admin privileges to prevent unauthorized database changes
export const POST = adminMiddleware(async () => {
  try {
    await connectToDatabase();

    // First, ensure all users have the roll field set
    const noRoleUsers = await User.find({ roll: { $exists: false } });
    let noRoleFixed = 0;

    for (const user of noRoleUsers) {
      // Set role based on isAdmin legacy field if present
      if (user.isAdmin) {
        user.roll = UserRole.ADMIN;
      } else {
        user.roll = UserRole.USER;
      }
      await user.save();
      noRoleFixed++;
    }

    // Fix any incorrect case for role values (e.g., 'Admin' instead of 'ADMIN')
    const results = {
      admin: 0,
      user: 0,
      listingAgent: 0
    };

    // Fix 'Admin' to 'ADMIN'
    const adminResult = await User.updateMany(
      { roll: "Admin" },
      { $set: { roll: UserRole.ADMIN } }
    );
    results.admin = adminResult.modifiedCount;

    // Fix 'User' to 'USER'
    const userResult = await User.updateMany(
      { roll: "User" },
      { $set: { roll: UserRole.USER } }
    );
    results.user = userResult.modifiedCount;

    // Fix 'Listing_Agent' to 'LISTING_AGENT'
    const agentResult = await User.updateMany(
      { roll: { $in: ["Listing_Agent", "listing_agent", "ListingAgent"] } },
      { $set: { roll: UserRole.LISTING_AGENT } }
    );
    results.listingAgent = agentResult.modifiedCount;

    // Ensure all users are active
    const activatedCount = await User.updateMany(
      { aktiv: { $exists: false } },
      { $set: { aktiv: true } }
    );

    // Get counts of each role type after migration
    const counts = {
      admin: await User.countDocuments({ roll: UserRole.ADMIN }),
      user: await User.countDocuments({ roll: UserRole.USER }),
      listingAgent: await User.countDocuments({ roll: UserRole.LISTING_AGENT }),
      total: await User.countDocuments({})
    };

    return NextResponse.json({ 
      message: 'User migration completed successfully',
      noRoleFixed,
      fixes: results,
      activated: activatedCount.modifiedCount,
      currentCounts: counts
    });
  } catch (error) {
    console.error('Error migrating users:', error);
    return NextResponse.json(
      { message: 'Failed to migrate users', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}); 