import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const remoteCursorKey = new PluginKey("remoteCursors");

/**
 * Creates a ProseMirror plugin that renders remote caret widgets based on presence data.
 */
export function createRemoteCursorPlugin(
  getPresence: () => Array<{ userId: string; name: string; color: string; cursor: string }>
) {
  return new Plugin({
    key: remoteCursorKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, set) {
        return set.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        const presence = getPresence();
        const decorations: Decoration[] = [];
        for (const p of presence) {
          const pos = Number(p.cursor || 0);
          const color = p.color || "#3b82f6";
          const cursorEl = document.createElement("span");
          cursorEl.style.borderLeft = `2px solid ${color}`;
          cursorEl.style.marginLeft = "-1px";
          cursorEl.style.height = "1em";
          cursorEl.style.display = "inline-block";
          cursorEl.style.position = "relative";
          cursorEl.style.verticalAlign = "text-bottom";
          const label = document.createElement("div");
          label.textContent = p.name;
          label.style.position = "absolute";
          label.style.top = "-1.2em";
          label.style.left = "0";
          label.style.background = color;
          label.style.color = "white";
          label.style.padding = "0 4px";
          label.style.borderRadius = "3px";
          label.style.fontSize = "10px";
          cursorEl.appendChild(label);
          decorations.push(Decoration.widget(pos, cursorEl, { key: `cursor-${p.userId}` }));
        }
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}