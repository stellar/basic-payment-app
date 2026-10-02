<script>
  import { page } from '$app/stores';
</script>

<aside class="sidebar">
  <nav>
    <a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a>
    <a href="/payments" class:active={$page.url.pathname === '/payments'}>Payments</a>
    <a href="/contracts" class:active={$page.url.pathname === '/contracts'}>Smart Contracts</a>
  </nav>
</aside>

<style>
  .sidebar {
    width: 220px;
    padding: 1rem;
    border-right: 1px solid #eee;
  }
  nav a {
    display: block;
    padding: 0.5rem 0;
    text-decoration: none;
    color: #333;
  }
  nav a.active {
    font-weight: 600;
    color: #0066ff;
  }
</style>
