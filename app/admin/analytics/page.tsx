"use client"

import { useEffect, useState } from "react"
import { IconLoader2, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface AnalyticsTotals {
  generateSuccess: number
  generateFailed: number
  generateTotal: number
  generateSuccessRate: number
  fallbackUsed: number
  fallbackUsageRate: number
  rateLimited: number
}

interface DailyAnalytics {
  day: string
  generateSuccess: number
  generateFailed: number
  fallbackUsed: number
  rateLimited: number
}

interface AnalyticsResponse {
  range: string
  generatedAt: string
  totals: AnalyticsTotals
  daily: DailyAnalytics[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/analytics")
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You need to sign in first.")
        }
        if (response.status === 403) {
          throw new Error("You are not allowed to view admin analytics.")
        }
        throw new Error("Failed to fetch analytics.")
      }

      const payload: AnalyticsResponse = await response.json()
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAnalytics()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin Analytics</h1>
            <p className="text-sm text-white/60">Issue generation reliability for the last 7 days.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconRefresh className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex items-center gap-2 text-white/70">
            <IconLoader2 className="h-4 w-4 animate-spin" /> Loading analytics...
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Generate Success Rate" value={`${data.totals.generateSuccessRate}%`} detail={`${data.totals.generateSuccess}/${data.totals.generateTotal}`} />
              <MetricCard label="Generate Failures" value={String(data.totals.generateFailed)} detail="issue_generate failed" />
              <MetricCard label="Fallback Usage" value={`${data.totals.fallbackUsageRate}%`} detail={`${data.totals.fallbackUsed} fallback runs`} />
              <MetricCard label="Rate Limited" value={String(data.totals.rateLimited)} detail="errorCode=rate_limited" />
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">Daily Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-white/60">
                      <th className="px-2 py-2">Day</th>
                      <th className="px-2 py-2">Generate Success</th>
                      <th className="px-2 py-2">Generate Failed</th>
                      <th className="px-2 py-2">Fallback Used</th>
                      <th className="px-2 py-2">Rate Limited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((row) => (
                      <tr key={row.day} className="border-b border-white/5 text-white/85">
                        <td className="px-2 py-2 font-mono text-xs text-white/70">{row.day}</td>
                        <td className="px-2 py-2">{row.generateSuccess}</td>
                        <td className="px-2 py-2">{row.generateFailed}</td>
                        <td className="px-2 py-2">{row.fallbackUsed}</td>
                        <td className="px-2 py-2">{row.rateLimited}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-white/45">Updated {new Date(data.generatedAt).toLocaleString()}</p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{detail}</p>
    </div>
  )
}
