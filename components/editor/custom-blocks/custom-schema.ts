import { 
  BlockNoteSchema, 
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs 
} from "@blocknote/core";
import { Alert } from "./alert-block";

// Create the custom schema with our Alert block
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default block types
    ...defaultBlockSpecs,
    // Add our custom Alert block
    alert: Alert,
  },
  inlineContentSpecs: {
    // Keep default inline content
    ...defaultInlineContentSpecs,
  },
  styleSpecs: {
    // Keep default styles
    ...defaultStyleSpecs,
  },
});

// TypeScript type exports for the custom schema
export type CustomBlockNoteEditor = typeof customSchema.BlockNoteEditor;
export type CustomBlock = typeof customSchema.Block;
export type CustomPartialBlock = typeof customSchema.PartialBlock;