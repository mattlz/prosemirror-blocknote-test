import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Migration completed - pages table has been renamed to documentPages
export const migratePagesToDocumentPages = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Migration already completed: pages table has been renamed to documentPages");
    console.log("All data has been transferred to the new table");
    
    return { 
      success: true, 
      migrated: 0, 
      reason: "already_completed",
      message: "Migration was already completed successfully. All pages data is now in the 'documentPages' table."
    };
  },
});


