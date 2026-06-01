import React, { forwardRef } from 'react';

export interface AbsoluteFillProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
}

export const AbsoluteFill = forwardRef<HTMLDivElement, AbsoluteFillProps>(
  ({ children, style, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AbsoluteFill.displayName = 'AbsoluteFill';

export default AbsoluteFill;
