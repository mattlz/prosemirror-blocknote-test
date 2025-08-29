"use client";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { insertOrUpdateBlock, BlockNoteEditor } from "@blocknote/core";
import { Info, Table, FileText, Calendar } from "lucide-react";
import { customSchema } from "./custom-schema";

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
      });
    },
    aliases: ["metadata", "meta", "document info"],
    group: "Custom Blocks",
    icon: <FileText size={18} className="text-purple-600" />,
    subtext: "Insert a document metadata card",
  },

  // Weekly Update block
  {
    title: "Weekly Update",
    onItemClick: () => {
      type EditorWithComments = { options?: { comments?: { threadStore?: { docId?: string } } } };
      const docId = ((editor as unknown as EditorWithComments).options?.comments?.threadStore?.docId) ?? "";
      insertOrUpdateBlock(editor, {
        type: "weeklyupdate",
        props: { docId },
      });
    },
    aliases: ["weekly", "status", "update"],
    group: "Custom Blocks",
    icon: <Calendar size={18} className="text-orange-600" />,
    subtext: "Insert weekly updates list for this page",
  },
];
