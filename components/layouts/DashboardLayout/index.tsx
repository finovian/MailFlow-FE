'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebarStore'
import { Sidebar } from '@/components/layouts/Sidebar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Mail,
  Zap,
  ScrollText,
  Menu,
  Settings,
  LogOut,
  User,
  Radio,
} from 'lucide-react'

import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useTriggers } from '@/features/triggers/hooks/useTriggers'
import { useEventDefinitions } from '@/features/events/hooks/useEvents'

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Templates', href: '/templates', icon: Mail },
  { label: 'Triggers', href: '/triggers', icon: Zap },
  { label: 'Events', href: '/events', icon: Radio },
  { label: 'Logs', href: '/logs', icon: ScrollText },
] as const

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebarStore()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch and initialize dynamic event definitions from backend registry
  useEventDefinitions()

  // Data presence checks
  const { data: templatesData } = useTemplates({ page: 1, pageSize: 1 })
  const { data: triggersData } = useTriggers()

  const hasTemplates = (templatesData?.total ?? 0) > 0
  const hasTriggers = (triggersData?.data?.length ?? 0) > 0
  const showEvents = hasTemplates && hasTriggers

  // Close mobile nav on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/50 px-4 py-3">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="size-4 text-primary" />
              </div>
              MailFlow
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 px-2 py-3">
            {MOBILE_NAV_ITEMS.map((item) => {
              if (item.label === 'Events' && !showEvents) return null

              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <item.icon className="mr-3 size-[18px]" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300 ease-in-out',
          'md:pl-64',
          isCollapsed && 'md:pl-16'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="mr-3 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:inline">{user?.email || 'admin@mailflow.io'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-foreground">Admin</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || 'admin@mailflow.io'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
          
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
