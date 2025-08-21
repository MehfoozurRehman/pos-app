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

  return (
    <div
      ref={ref}
      style={{ overflow: 'hidden', cursor: 'grab', width: '100%' }}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      {...props}
      className={containerClassName}
    >
      <div style={{ whiteSpace: 'nowrap' }} className={childrenClassName}>
        {children}
      </div>
    </div>
  );
}
