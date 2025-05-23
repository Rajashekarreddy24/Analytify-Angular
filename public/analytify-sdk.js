(function (global) {
  // Default embed base URL, relative to this script's location
  var EMBED_BASE = (global.ANALYTIFY_BASE_URL ||
    (function () {
      var script = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
      var src = script && script.src;
      if (!src) return '';
      return src.substr(0, src.lastIndexOf('/')) + '/';
    })()
  ) + 'embed/';

  // Internal configuration and token cache
  var _config = {
    clientId: '',
    clientSecret: '',
    apiBaseUrl: '',
    tokenEndpoint: 'https://api.insightapps.ai/v1'
  };
  var _token = null;
  var _tokenExpiry = 0;

  /**
   * Initialize the SDK with client credentials & API details.
   * @param {{clientId: string, clientSecret?: string, apiBaseUrl: string, tokenEndpoint?: string}} config
   */
  function init(config) {
    console.log("init");
    if (!config || !config.clientId || !config.apiBaseUrl) {
      throw new Error('AnalytifySDK.init: clientId and apiBaseUrl are required');
    }
    _config.clientId = config.clientId;
    _config.clientSecret = config.clientSecret || '';
    _config.apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    if (config.tokenEndpoint) {
      _config.tokenEndpoint = config.tokenEndpoint;
    }
    return global.AnalytifySDK;
  }

  /**
   * Fetch or reuse an access token from your backend.
   * Caches for expiresIn-60s.
   * @returns {Promise<string>}
   */
  function fetchToken(dashboardToken) {
    console.log("fetchToken");
    if (_token && Date.now() < _tokenExpiry - 60000) {
      return Promise.resolve(_token);
    }
    var endpoint = _config.tokenEndpoint + '/app_access_token/'

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: _config.clientId,
        client_secret: _config.clientSecret
      })
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Token fetch failed: ' + res.status + ' ' + res.statusText);
        }
        return res.json();
      })
      .then(function (data) {
        _token = data.data.access_token;
        return _token;
      });
  }

  /**
   * Embed a dashboard, automatically handling access tokens.
   * @param {{dashboardID: string|number, container: string|HTMLElement, filters?: object, width?: string, height?: string}} options
   * @returns {Promise<HTMLIFrameElement>|void}
   */
  function loadDashboard(options) {
    console.log("loadDashboard");
    if (!_config.clientId || !_config.apiBaseUrl) {
      console.error('AnalytifySDK.loadDashboard: SDK not initialized; call init() first');
      return;
    }
    if (!options || !options.dashboardToken || !options.container) {
      console.error('AnalytifySDK.loadDashboard: Missing required options: dashboardToken, container');
      return;
    }
    var containerEl = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    if (!containerEl) {
      console.error('AnalytifySDK.loadDashboard: Container not found', options.container);
      return;
    }
    var params = [];

    return fetchToken(options.dashboardToken)
      .then(function (token) {
        var src =  _config.apiBaseUrl+'/embed/dashboard/' + encodeURIComponent(options.dashboardToken)+'/'+encodeURIComponent(token) +'/'+ encodeURIComponent(_config.clientId);
        if (options.filters && typeof options.filters === 'object') {
          params.unshift('filters=' + encodeURIComponent(JSON.stringify(options.filters)));
        }
        src += '?' + params.join('&');
        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.style.border = 'none';
        iframe.style.width = options.width || '100%';
        iframe.style.height = options.height || '100%';
        containerEl.innerHTML = '';
        containerEl.appendChild(iframe);
        // return iframe;
      })
      .catch(function (err) {
        console.error('AnalytifySDK.loadDashboard error:', err);
      });
  }

   /**
   * Embed a dashboard, automatically handling access tokens.
   * @param {{sheetId: string|number, container: string|HTMLElement, filters?: object, width?: string, height?: string}} options
   * @returns {Promise<HTMLIFrameElement>|void}
   */
    function embedSheet(options) {
      console.log("loadSheet");
      if (!_config.clientId || !_config.apiBaseUrl) {
        console.error('AnalytifySDK.embedSheet: SDK not initialized; call init() first');
        return;
      }
      if (!options || !options.sheetToken || !options.container) {
        console.error('AnalytifySDK.embedSheet: Missing required options: sheetToken, container');
        return;
      }
      var containerEl = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;
      if (!containerEl) {
        console.error('AnalytifySDK.embedSheet: Container not found', options.container);
        return;
      }
      var params = [];
  
      return fetchToken(options.sheetToken)
        .then(function (token) {
          var src =  _config.apiBaseUrl+'/embed/sheet/' + encodeURIComponent(options.sheetToken)+'/'+encodeURIComponent(token) +'/'+ encodeURIComponent(_config.clientId);
          if (options.filters && typeof options.filters === 'object') {
            params.unshift('filters=' + encodeURIComponent(JSON.stringify(options.filters)));
          }
          src += '?' + params.join('&');
          var iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.style.border = 'none';
          iframe.style.width = options.width || '100%';
          iframe.style.height = options.height || '100%';
          containerEl.innerHTML = '';
          containerEl.appendChild(iframe);
          // return iframe;
        })
        .catch(function (err) {
          console.error('AnalytifySDK.sheetload error:', err);
        });
    }

  // Expose the two entry points
  global.AnalytifySDK = {
    init: init,
    loadDashboard: loadDashboard,
    embedSheet: embedSheet
  };
})(typeof window !== 'undefined' ? window : this);