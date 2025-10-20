import React from "react";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0F19",
};

export const metadata = {
  title: "Story • Echo of Sardis",
  description: "Story bible, timeline, characters and themes",
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
