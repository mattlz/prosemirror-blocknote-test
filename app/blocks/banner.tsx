"use client";
import { defaultBlockSpecs, BlockNoteSchema } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

export const Banner = createReactBlockSpec(
  {
    type: "banner",
    propSchema: {
      textAlignment: { default: "left" },
      textColor: { default: "#92400E" },
      backgroundColor: { default: "#FEF3C7" },
    },
    content: "inline",
  },
  {
    render: ({ block, contentRef }) => {
      return (
        <div
          style={{
            background: (block.props as any).backgroundColor,
            color: (block.props as any).textColor,
            padding: 8,
            borderRadius: 6,
          }}
        >
          <div ref={contentRef} />
        </div>
      );
    },
  }
);

export const bannerSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    banner: Banner,
  },
});


