import { cn } from '@/lib/utils';

export function Card({ as: Component = 'div', className, variant, ...props }) {
  return <Component data-slot="card" className={cn(variant === 'auth' ? 'auth-card' : 'rounded-xl border border-border bg-card text-card-foreground', className)} {...props} />;
}
