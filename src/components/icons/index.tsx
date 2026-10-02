import type { ComponentPropsWithoutRef, ComponentType } from "react";
import type { NavIconName } from "@/types";

export type IconProps = ComponentPropsWithoutRef<"svg">;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.75 10.5 12 4.25l8.25 6.25v8.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M9.75 20.5v-5.25h4.5v5.25" />
    </IconBase>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.75" r="3.75" />
      <path d="M4.75 20.25c1.5-3.3 4.12-5 7.25-5s5.75 1.7 7.25 5" />
    </IconBase>
  );
}

export function OpportunitiesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.75 9.75h16.5v8.5a1.75 1.75 0 0 1-1.75 1.75h-13a1.75 1.75 0 0 1-1.75-1.75z" />
      <path d="M9 9.75V7.5A1.75 1.75 0 0 1 10.75 5.75h2.5A1.75 1.75 0 0 1 15 7.5v2.25" />
    </IconBase>
  );
}

export function InterviewIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11.75c0 3.45-3.58 6.25-8 6.25-1.06 0-2.07-.18-3-.5L5 19.25l1.14-3.2A5.9 5.9 0 0 1 4 11.75C4 8.3 7.58 5.5 12 5.5s8 2.8 8 6.25Z" />
    </IconBase>
  );
}

export function JourneyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6.5" cy="18" r="2.25" />
      <circle cx="17.5" cy="6" r="2.25" />
      <path d="M6.5 15.75C6.5 11.25 17.5 11.25 17.5 8.25" strokeDasharray="2 3" />
    </IconBase>
  );
}

export function BubbleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9.25" cy="14" r="4.75" />
      <circle cx="16.75" cy="8.75" r="2.75" />
      <circle cx="15.75" cy="17.5" r="1.75" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.75 12h13.5" />
      <path d="M13 6.75 18.25 12 13 17.25" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19.25 12H5.75" />
      <path d="M11 6.75 5.75 12 11 17.25" />
    </IconBase>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16.862 4.487a2.06 2.06 0 1 1 2.913 2.913L8.5 18.675l-3.75.75.75-3.75L16.862 4.487Z" />
      <path d="M14.75 6.6 17.4 9.25" />
    </IconBase>
  );
}

export const iconRegistry: Record<NavIconName, ComponentType<IconProps>> = {
  home: HomeIcon,
  opportunities: OpportunitiesIcon,
  interview: InterviewIcon,
  journey: JourneyIcon,
  bubble: BubbleIcon,
};
