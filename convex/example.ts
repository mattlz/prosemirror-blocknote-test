import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  // In a real app, enforce authz here. For demo, allow all.
  // checkRead: async (ctx, id) => {},
  // checkWrite: async (ctx, id) => {},
});


