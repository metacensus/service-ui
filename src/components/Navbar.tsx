import { ToastAction } from "@radix-ui/react-toast";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "@/lib/next-navigation-compat";

  const pathName = usePathname();
  const router = useRouter();
  const { toast } = useToast();


      await del("recentlyViewedTopics");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to log out.",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
          </Button>
  );
};

export default Navbar;
