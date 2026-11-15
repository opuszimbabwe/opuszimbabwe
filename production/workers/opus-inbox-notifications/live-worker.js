var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// live-worker.mjs
var OpusInboxLive = class {
  static {
    __name(this, "OpusInboxLive");
  }
  constructor(ctx) {
    this.ctx = ctx;
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/test/status") {
      const state = await this.ctx.storage.get("test-status");
      if (!state || state.expires_at < Date.now()) return Response.json({ state: "none" });
      const { tokenHash, ...safe } = state;
      return Response.json(safe);
    }
    if (path === "/test/schedule" && request.method === "POST") {
      const job = await request.json(), previous = await this.ctx.storage.get("test-status");
      if (previous && previous.created_at > Date.now() - 6e4) return Response.json({ error: "Wait one minute between closed-app tests" }, { status: 429 });
      const u = new URL(job.endpoint);
      if (u.protocol !== "https:" || !["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(u.hostname) && !u.hostname.endsWith(".push.services.mozilla.com") && !u.hostname.endsWith(".push.apple.com") && !u.hostname.endsWith(".notify.windows.com") && !u.hostname.endsWith(".wns.windows.com")) return new Response(null, { status: 400 });
      if (job.body.length > 2e4 || job.scheduled_at < Date.now() + 1e4 || job.scheduled_at > Date.now() + 6e4) return new Response(null, { status: 400 });
      await this.ctx.storage.put("test-job", job);
      const state = { test: job.test, state: "scheduled", created_at: Date.now(), scheduled_at: job.scheduled_at, expires_at: job.expires_at, tokenHash: job.tokenHash };
      await this.ctx.storage.put("test-status", state);
      await this.ctx.storage.setAlarm(job.scheduled_at);
      const { tokenHash, ...safe } = state;
      return Response.json(safe);
    }
    if (path === "/test/receipt" && request.method === "POST") {
      const data = await request.json(), state = await this.ctx.storage.get("test-status");
      if (!state || state.expires_at < Date.now() || data.test !== state.test || data.tokenHash !== state.tokenHash) return new Response(null, { status: 403 });
      if (!state.received_at) {
        Object.assign(state, { received_at: Date.now(), shown: data.shown, clients_known: data.clients_known, error: data.error, window_clients: data.window_clients, visible_clients: data.visible_clients });
        await this.ctx.storage.put("test-status", state);
      }
      return new Response(null, { status: 204 });
    }
    if (path === "/socket" && request.headers.get("upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair(), [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ expiresAt: Date.now() + 15 * 60 * 1e3 });
      server.send(JSON.stringify({ type: "connected", at: Date.now() }));
      const since = Number(new URL(request.url).searchParams.get("since"));
      if (Number.isFinite(since) && since > 0) {
        const recent = await this.ctx.storage.get("recent") || [];
        for (const event of recent) if (event.sentAt >= Math.max(since, Date.now() - 3e5)) server.send(JSON.stringify(event));
      }
      return new Response(null, { status: 101, webSocket: client });
    }
    if (path === "/publish" && request.method === "POST") {
      const message = await request.json();
      if (typeof message.type !== "string") return new Response(null, { status: 400 });
      const recent = await this.ctx.storage.get("recent") || [];
      await this.ctx.storage.put("recent", [...recent.filter((event) => event.sentAt > Date.now() - 3e5), message].slice(-50));
      const text = JSON.stringify(message);
      if (text.length > 2048) return new Response(null, { status: 413 });
      let delivered = 0;
      for (const socket of this.ctx.getWebSockets()) try {
        if ((socket.deserializeAttachment()?.expiresAt || 0) < Date.now()) {
          socket.close(1008, "Refresh authentication");
          continue;
        }
        socket.send(text);
        delivered++;
      } catch {
        try {
          socket.close(1011, "Reconnect");
        } catch {
        }
      }
      return Response.json({ ok: true, delivered });
    }
    return new Response(null, { status: 404 });
  }
  async alarm() {
    const job = await this.ctx.storage.get("test-job");
    if (!job) {
      await this.ctx.storage.deleteAll();
      return;
    }
    let status = 0;
    try {
      const response = await fetch(job.endpoint, { method: "POST", headers: job.headers, body: Uint8Array.from(atob(job.body), (c) => c.charCodeAt(0)), signal: AbortSignal.timeout(1e4) });
      status = response.status;
      await response.body?.cancel();
    } catch {
    }
    console.info(JSON.stringify({ event: "opus_push_test_send", test: job.test, provider_status: status, attempted_at: Date.now() }));
    const state = await this.ctx.storage.get("test-status");
    if (state && state.test === job.test) {
      Object.assign(state, { state: "sent", attempted_at: Date.now(), provider_status: status });
      await this.ctx.storage.put("test-status", state);
    }
    await this.ctx.storage.delete("test-job");
    await this.ctx.storage.setAlarm(job.expires_at);
  }
  webSocketMessage(socket, message) {
    if (message === "ping") socket.send("pong");
    else if (typeof message === "string" && message.length > 1024) socket.close(1009, "Message too large");
  }
  webSocketClose(socket, code) {
    try {
      socket.close(code === 1006 ? 1e3 : code, "Closed");
    } catch {
    }
  }
  webSocketError(socket) {
    try {
      socket.close(1011, "Reconnect");
    } catch {
    }
  }
};
var live_worker_default = { fetch() {
  return new Response("Not found", { status: 404 });
} };
export {
  OpusInboxLive,
  live_worker_default as default
};
//# sourceMappingURL=live-worker.js.map
