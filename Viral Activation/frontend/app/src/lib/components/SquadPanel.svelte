<script lang="ts">
  import { onMount } from "svelte";
  import { sessionStore } from "../stores/session.store";
  import { fetchMySquad, createSquad, joinSquad, fetchSquadLeaderboard, type SquadDetailInfo, type SquadInfo } from "../modules/squad/api";

  let mySquad: SquadDetailInfo | null = null;
  let topSquads: SquadInfo[] = [];
  let mode: "loading" | "no_squad" | "my_squad" | "leaderboard" = "loading";
  let squadNameInput = "";
  let joinIdInput = "";
  let error = "";
  let creating = false;
  let joining = false;

  async function loadData() {
    const sid = $sessionStore.sessionId;
    if (!sid) return;
    mode = "loading";
    try {
      const [myRes, lbRes] = await Promise.all([
        fetchMySquad(sid),
        fetchSquadLeaderboard()
      ]);
      mySquad = myRes.squad;
      topSquads = lbRes.squads ?? [];
      mode = mySquad ? "my_squad" : "no_squad";
    } catch {
      mode = "no_squad";
    }
  }

  async function handleCreate() {
    const sid = $sessionStore.sessionId;
    if (!sid || !squadNameInput.trim()) return;
    creating = true;
    error = "";
    try {
      const res = await createSquad(sid, squadNameInput.trim());
      if (!res.ok) { error = res.reason ?? "Failed"; return; }
      await loadData();
    } catch (e) {
      error = e instanceof Error ? e.message : "Error";
    } finally {
      creating = false;
    }
  }

  async function handleJoin() {
    const sid = $sessionStore.sessionId;
    if (!sid || !joinIdInput.trim()) return;
    joining = true;
    error = "";
    try {
      const res = await joinSquad(sid, joinIdInput.trim());
      if (!res.ok) { error = res.reason ?? "Failed"; return; }
      await loadData();
    } catch (e) {
      error = e instanceof Error ? e.message : "Error";
    } finally {
      joining = false;
    }
  }

  onMount(loadData);
</script>

<div class="squad-panel">
  {#if mode === "loading"}
    <div class="squad-loading">Loading squad...</div>
  {:else if mode === "my_squad" && mySquad}
    <div class="squad-header">
      <div class="squad-name">{mySquad.name}</div>
      <div class="squad-meta">{mySquad.nationCode} | {mySquad.members.length}/5 members | {mySquad.totalKick.toLocaleString("en-US")} KICK</div>
    </div>
    <div class="squad-members">
      {#each mySquad.members as member}
        <div class="squad-member">
          <span class="squad-member-name">{member.username ?? "Anonymous"}</span>
          <span class="squad-member-kick">{member.kick.toLocaleString("en-US")} KICK</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="squad-create">
      <div class="squad-create-title">Create or Join a Squad</div>
      <div class="squad-create-desc">Team up with 5 players for 1.2x KICK multiplier!</div>
      <div class="squad-form">
        <input type="text" bind:value={squadNameInput} placeholder="Squad name" maxlength="50" class="squad-input" />
        <button type="button" on:click={handleCreate} disabled={creating || !squadNameInput.trim()} class="btn b-g">
          {creating ? "Creating..." : "Create Squad"}
        </button>
      </div>
      <div class="squad-or">— or join existing —</div>
      <div class="squad-form">
        <input type="text" bind:value={joinIdInput} placeholder="Squad ID" class="squad-input" />
        <button type="button" on:click={handleJoin} disabled={joining || !joinIdInput.trim()} class="btn b-b">
          {joining ? "Joining..." : "Join Squad"}
        </button>
      </div>
      {#if error}
        <div class="squad-error">{error}</div>
      {/if}
    </div>

    {#if topSquads.length > 0}
      <div class="squad-lb">
        <div class="squad-lb-title">Top Squads</div>
        {#each topSquads.slice(0, 10) as squad, i}
          <div class="squad-lb-row">
            <span class="squad-lb-rank">#{i + 1}</span>
            <span class="squad-lb-name">{squad.name}</span>
            <span class="squad-lb-kick">{squad.totalKick.toLocaleString("en-US")}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .squad-panel { display: flex; flex-direction: column; gap: 12px; }
  .squad-loading, .squad-error { font-size: 0.82rem; text-align: center; padding: 12px 0; }
  .squad-error { color: #ef5350; }
  .squad-header { display: flex; flex-direction: column; gap: 4px; }
  .squad-name { font-size: 1rem; font-weight: 700; color: #f5c542; }
  .squad-meta { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
  .squad-members { display: flex; flex-direction: column; gap: 6px; }
  .squad-member { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .squad-member-name { color: #fff; }
  .squad-member-kick { color: #f5c542; font-weight: 600; }
  .squad-create { display: flex; flex-direction: column; gap: 8px; }
  .squad-create-title { font-size: 0.9rem; font-weight: 600; color: #fff; }
  .squad-create-desc { font-size: 0.78rem; color: rgba(255,255,255,0.6); }
  .squad-form { display: flex; gap: 8px; }
  .squad-input {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: #fff;
    font-size: 0.82rem;
  }
  .squad-input::placeholder { color: rgba(255,255,255,0.35); }
  .squad-or { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-align: center; }
  .squad-lb { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .squad-lb-title { font-size: 0.85rem; font-weight: 600; color: #f5c542; }
  .squad-lb-row { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; padding: 3px 0; }
  .squad-lb-rank { color: rgba(255,255,255,0.5); width: 24px; }
  .squad-lb-name { flex: 1; color: #fff; }
  .squad-lb-kick { color: #f5c542; font-weight: 600; }
</style>
