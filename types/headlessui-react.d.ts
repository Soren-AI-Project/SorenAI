declare module "@headlessui/react" {
  import * as React from "react";

  export interface DialogProps {
    as?: React.ElementType;
    children?: React.ReactNode;
    className?: string;
    onClose: (value: boolean) => void;
    open?: boolean;
  }

  export const Dialog: React.FC<DialogProps> & {
    Panel: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    Title: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }>; // Added `as` property to fix the error
  };

  export interface TransitionProps {
    as?: React.ElementType;
    children?: React.ReactNode;
    show?: boolean;
    appear?: boolean; // Added this property to fix the error
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
  }

  export const Transition: React.FC<TransitionProps> & {
    Child: React.FC<TransitionProps>;
  };
}
