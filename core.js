// Lógica pura (testável em Node)
(function (root) {
  function parseNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    if (v == null) return NaN;
    var s = String(v).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function round3(n) { return Math.round(n * 1000) / 1000; }
  function parseClipp(text) {
    if (typeof text === 'string') text = text.replace(/^\uFEFF/, '');
    var data = typeof text === 'string' ? JSON.parse(text) : text;
    if (!data || !Array.isArray(data.items)) throw new Error('Arquivo não está no formato do Clipp (falta "items").');
    var items = [], seen = {};
    data.items.forEach(function (it) {
      var codigo = String(it.codigo == null ? '' : it.codigo).trim();
      if (!codigo || seen[codigo]) return;
      seen[codigo] = 1;
      var q = parseNum(it.quantidade);
      items.push({ codigo: codigo, descricao: String(it.descricao || ''), preco: isNaN(parseNum(it.preco)) ? 0 : parseNum(it.preco),
        estoque: isNaN(q) ? null : q, contado: null, manual: false });
    });
    return { list_name: String(data.list_name || 'conferencia'), items: items };
  }
  function find(state, code) {
    code = String(code).trim();
    for (var i = 0; i < state.items.length; i++) if (state.items[i].codigo === code) return state.items[i];
    return null;
  }
  function addCount(state, code, qty, mode, descricao) {
    code = String(code).trim();
    if (!code) throw new Error('Código vazio');
    var q = parseNum(qty);
    if (isNaN(q) || q < 0) throw new Error('Quantidade inválida');
    var it = find(state, code);
    if (!it) { it = { codigo: code, descricao: descricao || '(item não cadastrado na lista)', preco: 0, estoque: null, contado: null, manual: true }; state.items.push(it); }
    else if (descricao && it.manual) it.descricao = descricao;
    it.contado = round3(mode === 'set' ? q : (it.contado || 0) + q);
    it.ts = Date.now();
    return it;
  }
  function diff(it) { return (it.contado == null || it.estoque == null) ? null : round3(it.contado - it.estoque); }
  function search(state, term) {
    term = String(term || '').trim().toLowerCase();
    if (!term) return state.items.slice();
    return state.items.filter(function (i) { return i.codigo.toLowerCase().indexOf(term) >= 0 || i.descricao.toLowerCase().indexOf(term) >= 0; });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fileName(d) {
    d = d || new Date();
    return 'conferencia_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.json';
  }
  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function buildExport(state, opts) {
    opts = opts || {};
    var name = opts.fileName || fileName();
    var items = [];
    state.items.forEach(function (it) {
      if (it.contado == null && !opts.includeUncounted) return;
      items.push({ codigo: it.codigo, descricao: it.descricao, quantidade: it.contado == null ? 0 : it.contado, preco: it.preco || 0, conferred: true });
    });
    return { id: opts.id || uuid(), list_name: opts.listName || (state && state.list_name) || name, items: items };
  }
  var api = { parseNum: parseNum, parseClipp: parseClipp, addCount: addCount, find: find, diff: diff, search: search, buildExport: buildExport, fileName: fileName };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Core = api;
})(typeof self !== 'undefined' ? self : this);
