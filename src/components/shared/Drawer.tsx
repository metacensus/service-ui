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
              {title}{" "}
              {secondaryTitle && (
              )}
            </DrawerTitle>
            <DrawerDescription hidden>{title}</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close panel</span>
            </button>
          </DrawerClose>
        </DrawerHeader>
          <div className="relative flex-1 px-4 xl:px-8">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
