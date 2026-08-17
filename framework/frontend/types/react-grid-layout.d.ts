declare module 'react-grid-layout' {
  import React from 'react';

  export interface Layout {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
    static?: boolean;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    moved?: boolean;
    placeholder?: boolean;
  }

  export interface Layouts {
    [key: string]: Layout[];
  }

  export interface Breakpoints {
    [key: string]: number;
  }

  export interface Cols {
    [key: string]: number;
  }

  export interface GridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    layout: Layout[];
    layouts?: Layouts;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    cols?: number | Cols;
    rowHeight?: number;
    width?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    static?: boolean;
    margin?: [number, number] | number;
    containerPadding?: [number, number] | number;
    compactType?: 'vertical' | 'horizontal' | null;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    verticalCompact?: boolean;
    draggableHandle?: string;
    draggableCancel?: string;
    children?: React.ReactNode;
  }

  export interface ResponsiveGridLayoutProps extends GridLayoutProps {
    breakpoints?: Breakpoints;
    layouts?: Layouts;
    onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    onWidthChange?: (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
  }

  export class GridLayout extends React.Component<GridLayoutProps> {}

  export class Responsive extends React.Component<ResponsiveGridLayoutProps> {}

  export function WidthProvider<P extends { width?: number }>(
    component: React.ComponentType<P>
  ): React.ComponentType<Omit<P, 'width'>>;
}

declare module 'react-resizable' {
  import React from 'react';

  export interface ResizeCallbackData {
    node: HTMLElement;
    size: { width: number; height: number };
    handle: HTMLElement;
  }

  export interface ResizableProps {
    width: number;
    height: number;
    onResize?: (event: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResizeStart?: (event: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResizeStop?: (event: React.SyntheticEvent, data: ResizeCallbackData) => void;
    draggableOpts?: any;
    resizeHandles?: string[];
    children?: React.ReactNode;
  }

  export class Resizable extends React.Component<ResizableProps> {}
}
