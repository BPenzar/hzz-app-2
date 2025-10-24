'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: {
    email?: string | null
  } | null
  showAuth?: boolean
}

export function Header({ user, showAuth = true }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="https://bsp-lab.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/bsp-lab-logo.png"
                alt="BSP Lab logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                priority
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">BSP Lab</span>
              </div>
            </Link>
            <div className="hidden h-6 w-px bg-gray-300 sm:block" />
            <Link
              href={user ? '/dashboard' : '/'}
              className="hidden flex-col sm:flex hover:text-primary transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">HZZ Zahtjev Creator</span>
              <span className="text-xs text-gray-500">AI asistent za HZZ samozapošljavanje</span>
            </Link>
            <span className="flex flex-col sm:hidden text-sm font-medium text-gray-900">
              HZZ Zahtjev Creator
            </span>
          </div>
          {showAuth && (
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-sm">
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Odjava</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-sm">Prijava</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="text-sm">Registracija</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
