"use client";
import { useState, useRef, useEffect, type ReactElement } from "react";
import { 
  Info,
  Plus,
  ChevronDown,
  Table,
  FileText,
  Calendar,
} from "lucide-react";
import { insertOrUpdateBlock, BlockNoteEditor } from "@blocknote/core";
import { customSchema, type CustomBlockNoteEditor } from "./custom-schema";

interface BlockInsertButtonProps {
  editor: CustomBlockNoteEditor | null;
}

const blockTypes = [
  {
    id: "alert",
    label: "Alert Banner",
    icon: <Info size={16} className="text-blue-600" />,
    action: (editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>) => {
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
  },
  {
    id: "datatable",
    label: "Datatable",
    icon: <Table size={16} className="text-green-600" />,
    action: (editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>) => {
      insertOrUpdateBlock(editor, {
        type: "datatable",
        props: { table: "documents" },
        content: [],
      });
    },
  },
  {
    id: "metadata",
    label: "Metadata",
    icon: <FileText size={16} className="text-purple-600" />,
    action: (editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>) => {
      insertOrUpdateBlock(editor, {
        type: "metadata",
        props: { documentId: "" },
        content: [],
      });
    },
  },
  {
    id: "weeklyupdate",
    label: "Weekly Update",
    icon: <Calendar size={16} className="text-orange-600" />,
    action: (editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>) => {
      const docId = (((editor as any)?.options as any)?.comments?.threadStore?.docId) ?? "";
      insertOrUpdateBlock(editor, {
        type: "weeklyupdate",
        props: { docId },
        content: [],
      });
    },
  },
];

export function BlockInsertButton({ editor }: BlockInsertButtonProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!editor) return <></>;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        title="Insert custom block"
      >
        <Plus size={16} />
        <span>Insert Block</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-50">
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase">Custom Blocks</div>
            {blockTypes.map((block) => (
              <button
                key={block.id}
                onClick={() => {
                  block.action(editor);
                  setIsOpen(false);
                  // Focus the editor after insertion
                  editor.focus();
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                {block.icon}
                <span>{block.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}