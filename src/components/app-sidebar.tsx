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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userRole, setUserRole] = React.useState<"user" | "admin">("user");
  const [user, setUser] = React.useState<UserData | null>(null);
  const [navMain, setNavMain] = React.useState<NavItem[]>([]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "AutoStyles User",
          email: currentUser.email || "user@example.com",
          avatar: "/avatars/default.jpg",
        });
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data?.role || "user";
            setUserRole(role as "user" | "admin");
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
          title: "About",
          url: "/c/about",
          icon: BookOpen,
        },
        {
          title: "Contact",
          url: "/c/contact",
          icon: Users,
        },
      ]);
    } else {
      // Admin role
      setNavMain([
        {
          title: "Dashboard",
          url: "/a/dashboard",
          icon: Frame,
          isActive: true,
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
              title: "New Sale",
              url: "/a/cashier/new",
            },
            {
              title: "Payments",
              url: "/a/cashier/payments",
            },
            {
              title: "Receipts",
              url: "/a/cashier/receipts",
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
          items: [
            {
              title: "Car Models",
              url: "/a/inventory/models",
            },
            {
              title: "Paint Colors",
              url: "/a/inventory/colors",
            },
            {
              title: "Stock Levels",
              url: "/a/inventory/stock",
            },
          ],
        },

        {
          title: "Account",
          url: "/a/account",
          icon: Settings2,
          items: [
            {
              title: "Profile",
              url: "/a/account/profile",
            },
            {
              title: "Security",
              url: "/a/account/security",
            },
            {
              title: "Logout",
              url: "#",
              onClick: () => {}, // Handle logout here if needed
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
        plan: userRole === "admin" ? "Enterprise" : "Customer",
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
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="p-1">
        <NavMain items={navMain}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
