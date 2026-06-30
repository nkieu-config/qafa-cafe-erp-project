import type { MetadataRoute } from "next";
import { themeDefaults } from "@/lib/theme/defaults";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BranchBrew ERP",
    short_name: "BranchBrew",
    description: "Multi-branch cafe ERP — POS, inventory, kitchen, and payroll",
    start_url: "/",
    display: "standalone",
    background_color: themeDefaults.light.background,
    theme_color: themeDefaults.light.accent,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
