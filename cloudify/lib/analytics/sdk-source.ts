/**
 * Analytics SDK Source
 * This generates the client-side SDK that gets injected into deployed sites
 */

/**
 * Generate the analytics SDK script for a project
 */
export function generateAnalyticsScript(projectId: string, options?: {
  collectWebVitals?: boolean;
  collectCustomEvents?: boolean;
  sampleRate?: number;
}): string {
  const config = {
    projectId,
    collectWebVitals: options?.collectWebVitals ?? true,
    collectCustomEvents: options?.collectCustomEvents ?? true,
    sampleRate: options?.sampleRate ?? 1.0,
  };

  return `
(function() {
  'use strict';

  var config = ${JSON.stringify(config)};
  var endpoint = '${process.env.NEXT_PUBLIC_APP_URL || 'https://cloudify.tranthachnguyen.com'}/api/analytics/ingest';
  var queue = [];
  var isProcessing = false;
  var sessionId = generateId();
  var visitorId = getOrCreateVisitorId();

  // Generate unique ID
  function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, function() {
      return Math.floor(Math.random() * 16).toString(16);
    });
  }

  // Get or create persistent visitor ID
  function getOrCreateVisitorId() {
    var key = 'cloudify_vid';
    var id = localStorage.getItem(key);
    if (!id) {
      id = generateId();
      try {
        localStorage.setItem(key, id);
      } catch (e) {}
    }
    return id;
  }

  // Get device type
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Get browser name
  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  }

  // Get OS name
  function getOS() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Windows') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    return 'Unknown';
  }

  // Sample check
  function shouldSample() {
    return Math.random() < config.sampleRate;
  }

  // Track event
  function track(type, data) {
    if (!shouldSample()) return;

    var event = {
      projectId: config.projectId,
      type: type,
      path: window.location.pathname,
      referrer: document.referrer || null,
      device: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      sessionId: sessionId,
      visitorId: visitorId,
      timestamp: new Date().toISOString(),
      data: data || {}
    };

    queue.push(event);
    processQueue();
  }

  // Process event queue
  function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    var events = queue.splice(0, 10);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: events }),
      keepalive: true
    }).catch(function(err) {
      // Re-queue failed events
      queue = events.concat(queue);
      console.debug('[Cloudify Analytics] Error:', err.message);
    }).finally(function() {
      isProcessing = false;
      if (queue.length > 0) {
        setTimeout(processQueue, 1000);
      }
    });
  }

  // Track pageview
  function trackPageview() {
    track('pageview', {
      title: document.title,
      url: window.location.href
    });
  }

  // Track custom event
  function trackEvent(eventName, eventData) {
    if (!config.collectCustomEvents) return;
    track('event', {
      eventName: eventName,
      eventData: eventData || {}
    });
  }

  // Track Web Vitals
  function trackWebVitals() {
    if (!config.collectWebVitals) return;
    if (!('PerformanceObserver' in window)) return;

    var vitals = {};

    // LCP - Largest Contentful Paint
    try {
      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        var lastEntry = entries[entries.length - 1];
        vitals.LCP = Math.round(lastEntry.startTime);
        sendVitals();
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    // FID - First Input Delay
    try {
      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        entries.forEach(function(entry) {
          vitals.FID = Math.round(entry.processingStart - entry.startTime);
          sendVitals();
        });
      }).observe({ type: 'first-input', buffered: true });
    } catch (e) {}

    // CLS - Cumulative Layout Shift
    try {
      var clsValue = 0;
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.CLS = Math.round(clsValue * 1000) / 1000;
        sendVitals();
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}

    // FCP - First Contentful Paint
    try {
      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        entries.forEach(function(entry) {
          if (entry.name === 'first-contentful-paint') {
            vitals.FCP = Math.round(entry.startTime);
            sendVitals();
          }
        });
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {}

    // TTFB - Time to First Byte
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        vitals.TTFB = Math.round(nav.responseStart);
        sendVitals();
      }
    } catch (e) {}

    var vitalsSent = false;
    function sendVitals() {
      if (vitalsSent) return;
      // Wait for at least LCP before sending
      if (!vitals.LCP) return;

      vitalsSent = true;
      setTimeout(function() {
        track('vitals', vitals);
      }, 100);
    }

    // Fallback: send vitals after 10 seconds
    setTimeout(function() {
      if (!vitalsSent && Object.keys(vitals).length > 0) {
        vitalsSent = true;
        track('vitals', vitals);
      }
    }, 10000);
  }

  // Handle SPA navigation
  function handleNavigation() {
    var lastPath = window.location.pathname;

    // History API
    var pushState = history.pushState;
    history.pushState = function() {
      pushState.apply(history, arguments);
      checkNavigation();
    };

    var replaceState = history.replaceState;
    history.replaceState = function() {
      replaceState.apply(history, arguments);
      checkNavigation();
    };

    window.addEventListener('popstate', checkNavigation);

    function checkNavigation() {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        trackPageview();
      }
    }
  }

  // Flush queue on page unload
  function handleUnload() {
    if (queue.length === 0) return;

    var events = queue.splice(0, queue.length);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify({ events: events }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: events }),
        keepalive: true
      });
    }
  }

  // Initialize
  function init() {
    trackPageview();
    trackWebVitals();
    handleNavigation();

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    window.addEventListener('pagehide', handleUnload);
  }

  // Expose API
  window.cloudify = {
    track: trackEvent,
    identify: function(userId, traits) {
      track('identify', { userId: userId, traits: traits || {} });
    }
  };

  // Start tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`.trim();
}

/**
 * Generate a minified version of the SDK for production
 */
export function generateMinifiedAnalyticsScript(projectId: string): string {
  // In production, this would use a proper minifier
  // For now, we just strip comments and whitespace
  const script = generateAnalyticsScript(projectId);
  return script
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}(),:;])\s*/g, '$1')
    .trim();
}

/**
 * Generate the script tag to include in HTML
 */
export function generateScriptTag(projectId: string, async: boolean = true): string {
  const attrs = async ? 'async defer' : '';
  return `<script ${attrs} src="${process.env.NEXT_PUBLIC_APP_URL || 'https://cloudify.tranthachnguyen.com'}/api/analytics/script/${projectId}"></script>`;
}

/**
 * Web Vitals rating thresholds
 */
export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
};

/**
 * Get rating for a Web Vital metric
 */
export function getVitalRating(
  metric: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[metric];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}
