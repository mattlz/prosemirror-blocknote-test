"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";
import type { Document } from "@/types/documents.types";

type DatatableProps = {
  table: "documents";
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
};

type BlockProps = { table?: "documents"; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type RenderProps = { block: RenderBlock } & Record<string, unknown>;

function DatatableBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as DatatableProps) ?? { table: "documents" };
  const table = props.table ?? "documents";

  const list = useQuery(api.documents.list, {}) as Document[] | undefined;
  const createDoc = useMutation(api.documents.create);

  const rows = useMemo(() => {
    if (table !== "documents") return [] as Array<{ id: string; title: string; createdAt: number }>;
    return (list ?? []).map((d) => ({ id: String(d._id), title: d.title, createdAt: d.createdAt }));
  }, [list, table]);

  const handleAdd = async (): Promise<void> => {
    if (table !== "documents") return;
    try {
      await createDoc({ title: "Untitled" });
    } catch {
      // no-op for demo
    }
  };

  return (
    <div
      className="datatable-block"
      data-table={table}
      style={{
        width: "100%",
        border: "1px solid var(--dt-border, #e5e7eb)",
        borderRadius: 8,
        padding: 12,
        margin: "8px 0",
        background: "var(--dt-bg, #fff)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Documents</div>
        <div contentEditable={false}>
          <Button type="button" onClick={handleAdd} size="sm" variant="default">Add</Button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--dt-border, #e5e7eb)" }}>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>ID</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Title</th>
              <th style={{ padding: "6px 8px", fontWeight: 500 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--dt-border, #f3f4f6)" }}>
                <td style={{ padding: "6px 8px", whiteSpace: "nowrap", color: "var(--dt-muted, #6b7280)" }}>{r.id.slice(-8)}</td>
                <td style={{ padding: "6px 8px" }}>{r.title}</td>
                <td style={{ padding: "6px 8px", whiteSpace: "nowrap", color: "var(--dt-muted, #6b7280)" }}>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "10px 8px", color: "var(--dt-muted, #6b7280)" }}>No rows.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Datatable = createReactBlockSpec(
  {
    type: "datatable",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      table: { default: "documents" as const, values: ["documents"] as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <DatatableBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (props): ReactElement => {
      const tableName = ((props.block.props as DatatableProps)?.table ?? "documents").toString();
      return (
        <div className="datatable-block" data-table={tableName} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Datatable:</strong> {tableName}
        </div>
      );
    },
  }
);

export type DatatableType = "datatable";
