import { useState } from "react";
export function useBlockSelection(){
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  return { selectedBlockId, setSelectedBlockId };
}

