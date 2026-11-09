<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { ThemeToggle } from '@/features/theme-toggle';
</script>

<template>
  <div class="shell">
    <a class="shell__skip" href="#main">Skip to content</a>
    <header class="shell__header">
      <div class="shell__bar">
        <RouterLink to="/" class="shell__brand" aria-label="pixelproof, all snapshots">
          <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false">
            <rect width="32" height="32" rx="7" fill="var(--color-accent)" />
            <rect x="6" y="6" width="9" height="20" rx="2" fill="var(--color-on-accent)" />
            <rect x="17" y="6" width="9" height="20" rx="2" fill="var(--color-on-accent)" opacity=".55" />
            <rect x="17" y="13" width="9" height="5" fill="var(--color-diff)" />
          </svg>
          <span>pixelproof</span>
        </RouterLink>
        <span class="shell__tag">visual review</span>
        <div class="shell__end"><ThemeToggle /></div>
      </div>
    </header>
    <main id="main" class="shell__main" tabindex="-1">
      <slot />
    </main>
    <footer class="shell__footer">Review decisions stay in this browser until you export them.</footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.shell__skip {
  position: absolute;
  left: var(--space-3);
  top: -100px;
  z-index: 10;
  padding: var(--space-2) var(--space-3);
  background: var(--color-accent);
  color: var(--color-on-accent);
  border-radius: var(--radius-sm);
}
.shell__skip:focus {
  top: var(--space-3);
}
.shell__header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.shell__bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
}
.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.shell__tag {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.shell__end {
  margin-left: auto;
}
.shell__main {
  flex: 1;
  min-height: 100vh;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-7);
}
.shell__main:focus {
  outline: none;
}
.shell__footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}
</style>
