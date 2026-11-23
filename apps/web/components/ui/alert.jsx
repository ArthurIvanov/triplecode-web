import { cn } from '@/lib/utils';

export function Alert({ className, variant, ...props }) {
  return <div data-slot="alert" role="alert" className={cn(variant === 'auth' ? 'form-status form-status-error' : 'rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive', className)} {...props} />;
}
