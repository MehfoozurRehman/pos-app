import { cn } from '@renderer/lib/utils';
import { useRef } from 'react';

export function ScrollContainer({
  children,
  containerClassName,
  childrenClassName,
  ...props
}: { children: React.ReactNode } & React.HTMLProps<HTMLDivElement> & {
    containerClassName?: string;
    childrenClassName?: string;
  }) {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (ref.current?.offsetLeft || 0);
    scrollLeft.current = ref.current?.scrollLeft || 0;
    document.body.style.cursor = 'grabbing';
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
  };

  const onMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const prev = el.scrollLeft;
      el.scrollLeft += e.deltaY;
      if (el.scrollLeft !== prev) {
        e.preventDefault();
      }
    }
  };

  return (
    <div
      ref={ref}
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        cursor: 'grab',
        width: '100%',
        WebkitOverflowScrolling: 'touch',
        ...(props.style as React.CSSProperties),
      }}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
      {...props}
      className={cn('hide-scrollbar', containerClassName)}
    >
      <div style={{ whiteSpace: 'nowrap' }} className={childrenClassName}>
        {children}
      </div>
    </div>
  );
}
