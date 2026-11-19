import { blockedUsername } from "./username.mjs";
import { DurableObject } from "cloudflare:workers";
import names from "../src/data/names.jsx";

const DUEL_MS = 180000;
const PAIR_COUNT = 6;
const QUESTION_MS = 15000;
const REVEAL_MS = 2400;
const ROOM_TTL = 30 * 60 * 1000;
const ROUNDS = 10;
const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });
const rankings = env => env.RANKINGS.getByName("global");
const validToken = token => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

async function playerId(token) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

function shuffled(items) {
  const result = [...items];
  const random = crypto.getRandomValues(new Uint32Array(result.length));
  for (let i = result.length - 1; i > 0; i--) {
    const j = random[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function questions() {
  const meanings = [...new Set(names.map(name => name.meaning))];
  return shuffled(names).slice(0, ROUNDS).map(({ arabic, name, meaning }) => {
    const options = shuffled([meaning, ...shuffled(meanings.filter(item => item !== meaning)).slice(0, 3)]);
    return { arabic, name, options, correct: options.indexOf(meaning) };
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get("Origin");
    if (path === "/health" && request.method === "GET" && !origin) {
      return json({ service: "99 Reflections multiplayer", ready: true });
    }
    if (!env.ALLOWED_ORIGINS.split(",").includes(origin)) return json({ error: "Origin not allowed." }, 403);
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/health" && request.method === "GET") {
      return json({ service: "99 Reflections multiplayer", ready: true }, 200, cors);
    }
    if (path === "/leaderboard" && request.method === "GET") {
      return json({ players: await rankings(env).top(new URL(request.url).searchParams.get("scoring") === "points") }, 200, cors);
    }
    if (path === "/profile" && request.method === "POST") {
      let body;
      try {
        const raw = await request.text();
        if (raw.length > 512) return json({ error: "Request too large." }, 413, cors);
        body = JSON.parse(raw);
      } catch {
        return json({ error: "Invalid profile." }, 400, cors);
      }
      const username = typeof body?.username === "string" ? body.username.trim().normalize("NFKC") : "";
      if (!validToken(body?.token) || !/^\p{L}[\p{L}\p{N}_-]{2,19}$/u.test(username)) {
        return json({ error: "Use 3–20 letters, numbers, underscores or hyphens. Start with a letter." }, 400, cors);
      }
      if (blockedUsername(username)) return json({ error: "Choose a respectful username without profanity or abusive language." }, 422, cors);
      const result = await rankings(env).register(await playerId(body.token), username);
      return json(result, result.error ? 409 : 200, cors);
    }
    const room = /^\/rooms\/([0-9]{4}|[A-F0-9]{10})\/(create|join)$/.exec(path);
    if (room && request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return env.ROOMS.getByName(room[1]).fetch(request);
    }
    return json({ error: "Not found." }, 404, cors);
  },
};

export class Leaderboard extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY, username TEXT NOT NULL, normalized TEXT UNIQUE NOT NULL,
      best INTEGER NOT NULL DEFAULT 0, played INTEGER NOT NULL DEFAULT 0
    )`);
    if (!this.sql.exec("PRAGMA table_info(profiles)").toArray().some(column => column.name === "best_points")) {
      this.sql.exec("ALTER TABLE profiles ADD COLUMN best_points INTEGER");
    }
    this.sql.exec("CREATE INDEX IF NOT EXISTS points_ranking ON profiles(best_points DESC, normalized)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, recorded INTEGER NOT NULL)");
    this.sql.exec("CREATE INDEX IF NOT EXISTS ranking ON profiles(best DESC, normalized)");
  }

  register(id, username) {
    const profile = this.profile(id);
    if (profile && !blockedUsername(profile.username)) return profile;
    const normalized = username.toLowerCase().normalize("NFKC");
    if (profile) {
      const updated = this.sql.exec(
        "UPDATE OR IGNORE profiles SET username = ?, normalized = ? WHERE id = ? RETURNING username",
        username, normalized, id
      ).toArray()[0];
      return updated ?? { error: "That username is taken. Try another." };
    }
    const added = this.sql.exec(
      "INSERT OR IGNORE INTO profiles(id, username, normalized) VALUES (?, ?, ?) RETURNING username",
      id, username, normalized
    ).toArray()[0];
    return added ?? { error: "That username is taken. Try another." };
  }

  profile(id) {
    return this.sql.exec("SELECT username FROM profiles WHERE id = ?", id).toArray()[0] ?? null;
  }

  top(points) {
    const query = points
      ? "SELECT username, best_points AS best FROM profiles WHERE best_points IS NOT NULL ORDER BY best_points DESC, normalized"
      : "SELECT username, best FROM profiles WHERE played > 0 ORDER BY best DESC, normalized";
    const top = [];
    for (const row of this.sql.exec(query)) {
      if (!blockedUsername(row.username)) top.push(row);
      if (top.length === 50) break;
    }
    return top;
  }

  record(id, players, points) {
    this.ctx.storage.transactionSync(() => {
      const added = this.sql.exec(
        "INSERT OR IGNORE INTO matches VALUES (?, ?) RETURNING id", id, Date.now()
      ).toArray().length;
      if (!added) return;
      for (const player of players) {
        const update = points
          ? "UPDATE profiles SET best_points = MAX(COALESCE(best_points, 0), ?) WHERE id = ?"
          : "UPDATE profiles SET best = MAX(best, ?), played = played + 1 WHERE id = ?";
        this.sql.exec(update, player.score, player.id);
      }
      this.sql.exec("DELETE FROM matches WHERE recorded < ?", Date.now() - 2 * ROOM_TTL);
    });
  }
}

export class BattleRoom extends DurableObject {
  async fetch(request) {
    if (this.ctx.getWebSockets().length >= 8) return new Response("Room busy", { status: 429 });
    const [, , code, mode] = new URL(request.url).pathname.split("/");
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ code, mode, opened: Date.now() });
    await this.ctx.storage.setAlarm(await this.nextAlarm(await this.ctx.storage.get("room")));
    return new Response(null, { status: 101, webSocket: client });
  }

  nextAlarm(room) {
    const pending = this.ctx.getWebSockets().filter(ws => ws.readyState === 1 && !ws.deserializeAttachment()?.id)
      .map(ws => ws.deserializeAttachment().opened + 10000);
    return Math.min(room?.deadline ?? Infinity, ...(room?.phase === "lantern" ? room.players.map(player => player.hideAt ?? Infinity) : []), room?.expires ?? Infinity,
      room?.unrecorded ? Date.now() + 1000 : Infinity, ...pending, Date.now() + ROOM_TTL);
  }

  connected(id) {
    return this.ctx.getWebSockets().some(ws => ws.readyState === 1 && ws.deserializeAttachment()?.id === id);
  }

  broadcast(room) {
    const question = room.questions?.[room.index];
    const visible = question && ["question", "reveal"].includes(room.phase);
    const players = room.players.map(({ id, username, score, answer, ready, streak }) => ({
      username, score, streak: streak ?? 0, answered: answer !== null, ready, connected: this.connected(id),
    }));
    for (const ws of this.ctx.getWebSockets()) {
      const you = room.players.findIndex(player => player.id === ws.deserializeAttachment()?.id);
      if (you === -1 || ws.readyState !== 1) continue;
      try {
        ws.send(JSON.stringify({
          type: "state", game: room.game ?? "quiz", board: room.deck?.map((card, index) => {
            const player = room.players[you];
            const matched = player.matched.includes(index);
            return { matched, pair: room.phase === "finished" ? card.pair + 1 : undefined, kind: card.kind, text: matched || player.flipped.includes(index) || room.phase === "finished" ? card.text : null };
          }), flipLocked: !!room.players[you].hideAt, points: !!room.points, code: room.code, phase: room.phase, players, you, total: room.game === "lantern" ? PAIR_COUNT : ROUNDS,
          number: room.index + 1, match: room.match, remaining: room.deadline ? Math.max(0, room.deadline - Date.now()) : 0,
          question: visible ? {
            arabic: question.arabic, name: question.name, options: question.options,
            correct: room.phase === "reveal" ? question.correct : null,
          } : null,
          answer: room.players[you].answer, earned: room.players[you].earned, bonus: room.players[you].bonus, rankingPending: !!room.unrecorded,
        }));
      } catch {
        ws.close(1011, "Connection interrupted");
      }
    }
  }

  start(room) {
    room.points = room.code.length === 4;
    room.match = crypto.randomUUID();
    if (room.game === "lantern") {
      room.points = false;
      const distinct = new Map(shuffled(names).map(name => [name.meaning, name]));
      const pairs = [...distinct.values()].slice(0, PAIR_COUNT);
      room.deck = shuffled(pairs.flatMap((name, pair) => [
        { pair, kind: "Name", text: name.arabic }, { pair, kind: "Meaning", text: name.meaning },
      ]));
      room.phase = "lantern";
      room.deadline = Date.now() + DUEL_MS;
      for (const player of room.players) Object.assign(player, { score: 0, answer: null, ready: false, matched: [], flipped: [], hideAt: null });
      return;
    }
    room.questions = questions();
    room.index = 0;
    room.phase = "question";
    room.deadline = Date.now() + QUESTION_MS;
    for (const player of room.players) Object.assign(player, { score: 0, streak: 0, answer: null, ready: false });
  }

  flip(room, player, index, now) {
    if (!Number.isInteger(index) || index < 0 || index >= room.deck.length ||
        player.matched.includes(index) || player.flipped.includes(index) || player.hideAt) return false;
    player.flipped.push(index);
    if (player.flipped.length === 2) {
      const [first, second] = player.flipped;
      if (room.deck[first].pair === room.deck[second].pair) {
        player.matched.push(first, second);
        player.flipped = [];
        player.score++;
        if (player.score === PAIR_COUNT) {
          room.phase = "finished";
          room.deadline = null;
        }
      } else {
        player.hideAt = now + 900;
      }
    }
    return true;
  }

  reveal(room) {
    for (const player of room.players) {
      const correct = player.answer === room.questions[room.index].correct;
      if (!room.points) {
        if (correct) player.score++;
        continue;
      }
      player.streak = correct ? player.streak + 1 : 0;
      player.bonus = correct ? ({ 3: 5, 5: 10, 10: 20 }[player.streak] ?? 0) : 0;
      const fraction = player.answerRemaining / QUESTION_MS;
      const speedPoints = fraction >= 0.75 ? 10 : fraction >= 0.35 ? 5 : 3;
      const delta = correct ? speedPoints + player.bonus : player.answer === null ? 0 : -3;
      const nextScore = Math.max(0, player.score + delta);
      player.earned = nextScore - player.score;
      player.score = nextScore;
    }
    room.phase = "reveal";
    room.deadline = Date.now() + REVEAL_MS;
  }

  async save(room) {
    await this.ctx.storage.put("room", room);
    await this.ctx.storage.setAlarm(this.nextAlarm(room));
    this.broadcast(room);
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 512) return ws.close(1008, "Invalid message");
    let message;
    try { message = JSON.parse(raw); } catch { return ws.close(1008, "Invalid message"); }
    if (!message || typeof message !== "object") return;
    const socket = ws.deserializeAttachment();
    if (!socket.id) {
      if (message.type !== "hello" || !validToken(message.token)) return ws.close(1008, "Invalid player");
      socket.id = await playerId(message.token);
      const profile = await rankings(this.env).profile(socket.id);
      if (!profile || blockedUsername(profile.username)) return ws.close(1008, "Choose a username first.");
      return this.ctx.blockConcurrencyWhile(async () => {
        if (ws.readyState !== 1 || ws.deserializeAttachment()?.id) return;
        let room = await this.ctx.storage.get("room");
        if (room?.expires <= Date.now()) {
          if (socket.mode === "join") return ws.close(1008, "Room expired. Create a new room.");
          if (room.unrecorded) return ws.close(4002, "Room code busy.");
          for (const old of this.ctx.getWebSockets()) {
            if (old !== ws && old.deserializeAttachment()?.id) old.close(1008, "Room expired.");
          }
          room = null;
        }
        if (!room && socket.mode === "create") {
          room = { code: socket.code, game: message.game === "lantern" ? "lantern" : "quiz", phase: "lobby", players: [], index: -1, expires: Date.now() + ROOM_TTL };
        }
        if (!room) return ws.close(1008, "Room not found. Check the code.");
        if ((room.game ?? "quiz") !== (message.game === "lantern" ? "lantern" : "quiz")) {
          return ws.close(socket.mode === "create" ? 4002 : 1008, "This code belongs to a different game.");
        }
        const existing = room.players.some(player => player.id === socket.id);
        if (socket.mode === "create" && room.players.length && !existing) return ws.close(4002, "Room code busy.");
        if (!existing && (room.phase !== "lobby" || room.players.length >= 2)) {
          return ws.close(1008, "Room is full.");
        }
        if (!existing) room.players.push({ id: socket.id, username: profile.username, score: 0, answer: null, ready: false });
        for (const other of this.ctx.getWebSockets()) {
          if (other !== ws && other.deserializeAttachment()?.id === socket.id) other.close(4001, "Room opened on another tab");
        }
        room.players.find(player => player.id === socket.id).username = profile.username;
        ws.serializeAttachment(socket);
        await this.save(room);
      });
    }

    await this.ctx.blockConcurrencyWhile(async () => {
      const room = await this.ctx.storage.get("room");
      const player = room?.players.find(item => item.id === socket.id);
      if (!player || ws.readyState !== 1 || room.expires <= Date.now()) return;
      const bothConnected = room.players.length === 2 && room.players.every(item => this.connected(item.id));
      if (message.type === "start" && room.phase === "lobby" && player === room.players[0] && bothConnected) {
        this.start(room);
      } else if (message.type === "flip" && room.phase === "lantern" && Date.now() < room.deadline &&
        message.match === room.match) {
        if (!this.flip(room, player, message.index, Date.now())) return;
      } else if (message.type === "answer" && room.phase === "question" && Date.now() < room.deadline &&
        message.match === room.match && message.number === room.index + 1 && player.answer === null &&
        Number.isInteger(message.choice) && message.choice >= 0 && message.choice < 4) {
        player.answer = message.choice;
        player.answerRemaining = Math.max(0, room.deadline - Date.now());
        if (room.players.every(item => item.answer !== null)) this.reveal(room);
      } else if (message.type === "rematch" && room.phase === "finished" && !room.unrecorded && bothConnected) {
        player.ready = true;
        if (room.players.every(item => item.ready)) this.start(room);
      } else {
        return;
      }
      room.expires = Date.now() + ROOM_TTL;
      await this.save(room);
    });
  }

  webSocketClose() {
    return this.ctx.blockConcurrencyWhile(async () => {
      const room = await this.ctx.storage.get("room");
      if (room) this.broadcast(room);
    });
  }

  webSocketError(ws) {
    if (ws.readyState === 1) ws.close(1011, "Connection interrupted");
  }

  alarm() {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = Date.now();
      for (const ws of this.ctx.getWebSockets()) {
        const socket = ws.deserializeAttachment();
        if (!socket.id && socket.opened + 10000 <= now) ws.close(1008, "Player timed out");
      }
      const room = await this.ctx.storage.get("room");
      if (!room || room.expires <= now) {
        if (room) {
          for (const ws of this.ctx.getWebSockets()) ws.close(1008, "Room expired.");
          await this.ctx.storage.delete("room");
        }
        const pending = this.ctx.getWebSockets().some(ws => ws.readyState === 1 && !ws.deserializeAttachment()?.id);
        if (pending) await this.ctx.storage.setAlarm(this.nextAlarm());
        return;
      }
      if (room.phase === "lantern") {
        for (const player of room.players) {
          if (player.hideAt && player.hideAt <= now) {
            player.flipped = [];
            player.hideAt = null;
          }
        }
      }
      if (room.deadline && room.deadline <= now) {
        if (room.phase === "lantern") {
          room.phase = "finished";
          room.deadline = null;
        } else if (room.phase === "question") {
          this.reveal(room);
        } else if (room.index + 1 < ROUNDS) {
          room.index++;
          room.phase = "question";
          room.deadline = now + QUESTION_MS;
          for (const player of room.players) player.answer = null;
        } else {
          room.phase = "finished";
          room.deadline = null;
          room.unrecorded = true;
        }
        await this.save(room);
      }
      if (room.unrecorded) {
        try {
          await rankings(this.env).record(room.match, room.players, !!room.points);
          room.unrecorded = false;
        } catch {
          // The alarm retries the same match ID, so a retried write cannot count twice.
        }
      }
      await this.save(room);
    });
  }
}
