"use client";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { insertOrUpdateBlock, BlockNoteEditor } from "@blocknote/core";
import { Info, Table, FileText } from "lucide-react";
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

  // Datatable block
  {
    title: "Datatable",
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: "datatable",
        props: { table: "documents" },
        content: [],
      });
    },
    aliases: ["datatable", "table", "documents"],
    group: "Custom Blocks",
    icon: <Table size={18} className="text-green-600" />,
    subtext: "Insert a dynamic documents table",
  },

  // Metadata block
  {
    title: "Metadata",
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: "metadata",
        props: { documentId: "" },
        content: [],
      });
    },
    aliases: ["metadata", "meta", "document info"],
    group: "Custom Blocks",
    icon: <FileText size={18} className="text-purple-600" />,
    subtext: "Insert a document metadata card",
  },
];