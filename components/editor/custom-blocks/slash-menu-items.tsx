"use client";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { insertOrUpdateBlock, BlockNoteEditor } from "@blocknote/core";
import { Info } from "lucide-react";
import { customSchema } from "./custom-schema";
import type { ReactElement } from "react";

// Get all custom slash menu items including defaults
export const getCustomSlashMenuItems = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  
  // Single Alert block
  {
    title: "Alert",
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: "alert",
        props: { type: "info" },
        content: [{
          type: "text",
          text: "Alert",
          styles: {},
        }],
      });
    },
    aliases: ["alert", "info", "warning", "error", "success"],
    group: "Custom Blocks",
    icon: <Info size={18} className="text-blue-600" />,
    subtext: "Insert an alert message block",
  },
];