import { SignInButton } from "@/components/auth/sign-in-button"
import { ListChecks, Gauge, Pin } from "lucide-react"

export function LandingSection() {
  return (
    <>
      <div className="text-center max-w-4xl mx-auto space-y-8 mb-32 md:mb-40">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.9] text-white">
            Writing issues<br />
            <span className="text-white/50">sucks.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-xl mx-auto leading-relaxed font-medium">
            Choose Bug, Feature, or Task in plain English. <br />
            Get a structured, prioritized issue ready for GitHub.
          </p>
        </div>

        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-1000 delay-200 fill-mode-both pt-4">
          <SignInButton />
          <p className="mt-4 text-xs text-white/40 font-mono uppercase tracking-widest opacity-60">
            Free Forever - Just GitHub - No Installs
          </p>
        </div>
      </div>

      <div className="w-full grid md:grid-cols-3 gap-6 mb-32">
        <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
          <ListChecks className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Structured in 1 Click</h3>
          <p className="text-white/60">Choose Bug, Feature, or Task and get clean GitHub-ready formatting.</p>
        </div>
        <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
          <Gauge className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Smarter Prioritization</h3>
          <p className="text-white/60">Auto-suggests P0-P3 severity so triage starts faster.</p>
        </div>
        <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
          <Pin className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Built for Repeated Use</h3>
          <p className="text-white/60">Pinned repos, last-repo memory, and reliable generation with fallback.</p>
        </div>
      </div>
    </>
  )
}
