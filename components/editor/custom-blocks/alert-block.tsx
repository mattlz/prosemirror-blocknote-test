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
    toExternalHTML: (block) => {
      const blockType = (block.props as any)?.type || "info";
      const alertType = alertTypes.find(
        (a) => a.value === blockType
      ) || alertTypes[3]; // Default to info if not found
      
      const div = document.createElement("div");
      div.className = "alert-block";
      div.setAttribute("data-alert-type", blockType);
      div.style.cssText = `
        display: flex;
        background-color: ${alertType.backgroundColor};
        border: 1px solid ${alertType.borderColor};
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin: 0.5rem 0;
        align-items: flex-start;
        gap: 0.75rem;
      `;

      const iconWrapper = document.createElement("div");
      iconWrapper.style.cssText = `
        color: ${alertType.color};
        flex-shrink: 0;
        margin-top: 0.125rem;
      `;
      iconWrapper.innerHTML = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        ${
          blockType === "success"
            ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
            : blockType === "warning"
            ? '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>'
            : blockType === "error"
            ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>'
            : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
        }
      </svg>`;
      
      const content = document.createElement("div");
      content.style.cssText = `
        flex: 1;
        color: ${alertType.color};
        min-height: 1.25rem;
      `;

      div.appendChild(iconWrapper);
      div.appendChild(content);
      
      return {
        dom: div,
        contentDOM: content,
      };
    },
  }
);