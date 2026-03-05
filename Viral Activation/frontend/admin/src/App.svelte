<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import {
    adjustKick,
    createAnnouncement,
    getConfig,
    getDashboard,
    listAnnouncements,
    listBoardMembers,
    listKickLedger,
    listPiqueConversations,
    listUsers,
    loginWithTelegram,
    logoutSession,
    refreshSession,
    updateConfig,
    updateUserStatus,
    upsertBoardMember,
    verifyTotp,
    type AdminRole,
    type Announcement,
    type AppUser,
    type BoardMember,
    type KickLedgerItem,
    type PiqueConversation,
    type UserStatus
  } from "./lib/api/client";
  import { clearSession, session, setActive, setPending } from "./lib/stores/session";

  type PageId = "dashboard" | "users" | "configs" | "announcements" | "pique" | "board";

  const pages: { id: PageId; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users & KICK", icon: "👥" },
    { id: "configs", label: "Spin/Penalty", icon: "🎡" },
    { id: "announcements", label: "Announcements", icon: "📣" },
    { id: "pique", label: "PIQUE Logs", icon: "🤖" },
    { id: "board", label: "Board", icon: "🛡" }
  ];

  let page: PageId = "dashboard";
  let loading = false;
  let error = "";
  let toast = "";

  let tgId = "";
  let username = "";
  let hash = "";
  let authDate = Math.floor(Date.now() / 1000);
  let totpCode = "";

  let dashboard: { totalUsers: number; onlineUsers: number; totalKick: number; pendingReviews: number } | null =
    null;

  let users: AppUser[] = [];
  let usersTotal = 0;
  let userQ = "";
  let userStatus: "all" | UserStatus = "all";

  let ledger: KickLedgerItem[] = [];

  let selectedUserId = "";
  let kickDelta = 2000;
  let kickReason = "Manual adjustment";

  let spinConfigText = "{}";
  let penaltyConfigText = "{}";

  let announcements: Announcement[] = [];
  let annTitle = "";
  let annMessage = "";
  let annTarget = "all";

  let piqueLogs: PiqueConversation[] = [];
  let piqueTotal = 0;
  let piqueKeyword = "";
  let piqueUsername = "";
  let piqueSentiment = "";

  let boardMembers: BoardMember[] = [];
  let boardForm: {
    telegramId: string;
    username: string;
    displayName: string;
    role: AdminRole;
    requiresTotp: boolean;
    totpSecret: string;
    isActive: boolean;
  } = {
    telegramId: "",
    username: "",
    displayName: "",
    role: "moderator",
    requiresTotp: false,
    totpSecret: "",
    isActive: true
  };

  function showToast(message: string) {
    toast = message;
    setTimeout(() => {
      if (toast === message) toast = "";
    }, 2500);
  }

  async function withAccess<T>(run: (token: string) => Promise<T>): Promise<T> {
    const current = get(session);
    if (!current.accessToken) {
      throw new Error("Session expired");
    }
    try {
      return await run(current.accessToken);
    } catch (err) {
      if (!current.refreshToken) throw err;
      const refreshed = await refreshSession({ refreshToken: current.refreshToken });
      setActive({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        role: refreshed.profile.role,
        username: refreshed.profile.username
      });
      return run(refreshed.accessToken);
    }
  }

  async function handleTelegramLogin() {
    error = "";
    loading = true;
    try {
      const res = await loginWithTelegram({ id: tgId, username, hash, authDate });
      if (res.requiresTotp && res.pendingToken) {
        setPending(res.pendingToken);
        return;
      }
      if (res.accessToken && res.refreshToken && res.profile) {
        setActive({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          role: res.profile.role,
          username: res.profile.username
        });
        await bootstrap();
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function handleTotp() {
    error = "";
    loading = true;
    try {
      const pendingToken = get(session).pendingToken;
      if (!pendingToken) throw new Error("Pending token missing");
      const res = await verifyTotp({ pendingToken, code: totpCode });
      if (!res.accessToken || !res.refreshToken || !res.profile) {
        throw new Error("Invalid TOTP response");
      }
      setActive({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        role: res.profile.role,
        username: res.profile.username
      });
      await bootstrap();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function bootstrap() {
    await Promise.all([loadDashboard(), loadUsersAndLedger(), loadConfigs(), loadAnnouncements(), loadPique(), loadBoard()]);
  }

  async function loadDashboard() {
    dashboard = await withAccess((token) => getDashboard(token));
  }

  async function loadUsersAndLedger() {
    const userRes = await withAccess((token) =>
      listUsers(token, {
        q: userQ || undefined,
        status: userStatus === "all" ? undefined : userStatus,
        limit: 100
      })
    );
    users = userRes.items;
    usersTotal = userRes.total;
    if (!selectedUserId && users[0]) selectedUserId = users[0].id;
    const ledgerRes = await withAccess((token) => listKickLedger(token, { limit: 50 }));
    ledger = ledgerRes.items;
  }

  async function loadConfigs() {
    const [spin, penalty] = await Promise.all([
      withAccess((token) => getConfig(token, "spin")),
      withAccess((token) => getConfig(token, "penalty"))
    ]);
    spinConfigText = JSON.stringify(spin.value, null, 2);
    penaltyConfigText = JSON.stringify(penalty.value, null, 2);
  }

  async function loadAnnouncements() {
    announcements = await withAccess((token) => listAnnouncements(token));
  }

  async function loadPique() {
    const res = await withAccess((token) =>
      listPiqueConversations(token, {
        keyword: piqueKeyword || undefined,
        username: piqueUsername || undefined,
        sentiment: piqueSentiment || undefined,
        limit: 100
      })
    );
    piqueLogs = res.items;
    piqueTotal = res.total;
  }

  async function loadBoard() {
    const res = await withAccess((token) => listBoardMembers(token));
    boardMembers = res.items;
  }

  async function changeUserStatus(id: string, status: UserStatus) {
    loading = true;
    error = "";
    try {
      await withAccess((token) => updateUserStatus(token, { id, status }));
      await loadUsersAndLedger();
      showToast("User status updated");
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function submitKickAdjust() {
    if (!selectedUserId) {
      error = "Select a user first";
      return;
    }
    loading = true;
    error = "";
    try {
      await withAccess((token) =>
        adjustKick(token, {
          userId: selectedUserId,
          delta: Number(kickDelta),
          reason: kickReason,
          source: "admin_panel"
        })
      );
      await Promise.all([loadUsersAndLedger(), loadDashboard()]);
      showToast("KICK adjusted successfully");
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function saveConfig(key: "spin" | "penalty") {
    loading = true;
    error = "";
    try {
      const raw = key === "spin" ? spinConfigText : penaltyConfigText;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      await withAccess((token) => updateConfig(token, key, parsed));
      showToast(`${key.toUpperCase()} config saved`);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function submitAnnouncement() {
    if (!annTitle.trim() || !annMessage.trim()) {
      error = "Title and message are required";
      return;
    }
    loading = true;
    error = "";
    try {
      await withAccess((token) =>
        createAnnouncement(token, {
          title: annTitle,
          message: annMessage,
          target: annTarget,
          publishNow: true
        })
      );
      annTitle = "";
      annMessage = "";
      annTarget = "all";
      await loadAnnouncements();
      showToast("Announcement sent");
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function submitBoardMember() {
    if (!boardForm.telegramId || !boardForm.username || !boardForm.displayName) {
      error = "Please fill all board member fields";
      return;
    }
    loading = true;
    error = "";
    try {
      await withAccess((token) =>
        upsertBoardMember(token, {
          telegramId: boardForm.telegramId,
          username: boardForm.username,
          displayName: boardForm.displayName,
          role: boardForm.role,
          requiresTotp: boardForm.requiresTotp,
          totpSecret: boardForm.totpSecret || undefined,
          isActive: boardForm.isActive
        })
      );
      boardForm = {
        telegramId: "",
        username: "",
        displayName: "",
        role: "moderator",
        requiresTotp: false,
        totpSecret: "",
        isActive: true
      };
      await loadBoard();
      showToast("Board member saved");
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function doLogout() {
    const refreshToken = get(session).refreshToken;
    if (refreshToken) {
      try {
        await logoutSession({ refreshToken });
      } catch {
        // ignore
      }
    }
    clearSession();
    page = "dashboard";
    dashboard = null;
    users = [];
    ledger = [];
    announcements = [];
    piqueLogs = [];
    boardMembers = [];
  }

  function navigate(next: PageId) {
    page = next;
  }

  onMount(async () => {
    if (get(session).accessToken) {
      try {
        await bootstrap();
      } catch (e) {
        error = (e as Error).message;
      }
    }
  });
</script>

<main class="admin-root">
  <header class="login-header" aria-hidden={$session.accessToken ? "true" : "false"}>
    <div>
      <h1>WC26 NFT FANTASY</h1>
      <p>National Journey Airdrop - Viral Activation</p>
    </div>
  </header>

  {#if !$session.accessToken && !$session.pendingToken}
    <section class="login-panel">
      <h2>Telegram Login</h2>
      <p class="muted">Production flow: Telegram Widget payload -> whitelist TG ID -> TOTP (owner/admin).</p>
      <div class="form-grid">
        <label>Telegram ID <input bind:value={tgId} /></label>
        <label>Username <input bind:value={username} /></label>
        <label>Auth Date (unix) <input type="number" bind:value={authDate} /></label>
        <label>Hash <input bind:value={hash} /></label>
      </div>
      <button class="btn btn-primary" disabled={loading} on:click={handleTelegramLogin}>Sign in with Telegram</button>
    </section>
  {/if}

  {#if $session.pendingToken}
    <section class="login-panel">
      <h2>TOTP Verification</h2>
      <p class="muted">Role {$session.role ?? "owner/admin"} requires TOTP.</p>
      <label>6-digit code <input bind:value={totpCode} maxlength="6" /></label>
      <button class="btn btn-primary" disabled={loading} on:click={handleTotp}>Verify</button>
    </section>
  {/if}

  {#if $session.accessToken}
    <section class="shell">
      <aside class="sidebar">
        <div class="brand">
          <h2>WC26 Admin</h2>
          <small>{$session.username} · {$session.role}</small>
        </div>
        <nav>
          {#each pages as nav}
            <button class:active={page === nav.id} on:click={() => navigate(nav.id)}>
              <span>{nav.icon}</span>{nav.label}
            </button>
          {/each}
        </nav>
        <button class="btn btn-ghost" on:click={doLogout}>Logout</button>
      </aside>

      <section class="content">
        <header class="topbar">
          <h3>{pages.find((p) => p.id === page)?.label}</h3>
          <div class="chips">
            <span class="chip">LIVE</span>
            <span class="chip chip-green">Cloudflare Ready</span>
          </div>
        </header>

        {#if page === "dashboard"}
          <section class="grid-cards">
            <article>
              <h4>Total Users</h4>
              <p>{dashboard?.totalUsers?.toLocaleString() ?? "-"}</p>
            </article>
            <article>
              <h4>Online Users</h4>
              <p>{dashboard?.onlineUsers?.toLocaleString() ?? "-"}</p>
            </article>
            <article>
              <h4>Total KICK</h4>
              <p>{dashboard?.totalKick?.toLocaleString() ?? "-"}</p>
            </article>
            <article>
              <h4>Pending Reviews</h4>
              <p>{dashboard?.pendingReviews?.toLocaleString() ?? "-"}</p>
            </article>
          </section>
        {/if}

        {#if page === "users"}
          <section class="panel-block">
            <div class="row row-wrap">
              <input placeholder="Search username / TG ID" bind:value={userQ} />
              <select bind:value={userStatus}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="banned">Banned</option>
              </select>
              <button class="btn btn-primary" on:click={loadUsersAndLedger}>Filter</button>
            </div>

            <p class="muted">Total users: {usersTotal}</p>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Nation</th>
                    <th>KICK</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each users as u}
                    <tr>
                      <td>@{u.username ?? "unknown"}</td>
                      <td>{u.nationCode}</td>
                      <td>{u.kick.toLocaleString()}</td>
                      <td>{u.status}</td>
                      <td class="actions">
                        <button on:click={() => changeUserStatus(u.id, "active")}>Active</button>
                        <button on:click={() => changeUserStatus(u.id, "vip")}>VIP</button>
                        <button class="danger" on:click={() => changeUserStatus(u.id, "banned")}>Ban</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <div class="card-sub">
              <h4>KICK Grant / Adjust</h4>
              <div class="row row-wrap">
                <select bind:value={selectedUserId}>
                  {#each users as u}
                    <option value={u.id}>@{u.username ?? u.id} ({u.kick.toLocaleString()} KICK)</option>
                  {/each}
                </select>
                <input type="number" bind:value={kickDelta} />
                <input placeholder="Reason" bind:value={kickReason} />
                <button class="btn btn-primary" on:click={submitKickAdjust}>Submit</button>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Delta</th>
                    <th>Reason</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {#each ledger as item}
                    <tr>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                      <td>@{item.user.username ?? "unknown"}</td>
                      <td class:item-plus={item.delta > 0} class:item-minus={item.delta < 0}>{item.delta}</td>
                      <td>{item.reason}</td>
                      <td>{item.source}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>
        {/if}

        {#if page === "configs"}
          <section class="grid-two">
            <article class="panel-block">
              <h4>SPIN Config</h4>
              <textarea rows="14" bind:value={spinConfigText}></textarea>
              <button class="btn btn-primary" on:click={() => saveConfig("spin")}>Save SPIN</button>
            </article>
            <article class="panel-block">
              <h4>Penalty Config</h4>
              <textarea rows="14" bind:value={penaltyConfigText}></textarea>
              <button class="btn btn-primary" on:click={() => saveConfig("penalty")}>Save Penalty</button>
            </article>
          </section>
        {/if}

        {#if page === "announcements"}
          <section class="panel-block">
            <h4>Create Announcement</h4>
            <div class="row row-wrap">
              <input placeholder="Title" bind:value={annTitle} />
              <input placeholder="Target (all/vip/nation...)" bind:value={annTarget} />
            </div>
            <textarea rows="4" placeholder="Message" bind:value={annMessage}></textarea>
            <button class="btn btn-primary" on:click={submitAnnouncement}>Publish</button>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Title</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {#each announcements as ann}
                    <tr>
                      <td>{new Date(ann.createdAt).toLocaleString()}</td>
                      <td>{ann.title}</td>
                      <td>{ann.target}</td>
                      <td>{ann.publishedAt ? "Published" : "Draft"}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>
        {/if}

        {#if page === "pique"}
          <section class="panel-block">
            <h4>Conversation Logs ({piqueTotal})</h4>
            <div class="row row-wrap">
              <input placeholder="Username" bind:value={piqueUsername} />
              <input placeholder="Keyword" bind:value={piqueKeyword} />
              <input placeholder="Sentiment (low/medium/high)" bind:value={piqueSentiment} />
              <button class="btn btn-primary" on:click={loadPique}>Filter</button>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Prompt</th>
                    <th>Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {#each piqueLogs as row}
                    <tr>
                      <td>{new Date(row.createdAt).toLocaleString()}</td>
                      <td>@{row.username ?? row.telegramId ?? "unknown"}</td>
                      <td>{row.prompt}</td>
                      <td>{row.sentimentFlag ?? "neutral"}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>
        {/if}

        {#if page === "board"}
          <section class="panel-block">
            <h4>Board Members</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Telegram ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>TOTP</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {#each boardMembers as m}
                    <tr>
                      <td>{m.telegramId}</td>
                      <td>@{m.username}</td>
                      <td>{m.role}</td>
                      <td>{m.requiresTotp ? "Yes" : "No"}</td>
                      <td>{m.isActive ? "Yes" : "No"}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if $session.role === "owner"}
              <div class="card-sub">
                <h4>Add / Update Member</h4>
                <div class="row row-wrap">
                  <input placeholder="Telegram ID" bind:value={boardForm.telegramId} />
                  <input placeholder="Username" bind:value={boardForm.username} />
                  <input placeholder="Display name" bind:value={boardForm.displayName} />
                  <select bind:value={boardForm.role}>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                    <option value="moderator">moderator</option>
                    <option value="support">support</option>
                    <option value="analyst">analyst</option>
                  </select>
                  <input placeholder="TOTP secret (optional)" bind:value={boardForm.totpSecret} />
                </div>
                <div class="row">
                  <label class="inline"><input type="checkbox" bind:checked={boardForm.requiresTotp} /> requires TOTP</label>
                  <label class="inline"><input type="checkbox" bind:checked={boardForm.isActive} /> active</label>
                </div>
                <button class="btn btn-primary" on:click={submitBoardMember}>Save Member</button>
              </div>
            {/if}
          </section>
        {/if}
      </section>
    </section>
  {/if}

  {#if error}
    <p class="error-box">{error}</p>
  {/if}

  {#if toast}
    <div class="toast">{toast}</div>
  {/if}
</main>
