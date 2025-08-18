"use client";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import {
  insertOrUpdateBlock,
  BlockNoteEditor,
} from "@blocknote/core";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { customSchema } from "./custom-schema";
import type { ReactElement } from "react";

// Get default content for each alert type
const getDefaultContent = (type: "success" | "warning" | "error" | "info") => {
  switch (type) {
    case "success":
      return "Great job! Your operation completed successfully.";
    case "warning":
      return "Please note: This action may have unintended consequences.";
    case "error":
      return "Error: Something went wrong. Please try again.";
    case "info":
    default:
      return "This is some helpful information you should know about.";
  }
};

// Create slash menu items for each alert type
const createAlertMenuItem = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>,
  type: "success" | "warning" | "error" | "info",
  title: string,
  icon: ReactElement,
  subtext: string
): DefaultReactSuggestionItem => ({
  title,
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "alert",
      props: { type },
      content: [{
        type: "text",
        text: getDefaultContent(type),
        styles: {},
      }],
    });
  },
  aliases: [type, "alert", title.toLowerCase()],
  group: "Custom Blocks",
  icon,
  subtext,
});

// Get all custom slash menu items including defaults
export const getCustomSlashMenuItems = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  
  // Alert blocks
  createAlertMenuItem(
    editor,
    "success",
    "Success Alert",
    <CheckCircle2 size={18} className="text-green-600" />,
    "Insert a success message block"
  ),
  createAlertMenuItem(
    editor,
    "warning",
    "Warning Alert",
    <AlertCircle size={18} className="text-yellow-600" />,
    "Insert a warning message block"
  ),
  createAlertMenuItem(
    editor,
    "error",
    "Error Alert",
    <XCircle size={18} className="text-red-600" />,
    "Insert an error message block"
  ),
  createAlertMenuItem(
    editor,
    "info",
    "Info Alert",
    <Info size={18} className="text-blue-600" />,
    "Insert an info message block"
  ),
];