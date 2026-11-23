import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        link: 'px-0 text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Button({ asChild = false, variant, className, ...props }) {
  const Component = asChild ? Slot : 'button';
  const designClass = { brand: 'primary-button', secondary: 'secondary-button' }[variant];
  return <Component data-slot="button" className={cn(designClass || buttonVariants({ variant }), className)} {...props} />;
}
