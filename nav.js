// Clean section URLs: castiqq.com/desktop and castiqq.com/docs/usb instead of /#desktop and /docs#usb.
// GitHub Pages has no rewrites, so a direct visit to /desktop lands on 404.html, which sends the
// visitor to /?go=desktop. This script then scrolls to the section and puts /desktop back in the
// address bar. Clicks on section links scroll without reloading or adding a #.
// Old links with a # still work and are rewritten to the clean form.
(() => {
  const HOME_SECTIONS = ['features', 'desktop', 'how', 'screens', 'pricing', 'faq', 'download'];

  // The page a URL belongs to ('/' or '/docs') and the section on it, or null for anything else.
  const targetOf = url => {
    if (url.origin !== location.origin) return null;
    const path = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const go = url.searchParams.get('go') || '';
    const hash = decodeURIComponent(url.hash.slice(1));
    if (path === '/' || path === '/index') return { page: '/', id: go || hash };
    if (HOME_SECTIONS.includes(path.slice(1))) return { page: '/', id: path.slice(1) };
    if (path === '/docs') return { page: '/docs', id: go || hash };
    const m = path.match(/^\/docs\/([\w-]+)$/);
    if (m) return { page: '/docs', id: m[1] };
    return null;
  };

  const cleanUrl = ({ page, id }) =>
    page === '/' ? (id && id !== 'home' ? '/' + id : '/') : (id ? '/docs/' + id : '/docs');

  const here = targetOf(new URL(location.href));

  // Links to a section on another page go straight to it, skipping the 404.html hop.
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self')) return;
    const t = targetOf(new URL(a.href));
    if (!t || !t.id || (here && t.page === here.page)) return;
    e.preventDefault();
    location.href = t.page + '?go=' + encodeURIComponent(t.id);
  });

  if (!here) return;
  const section = id => (id && id !== 'home' ? document.getElementById(id) : null);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const scrollTo = (id, smooth) => {
    const el = section(id);
    const behavior = smooth && !reduced.matches ? 'smooth' : 'instant';
    if (el) el.scrollIntoView({ behavior });
    else window.scrollTo({ top: 0, behavior });
  };

  // Show the clean URL for wherever the visitor arrived.
  if (here.id && !section(here.id) && here.id !== 'home') here.id = '';
  const clean = cleanUrl(here);
  if (location.pathname + location.search + location.hash !== clean) history.replaceState(null, '', clean);

  // A clean path doesn't scroll by itself, so do it now and once more after images load.
  if (here.id && here.id !== 'home') {
    history.scrollRestoration = 'manual';
    scrollTo(here.id, false);
    let moved = false;
    const stop = () => { moved = true; };
    ['wheel', 'touchmove', 'keydown'].forEach(t => window.addEventListener(t, stop, { once: true, passive: true }));
    window.addEventListener('load', () => { if (!moved) scrollTo(here.id, false); });
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self')) return;
    // Store buttons point to # until the real listings exist; keep them from adding # to the URL.
    if (a.getAttribute('href') === '#') { e.preventDefault(); return; }
    const t = targetOf(new URL(a.href));
    if (!t || t.page !== here.page || (t.id && t.id !== 'home' && !section(t.id))) return;
    e.preventDefault();
    const url = cleanUrl(t);
    if (location.pathname !== url) history.pushState(null, '', url);
    scrollTo(t.id, true);
  });

  window.addEventListener('popstate', () => {
    const t = targetOf(new URL(location.href));
    if (t && t.page === here.page) scrollTo(t.id, true);
  });
})();
