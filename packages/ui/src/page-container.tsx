import * as React from "react";
import { layoutConfig } from "@xentral/config";

/**
 * PageContainer — the Action-page content frame.
 * Locks max-width (1440 / 1600) and the responsive page padding (16/24/32)
 * from layout.config. The only approved wrapper for Action pages.
 */
export type PageContainerProps = {
  children: React.ReactNode;
  /** "desktop" = 1440 max, "large" = 1600 max. Default "desktop". */
  width?: "desktop" | "large";
  className?: string;
};

export function PageContainer({ children, width = "desktop", className = "" }: PageContainerProps) {
  const maxWidth = width === "large" ? layoutConfig.contentMaxWidth.largeDesktop : layoutConfig.contentMaxWidth.desktop;
  return (
    <div
      className={`mx-auto w-full px-4 md:px-6 lg:px-8 ${className}`}
      style={{ maxWidth }}
      data-archetype="action"
    >
      {children}
    </div>
  );
}

export default PageContainer;
