"use client";
import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactElement } from "react";

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
      const blockType = (props.block.props as any)?.type || "info";
      const alertType = alertTypes.find(
        (a) => a.value === blockType
      ) || alertTypes[3];
      const Icon = alertType.icon;

      // Get default text based on alert type
      const getDefaultText = () => {
        switch (blockType) {
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

      return (
        <div
          className="alert-block"
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
            }}
            data-placeholder={props.block.content.length === 0 ? getDefaultText() : undefined}
          />
        </div>
      );
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
    // Simplify toExternalHTML - just return the element without contentDOM
    // This prevents React rendering errors when dragging
    toExternalHTML: () => {
      // Return a simple div representation
      // The actual content will be handled by BlockNote's serialization
      const div = document.createElement("div");
      div.className = "alert-block";
      return div;
    },
  }
);