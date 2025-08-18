import { useState } from "react";
export function useSidebar(initialOpen = true){
  const [open, setOpen] = useState<boolean>(initialOpen);
  return { open, setOpen };
}

