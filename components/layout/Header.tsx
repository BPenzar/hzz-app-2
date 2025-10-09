'use client'

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
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={user ? '/dashboard' : '/'}>
          <div className="text-2xl font-bold text-primary cursor-pointer">HZZ-App</div>
        </Link>
        {showAuth && (
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Odjava
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Prijava</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Započni besplatno</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
