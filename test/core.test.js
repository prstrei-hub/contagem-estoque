// Testes básicos para core.js (rodar com: node test/core.test.js)
const Core = require('../core.js');
const assert = require('assert');

function testParseNum() {
  assert.strictEqual(Core.parseNum('1,5'), 1.5);
  assert.strictEqual(Core.parseNum('1.234,56'), 1234.56);
  assert.strictEqual(Core.parseNum('10'), 10);
  assert.ok(isNaN(Core.parseNum('')));
  console.log('parseNum OK');
}

function testParseClipp() {
  const json = JSON.stringify({ list_name: 'teste', items: [
    { codigo: '123', descricao: 'Item A', quantidade: '10,5', preco: 5.99 },
    { codigo: '123', descricao: 'dup', quantidade: 1 },
    { codigo: '', descricao: 'vazio' }
  ]});
  const s = Core.parseClipp(json);
  assert.strictEqual(s.list_name, 'teste');
  assert.strictEqual(s.items.length, 1);
  assert.strictEqual(s.items[0].estoque, 10.5);
  console.log('parseClipp OK');
}

function testAddCount() {
  const state = { items: [{ codigo: 'A', descricao: 'A', estoque: 5, contado: null }] };
  Core.addCount(state, 'A', '2,5', 'add');
  assert.strictEqual(state.items[0].contado, 2.5);
  Core.addCount(state, 'B', 1, 'set', 'Novo');
  assert.strictEqual(state.items.length, 2);
  assert.strictEqual(state.items[1].manual, true);
  Core.addCount(state, 'B', 0, 'set', 'Editado');
  assert.strictEqual(state.items[1].descricao, 'Editado');
  console.log('addCount OK');
}

function testBuildExport() {
  const state = { list_name: 'original', items: [
    { codigo: '1', descricao: 'Um', contado: 3, preco: 1 },
    { codigo: '2', descricao: 'Dois', contado: null, preco: 0 }
  ]};
  const exp = Core.buildExport(state, { includeUncounted: false });
  assert.strictEqual(exp.items.length, 1);
  assert.strictEqual(exp.list_name, 'original');
  const exp2 = Core.buildExport(state, { includeUncounted: true });
  assert.strictEqual(exp2.items.length, 2);
  assert.strictEqual(exp2.items[1].quantidade, 0);
  console.log('buildExport OK');
}

testParseNum();
testParseClipp();
testAddCount();
testBuildExport();
console.log('Todos os testes passaram.');
