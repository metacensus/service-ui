import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { XIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";

type DrawerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  secondaryTitle?: string;
};

export default function MyDrawer({
  open,
  setOpen,
  children,
  title,
  secondaryTitle,
}: DrawerProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right" handleOnly>
      <DrawerContent className="w-screen max-w-5xl">
        <DrawerHeader className="flex items-start justify-between p-4 xl:px-8">
          <div>
            <DrawerTitle className="text-2xl font-bold leading-6">
              {title}{" "}
              {secondaryTitle && (
                <span className="text-muted-foreground">{secondaryTitle}</span>
              )}
            </DrawerTitle>
            <DrawerDescription hidden>{title}</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "ml-3 flex h-7 items-center bg-card",
                styles.focusRing
              )}
            >
              <span className="sr-only">Close panel</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex h-full flex-col overflow-y-scroll bg-card py-8 shadow-xl">
          <div className="relative flex-1 px-4 xl:px-8">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
