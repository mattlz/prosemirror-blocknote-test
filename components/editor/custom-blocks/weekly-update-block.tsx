"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";

type WeeklyUpdateProps = {
  docId?: string;
  textAlignment?: (typeof defaultProps.textAlignment)["default"];
};

function WeeklyUpdateBlockComponent(renderProps: any): ReactElement {
  const props = (renderProps.block.props as WeeklyUpdateProps) ?? {};
  const docId = props.docId ?? "";

  const updates = useQuery(api.documents.listWeeklyUpdates as any, docId ? { docId } : "skip") as any[] | undefined;
  const createUpdate = useMutation(api.documents.createWeeklyUpdate as any);

  const rows = useMemo(() => updates ?? [], [updates]);

  const handleAdd = async (): Promise<void> => {
    const accomplished = window.prompt("What did you accomplish this week?", "") ?? "";
    const focus = window.prompt("What is next week's focus?", "") ?? "";
    const blockers = window.prompt("Do you have any blockers?", "") ?? "";
    if (!docId) return;
    try {
      await createUpdate({ docId, accomplished, focus, blockers });
    } catch {}
  };

  return (
    <div className="weekly-update-block" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, margin: "8px 0", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Weekly Updates</div>
        <div contentEditable={false}>
          <Button type="button" onClick={handleAdd} size="sm">Add Update</Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No updates yet. Click Add Update to create the first one.</div>
      ) : (
        <div style={{ display: "grid", rowGap: 10 }}>
          {rows.map((r) => (
            <div key={String(r._id)} style={{ border: "1px solid #f3f4f6", borderRadius: 6, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{new Date(r.createdAt).toLocaleString()}</div>
                {r.authorId ? <div style={{ color: "#6b7280" }}>by {r.authorId}</div> : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", rowGap: 6, columnGap: 12 }}>
                <div style={{ color: "#6b7280", fontWeight: 500 }}>Accomplished this week</div>
                <div>{r.accomplished || "-"}</div>
                <div style={{ color: "#6b7280", fontWeight: 500 }}>Next week's focus</div>
                <div>{r.focus || "-"}</div>
                <div style={{ color: "#6b7280", fontWeight: 500 }}>Blockers</div>
                <div>{r.blockers || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const WeeklyUpdate = createReactBlockSpec(
  {
    type: "weeklyupdate",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      docId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <WeeklyUpdateBlockComponent {...props} />;
    },
    toExternalHTML: (props): ReactElement => {
      return (
        <div className="weekly-update-block" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Weekly Updates</strong>
        </div>
      );
    },
  }
);

export type WeeklyUpdateType = "weeklyupdate";


