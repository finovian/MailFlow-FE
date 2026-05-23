'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebarStore'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Mail,
  Zap,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
} from 'lucide-react'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useTriggers } from '@/features/triggers/hooks/useTriggers'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Templates', href: '/templates', icon: Mail },
  { label: 'Triggers', href: '/triggers', icon: Zap },
  { label: 'Events', href: '/events', icon: Radio },
  { label: 'Logs', href: '/logs', icon: ScrollText },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  // Data presence checks for conditional menu items
  const { data: templatesData } = useTemplates({ page: 1, pageSize: 1 })
  const { data: triggersData } = useTriggers()

  const hasTemplates = (templatesData?.total ?? 0) > 0
  const hasTriggers = (triggersData?.data?.length ?? 0) > 0
  const showEvents = hasTemplates && hasTriggers

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-border/50 px-4',
            isCollapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="size-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">
              MailFlow
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => {
            // Conditionally hide Events if requirements aren't met
            if (item.label === 'Events' && !showEvents) return null

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'size-[18px] shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!isCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <React.Fragment key={item.href}>{linkContent}</React.Fragment>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="shrink-0 border-t border-border/50 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? 'icon-sm' : 'sm'}
                onClick={toggleSidebar}
                className={cn(
                  'w-full text-muted-foreground hover:text-foreground',
                  isCollapsed && 'mx-auto'
                )}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <>
                    <PanelLeftClose className="mr-2 size-4" />
                    <span className="text-xs">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
