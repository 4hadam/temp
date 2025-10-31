import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetUrl = searchParams.get("url")

    console.log("[v0] Proxy request for:", targetUrl)

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 })
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      return NextResponse.json({ error: `Invalid stream URL format: ${targetUrl}` }, { status: 400 })
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: new URL(targetUrl).origin,
      },
    })

    console.log("[v0] Proxy response status:", res.status, res.statusText)

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream fetch failed: ${res.statusText}` }, { status: res.status })
    }

    const headers = new Headers(res.headers)
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "*")
    headers.delete("set-cookie")

    const contentType = headers.get("content-type")
    if (!contentType || contentType.includes("text") || contentType.includes("octet-stream")) {
      if (targetUrl.includes(".m3u8")) {
        headers.set("Content-Type", "application/vnd.apple.mpegurl")
      } else if (targetUrl.includes(".ts")) {
        headers.set("Content-Type", "video/mp2t")
      }
    }

    return new Response(res.body, { status: res.status, headers })
  } catch (e: any) {
    console.error("[v0] Proxy error:", e)
    return NextResponse.json({ error: e?.message || "Proxy failed" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  })
}
