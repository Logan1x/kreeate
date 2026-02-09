import { SignInButton } from "@/components/auth/sign-in-button"

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
            Describe it in plain English. <br />
            Get a perfectly formatted bug report or feature request.
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
          <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <h3 className="text-2xl font-bold mb-3">AI-Powered</h3>
          <p className="text-white/60">Just describe what you want. Our AI formats it perfectly for GitHub.</p>
        </div>
        <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
          <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-2xl font-bold mb-3">Save Hours</h3>
          <p className="text-white/60">Stop wrestling with markdown. Generate complete issues in seconds.</p>
        </div>
        <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
          <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <h3 className="text-2xl font-bold mb-3">GitHub Native</h3>
          <p className="text-white/60">Direct integration with your repositories. No setup required.</p>
        </div>
      </div>
    </>
  )
}
