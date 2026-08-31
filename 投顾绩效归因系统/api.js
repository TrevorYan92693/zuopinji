/* 静态化拦截器：把绩效归因系统前端的 /api/* fetch 映射到本地 data/*.json
   用法：在各 HTML <head> 中 <script src="api.js"></script>（置于业务脚本之前） */
(function () {
  var DATA_BASE = 'data/';            // 相对当前页面所在目录
  var apiUrlToLocal = function (apiPath) {
    // 聚合接口
    if (apiPath === '/api/overview') return DATA_BASE + 'overview.json';
    if (apiPath === '/api/styles') return DATA_BASE + 'styles.json';
    if (apiPath === '/api/portfolios') return DATA_BASE + 'portfolios.json';

    // 组合级接口：/api/portfolio/{id}/{kind} 与 /api/portfolio/{id}/brinson?benchmark=xxx
    var m = apiPath.match(/^\/api\/portfolio\/([^\/]+)\/([a-z_]+)(?:\?benchmark=([a-z0-9]+))?$/i);
    if (m) {
      var pid = decodeURIComponent(m[1]);
      var kind = m[2].toLowerCase();
      var bench = (m[3] || 'hs300').toLowerCase();
      if (kind === 'brinson') return DATA_BASE + pid + '_brinson_' + bench + '.json';
      return DATA_BASE + pid + '_' + kind + '.json';
    }
    return null;
  };

  var orig = window.fetch;
  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var local = null;
    if (url.indexOf('/api/') === 0) {
      local = apiUrlToLocal(url);
    } else if (url.indexOf('api/') === 0) { // 兜底
      local = apiUrlToLocal('/' + url);
    }
    if (local) {
      // 转发到相对 JSON 文件（同步 local path 保持返回 Promise/json 兼容）
      return orig(local.split('?')[0], init);
    }
    return orig.apply(this, arguments);
  };
})();