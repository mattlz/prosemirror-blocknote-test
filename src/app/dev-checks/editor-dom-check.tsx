"use client";
import { useEffect } from "react";

export function EditorDomCheck() {
  useEffect(() => {
    const count = document.querySelectorAll(".bn-editor, [data-editor-root]").length;
    console.log("[DevCheck] editor root nodes count:", count);
  }, []);
  return null;
}

