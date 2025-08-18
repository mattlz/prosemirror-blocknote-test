import { useState } from "react";
export function useModal(){
  const [open, setOpen] = useState<boolean>(false);
  return { open, setOpen };
}

