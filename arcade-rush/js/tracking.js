/** Optionales externes Tracking — lädt nur wenn in site-config.js konfiguriert. */
(function () {
  const cfg = window.SITE_CONFIG || {};

  if (cfg.ga4) {
    const id = cfg.ga4;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id, { anonymize_ip: true });
  }

  if (cfg.goatCounter) {
    const s = document.createElement('script');
    s.async = true;
    s.dataset.goatcounter = cfg.goatCounter;
    s.src = 'https://gc.zgo.at/count.js';
    document.head.appendChild(s);
  }
})();