"use client";
import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";

// Define alert types with their styling
export const alertTypes = [
  {
    title: "Success",
    value: "success" as const,
    icon: CheckCircle2,
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  {
    title: "Warning",
    value: "warning" as const,
    icon: AlertCircle,
    color: "#a16207",
    backgroundColor: "#fef3c7",
    borderColor: "#fde047",
  },
  {
    title: "Error",
    value: "error" as const,
    icon: XCircle,
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  {
    title: "Info",
    value: "info" as const,
    icon: Info,
    color: "#1e40af",
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
  },
];

export type AlertType = typeof alertTypes[number]["value"];

// Stable React component used by the block's render to avoid remounting on each update
function AlertBlockComponent(renderProps: any): ReactElement {
  const blockType = (renderProps.block.props as any)?.type || "info";
  const alertType = alertTypes.find((a) => a.value === blockType) || alertTypes[3];
  const Icon = alertType.icon;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const onSelectType = (nextType: AlertType): void => {
    if ((renderProps.block.props as any)?.type === nextType) {
      setOpen(false);
      return;
    }
    try {
      (renderProps.editor as any)?.updateBlock?.(renderProps.block as any, {
        type: "alert",
        props: { type: nextType },
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <div
      className="alert-block"
      data-alert-type={blockType}
      style={{
        display: "flex",
        backgroundColor: alertType.backgroundColor,
        border: `1px solid ${alertType.borderColor}`,
        borderRadius: "0.5rem",
        padding: "0.75rem",
        margin: "0.5rem 0",
        alignItems: "flex-start",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <div
        className="alert-icon-wrapper"
        contentEditable={false}
        style={{
          position: "relative",
          color: alertType.color,
          flexShrink: 0,
          marginTop: "0.125rem",
          cursor: "pointer",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            all: "unset",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Change alert type"
        >
          <Icon size={20} />
        </button>
        {open && (
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              background: "var(--alert-menu-bg, white)",
              border: "1px solid var(--alert-menu-border, #e5e7eb)",
              borderRadius: 8,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
              zIndex: 20,
              minWidth: 160,
              padding: 4,
            }}
          >
            {alertTypes.map((t) => {
              const TIcon = t.icon;
              const isActive = t.value === blockType;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onSelectType(t.value)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: isActive ? "var(--alert-menu-hover, #f3f4f6)" : "transparent",
                    color: "var(--alert-menu-fg, #111827)",
                  }}
                >
                  <TIcon size={16} color={t.color} />
                  <span>{t.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div
        ref={renderProps.contentRef}
        dir="ltr"
        style={{
          flex: 1,
          color: alertType.color,
          minHeight: "1.25rem",
          textAlign: (renderProps.block.props as any)?.textAlignment ?? "left",
          direction: "ltr",
          unicodeBidi: "isolate",
        }}
        data-placeholder={renderProps.block.content.length === 0 ? "Alert" : undefined}
      />
    </div>
  );
}

// Create the Alert block specification
export const Alert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      type: {
        default: "info" as const,
        values: ["success", "warning", "error", "info"] as const,
      },
    },
    content: "inline",
  },
  {
    render: (props): ReactElement => {
      return <AlertBlockComponent {...props} />;
    },
    parse: (element) => {
      if (element.tagName === "DIV" && element.classList.contains("alert-block")) {
        const typeAttr = element.getAttribute("data-alert-type");
        if (typeAttr && ["success", "warning", "error", "info"].includes(typeAttr)) {
          return {
            type: typeAttr as AlertType,
          };
        }
      }
      return undefined;
    },
    // Return a React element for external HTML serialization (e.g. drag/clipboard)
    // Matching the structure of `render` avoids passing an HTMLElement into React.
    toExternalHTML: (props): ReactElement => {
      const blockType = (props.block.props as any)?.type || "info";
      const alertType =
        alertTypes.find((a) => a.value === blockType) || alertTypes[3];
      const Icon = alertType.icon;

      return (
        <div
          className="alert-block"
          data-alert-type={blockType}
          style={{
            display: "flex",
            backgroundColor: alertType.backgroundColor,
            border: `1px solid ${alertType.borderColor}`,
            borderRadius: "0.5rem",
            padding: "0.75rem",
            margin: "0.5rem 0",
            alignItems: "flex-start",
            gap: "0.75rem",
            width: "100%",
          }}
        >
          <div
            className="alert-icon-wrapper"
            style={{
              color: alertType.color,
              flexShrink: 0,
              marginTop: "0.125rem",
            }}
          >
            <Icon size={20} />
          </div>
          <div
            ref={props.contentRef}
            style={{
              flex: 1,
              color: alertType.color,
              minHeight: "1.25rem",
              direction: "ltr",
              unicodeBidi: "isolate",
            }}
          />
        </div>
      );
    },
  }
);