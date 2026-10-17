import type { ReactNode } from "react";
import { WINDOWS_MARK, APPLE_MARK, LINUX_MARK } from "./platform-marks";

function Mark({ d }: { d: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d={d} />
    </svg>
  );
}

export function WindowsIcon(): ReactNode {
  return <Mark d={WINDOWS_MARK} />;
}

export function AppleIcon(): ReactNode {
  return <Mark d={APPLE_MARK} />;
}

export function LinuxIcon(): ReactNode {
  return <Mark d={LINUX_MARK} />;
}
