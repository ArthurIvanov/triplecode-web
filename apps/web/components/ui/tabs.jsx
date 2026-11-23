'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn('inline-flex rounded-lg border border-border bg-card p-1 text-muted-foreground', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn('min-h-10 rounded-md px-3 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:text-foreground', className)} {...props} />;
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn('mt-4', className)} {...props} />;
}
