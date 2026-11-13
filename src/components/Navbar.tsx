import { Button, Header, Nav } from "@metacensus/library-ui";
import { ToastAction } from "@radix-ui/react-toast";
import { FC } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSelf } from "@/hooks/useGetUserId";
import { apiClient } from "@/lib/apiClient";
import { del } from "@/lib/indexdb";
import { usePathname, useRouter } from "@/lib/next-navigation-compat";
import queryClient from "@/lib/queryClient";
import { LOGIN_PATH } from "@/lib/session";

export const APP_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/topics", label: "Topics" },
  { href: "/contributors", label: "Contributors" },
];

const Navbar: FC = () => {
  const pathName = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const userName = useSelf().data?.name;

  const logOut = async () => {
    try {
      await apiClient.logout();
      queryClient.clear();
      await del("recentlyViewedTopics");
      router.push(LOGIN_PATH);
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
    <Header
      homeHref="/dashboard"
      nav={
        <Nav
            ...link,
            current: pathName.includes(link.href),
          }))}
        />
      }
      actions={
        <>
          {userName && <span className="hidden text-sm sm:ml-4 sm:inline">{userName}</span>}
          <Button variant="secondary" onClick={logOut}>
            Log out
          </Button>
        </>
      }
    />
  );
};

export default Navbar;
