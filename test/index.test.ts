import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get, utmKeeper } from '../src/index.js';
let stop: (() => void) | undefined;
beforeEach(() => { localStorage.clear(); history.replaceState(null, '', '/'); document.body.innerHTML = '<form></form><form></form>'; });
afterEach(() => { stop?.(); stop = undefined; vi.restoreAllMocks(); });
const start = (search = '', options = {}) => { history.replaceState(null, '', '/' + search); stop = utmKeeper(options); };
const fields = (form = document.forms[0]) => Object.fromEntries(new FormData(form));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
describe('utmKeeper', () => {
  it.each(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'yclid', 'fbclid'])('persists and decorates %s', name => {
    start(`?${name}=hello%20world&unrelated=secret`);
    expect(get()).toEqual({ [name]: 'hello world' });
    for (const form of document.forms) {
      expect(fields(form)).toEqual(get()); expect(form.querySelector('input')?.type).toBe('hidden');
    }
  });
  it('survives an untagged page and fresh initialization', () => {
    start('?utm_source=search&gclid=example'); stop?.(); document.body.innerHTML = '<form></form>'; start();
    expect(fields()).toEqual({ utm_source: 'search', gclid: 'example' });
  });
  it('replaces the entire set on a new tagged arrival', () => {
    start('?utm_source=old&gclid=old'); stop?.(); document.body.innerHTML = '<form></form>';
    start('?utm_source=new&fbclid=new'); expect(fields()).toEqual({ utm_source: 'new', fbclid: 'new' });
  });
  it('ignores empty tracking values', () => {
    start('?utm_source=search'); stop?.(); start('?utm_source='); expect(get()).toEqual({ utm_source: 'search' });
  });
  it('handles malformed and untrusted storage', () => {
    localStorage.setItem('utm-keeper', '{'); expect(get()).toEqual({});
    localStorage.setItem('utm-keeper', '{"utm_source":42,"gclid":"ok","password":"secret"}');
    expect(get()).toEqual({ gclid: 'ok' });
  });
  it('returns a copy', () => {
    start('?utm_source=search'); const tags = get(); tags.utm_source = 'changed'; expect(get().utm_source).toBe('search');
  });
  it('supports a custom storage key', () => {
    start('?yclid=sample', { storageKey: 'custom' }); expect(get({ storageKey: 'custom' })).toEqual({ yclid: 'sample' }); expect(get()).toEqual({});
  });
  it('continues in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked'); });
    start('?utm_source=search', { storageKey: 'blocked' });
    expect(get({ storageKey: 'blocked' })).toEqual({ utm_source: 'search' }); expect(fields()).toEqual({ utm_source: 'search' });
  });
  it('keeps current tags when writes fail but reads work', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota'); });
    start('?utm_source=current', { storageKey: 'quota' });
    expect(get({ storageKey: 'quota' })).toEqual({ utm_source: 'current' });
    expect(fields()).toEqual({ utm_source: 'current' });
  });
  it('decorates new forms without duplicate inputs', async () => {
    start('?utm_source=search'); document.body.insertAdjacentHTML('beforeend', '<form></form>'); await tick();
    expect(fields(document.forms[2])).toEqual({ utm_source: 'search' }); expect(document.querySelectorAll('input')).toHaveLength(3);
  });
  it('decorates synchronously on submit', () => {
    start('?utm_source=search'); const form = document.createElement('form'); document.body.append(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); expect(fields(form)).toEqual({ utm_source: 'search' });
  });
  it('updates hidden fields and preserves visible inputs', () => {
    document.body.innerHTML = '<form><input type="hidden" name="utm_source" value="old"></form><form><input name="utm_source" value="user"></form>';
    start('?utm_source=new'); expect(fields()).toEqual({ utm_source: 'new' }); expect(fields(document.forms[1])).toEqual({ utm_source: 'user' });
  });
  it('cleanup stops observers and submit listeners', async () => {
    start('?utm_source=search'); stop?.(); stop?.(); document.body.innerHTML = '<form></form>'; await tick();
    document.forms[0].dispatchEvent(new Event('submit', { bubbles: true })); expect(fields()).toEqual({});
  });
});
