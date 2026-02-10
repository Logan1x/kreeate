"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { IconBrandGithub, IconLoader2 } from "@tabler/icons-react"

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn("github", { callbackUrl: "/" })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full sm:w-auto rounded-xl cursor-pointer text-base font-medium"
      size="lg"
    >
      {isLoading ? (
        <IconLoader2 stroke={2.25} className="mr-1.5 h-5 w-5 animate-spin" />
      ) : (
        <IconBrandGithub stroke={2.25} className="mr-1.5 h-5 w-5" />
      )}
      {isLoading ? "Signing in..." : "Sign in with GitHub"}
    </Button>
  )
}
