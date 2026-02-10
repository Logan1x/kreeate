import Image from "next/image"
import type { Session } from "next-auth"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface TopNavProps {
  session: Session | null
}

export function TopNav({ session }: TopNavProps) {
  return (
    <nav className="w-full flex justify-between items-center mb-16 md:mb-24 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-1.5 group cursor-default">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" transform="rotate(15)" className="text-white">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 4a4 4 0 0 1 3.995 3.8l.005 .2a1 1 0 0 1 .428 .096l3.033 -1.938a1 1 0 1 1 1.078 1.684l-3.015 1.931a7.17 7.17 0 0 1 .476 2.227h3a1 1 0 0 1 0 2h-3v1a6.01 6.01 0 0 1 -.195 1.525l2.708 1.616a1 1 0 1 1 -1.026 1.718l-2.514 -1.501a6.002 6.002 0 0 1 -3.973 2.56v-5.918a1 1 0 0 0 -2 0v5.917a6.002 6.002 0 0 1 -3.973 -2.56l-2.514 1.503a1 1 0 1 1 -1.026 -1.718l2.708 -1.616a6.01 6.01 0 0 1 -.195 -1.526v-1h-3a1 1 0 0 1 0 -2h3.001v-.055a7 7 0 0 1 .474 -2.173l-3.014 -1.93a1 1 0 1 1 1.078 -1.684l3.032 1.939l.024 -.012l.068 -.027l.019 -.005l.016 -.006l.032 -.008l.04 -.013l.034 -.007l.034 -.004l.045 -.008l.015 -.001l.015 -.002l.087 -.004a4 4 0 0 1 4 -4zm0 2a2 2 0 0 0 -2 2h4a2 2 0 0 0 -2 -2z" />
          </svg>
        </div>
        <span className="font-bold text-2xl tracking-tight text-white group-hover:tracking-wide transition-all duration-300">Kreeate</span>
      </div>
      {session && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User avatar"}
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover object-center"
              />
            )}
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-medium text-white">{session.user?.name}</span>
              {session.user?.email && (
                <span className="text-xs text-white/40 truncate max-w-[150px]">
                  {session.user.email}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="secondary"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            Sign out
          </Button>
        </div>
      )}
    </nav>
  )
}
