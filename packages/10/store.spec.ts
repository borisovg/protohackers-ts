import { deepStrictEqual, strictEqual } from 'node:assert';
import { Store } from './store';

const store = new Store();

strictEqual(store.set('/test1.txt', Buffer.from('foo')), 'r1');
strictEqual(store.set('/test2.txt', Buffer.from('bar')), 'r1');
strictEqual(store.set('/foo/bar/test3.txt', Buffer.from('baz')), 'r1');

strictEqual(store.get('/test1.txt')?.toString(), 'foo');
strictEqual(store.get('/test2.txt')?.toString(), 'bar');
strictEqual(store.get('/foo/bar/test3.txt')?.toString(), 'baz');

strictEqual(store.set('/foo/bar/test3.txt', Buffer.from('baz2')), 'r2');
strictEqual(store.get('/foo/bar/test3.txt')?.toString(), 'baz2');
strictEqual(store.get('/foo/bar/test3.txt', 'r1')?.toString(), 'baz');

deepStrictEqual(store.list('/'), [
  ['foo/', 'DIR'],
  ['test1.txt', 'r1'],
  ['test2.txt', 'r1'],
]);

deepStrictEqual(store.list('/foo/bar/'), [['test3.txt', 'r2']]);

store.set('/a/LICENSE', Buffer.from(''));
store.set('/a/Makefile', Buffer.from(''));
store.set('/a/TODO', Buffer.from(''));
store.set('/a/kilo.c', Buffer.from(''));
store.set('/a/README.md', Buffer.from(''));

deepStrictEqual(store.list('/a'), [
  ['LICENSE', 'r1'],
  ['Makefile', 'r1'],
  ['README.md', 'r1'],
  ['TODO', 'r1'],
  ['kilo.c', 'r1'],
]);
