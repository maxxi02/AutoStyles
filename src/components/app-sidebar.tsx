"use client";

import * as React from "react";
import {
  GalleryVerticalEnd,
  Home,
  Car,
  CreditCard,
  BarChart3,
  Package,
  Settings2,
  Zap,
  Users,
  BookOpen,
  Frame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { TeamSwitcher } from "./team-switcher";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string; onClick?: () => void }[];
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  photoURL?: string;
}

function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userRole, setUserRole] = React.useState<
    "user" | "admin" | "autoworker"
  >("user");
  const [user, setUser] = React.useState<UserData | null>(null);
  const [navMain, setNavMain] = React.useState<NavItem[]>([]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Initial fallback
        setUser({
          name: currentUser.displayName || "AutoStyles User",
          email: currentUser.email || "user@example.com",
          avatar: "/avatars/default.jpg",
        });
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData & {
              role?: string;
              photoURL?: string;
            };
            const role = data?.role || "user";
            setUserRole(role as "user" | "admin" | "autoworker");
            // Update user with Firestore data, including photoURL for avatar
            setUser({
              name: data.name || currentUser.displayName || "AutoStyles User",
              email: currentUser.email || "user@example.com",
              avatar: data.photoURL || "/avatars/default.jpg", // Use photoURL if available
            });
          } else {
            setUserRole("user");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("user");
        }
      } else {
        setUser(null);
        setUserRole("user");
      }
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (userRole === "user") {
      setNavMain([
        {
          title: "Home",
          url: "/c/dashboard",
          icon: Home,
          isActive: false,
        },
        {
          title: "Customization",
          url: "/c/customization",
          icon: Car,
          items: [
            {
              title: "Select Car Type",
              url: "/c/customization/car-type",
            },
            {
              title: "Choose Color & Finish",
              url: "/c/customization/color",
            },
            {
              title: "2D Preview",
              url: "/c/customization/preview",
            },
            {
              title: "Save Design",
              url: "/c/customization/save",
            },
          ],
        },
        {
          title: "Transactions",
          url: "/c/transactions",
          icon: CreditCard,
          items: [
            {
              title: "My Orders",
              url: "/c/transactions/orders",
            },
            {
              title: "Review & Confirm",
              url: "/c/transactions/review",
            },
          ],
        },
        {
          title: "Account",
          url: "/c/account",
          icon: Settings2,
          items: [
            {
              title: "Profile",
              url: "/c/account/profile",
            },
            {
              title: "Security",
              url: "/c/account/security",
            },
            {
              title: "Settings",
              url: "/c/account/settings",
            },
            {
              title: "Logout",
              url: "#",
              onClick: () => {}, // Handle logout here if needed
            },
          ],
        },
        {
          title: "About",
          url: "/c/about",
          icon: BookOpen,
        },
      ]);
    } else if (userRole === "autoworker") {
      // Autoworker role
      setNavMain([
        {
          title: "Dashboard",
          url: "/w/dashboard",
          icon: Frame,
          isActive: true,
        },
        {
          title: "My Assignments",
          url: "/w/assignments",
          icon: Car,
          items: [
            {
              title: "Active Jobs",
              url: "/w/assignments/active",
            },
            {
              title: "Completed",
              url: "/w/assignments/completed",
            },
          ],
        },
        {
          title: "Account",
          url: "/w/account",
          icon: Settings2,
          items: [
            {
              title: "Profile",
              url: "/w/account/profile",
            },
            {
              title: "Security",
              url: "/w/account/security",
            },
            {
              title: "Logout",
              url: "#",
              onClick: () => {}, // Handle logout here if needed
            },
          ],
        },
      ]);
    } else {
      // Admin role
      setNavMain([
        {
          title: "Dashboard",
          url: "/a/dashboard",
          icon: Frame,
          isActive: false, // Changed from true
        },
        {
          title: "Transactions",
          url: "/a/transactions",
          icon: CreditCard,
          items: [
            {
              title: "Online Orders",
              url: "/a/transactions/online",
            },
            {
              title: "Walk-In",
              url: "/a/transactions/walkin",
            },
            {
              title: "Pending",
              url: "/a/transactions/pending",
            },
            {
              title: "Completed",
              url: "/a/transactions/completed",
            },
          ],
        },
        {
          title: "Cashier",
          url: "/a/cashier",
          icon: Zap,
          items: [
            {
              title: "Pricing Rules",
              url: "/a/cashier", // Changed from /a/cashier/new
            },
            {
              title: "Payments",
              url: "/a/cashier/payments",
            },
          ],
        },
        {
          title: "Analytics",
          url: "/a/analytics",
          icon: BarChart3,
          items: [
            {
              title: "Sales Trends",
              url: "/a/analytics/sales",
            },
            {
              title: "Popular Colors",
              url: "/a/analytics/colors",
            },
            {
              title: "Reports",
              url: "/a/analytics/reports",
            },
          ],
        },
        {
          title: "Inventory",
          url: "/a/inventory",
          icon: Package,
          isActive: false, // Changed from true
        },
        {
          title: "Account",
          url: "/a/account",
          icon: Settings2,
          items: [
            {
              title: "Profile",
              url: "/a/account", // This should match your account page route
            },
            {
              title: "Logout",
              url: "#",
              onClick: () => {}, // Handle logout here if needed
            },
          ],
        },
        {
          title: "Users",
          url: "/a/users",
          icon: Users,
          items: [
            {
              title: "Manage Users",
              url: "/a/users/manage",
            },
            {
              title: "Roles & Permissions",
              url: "/a/users/roles",
            },
          ],
        },
      ]);
    }
  }, [userRole]);

  // Sample data for non-dynamic parts
  const data = {
    user: user || {
      name: "AutoStyles User",
      email: "user@example.com",
      avatar: "/avatars/default.jpg",
    },
    teams: [
      {
        name: "AutoStyles",
        logo: GalleryVerticalEnd,
        plan:
          userRole === "admin"
            ? "Enterprise"
            : userRole === "autoworker"
              ? "Worker"
              : "Customer",
      },
    ],
    projects: [
      {
        name: userRole === "admin" ? "Admin Tasks" : "Customization Projects",
        url: "#",
        icon: Frame,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <TeamSwitcher teams={data.teams} />
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-1">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
