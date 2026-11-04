export interface Options { storageKey?: string }
export type Tags = Partial<Record<typeof keys[number], string>>;
const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'yclid', 'fbclid'] as const;
const fallback = new Map<string, Tags>();
const keyOf = ({ storageKey = 'utm-keeper' }: Options) => storageKey;
function clean(value: unknown): Tags {
  return Object.fromEntries(keys.flatMap(key => value && typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, key) && typeof (value as Tags)[key] === 'string' && (value as Tags)[key]
    ? [[key, (value as Tags)[key]]] : []));
}

/** Return a fresh copy of the saved tags. */
export function get(options: Options = {}): Tags {
  const key = keyOf(options);
  if (fallback.has(key)) return { ...fallback.get(key) };
  try { return clean(JSON.parse(localStorage.getItem(key) || '{}')); }
  catch { return {}; }
}

/** Save this tagged arrival, decorate current and future forms, and return cleanup. */
export function utmKeeper(options: Options = {}): () => void {
  if (typeof document === 'undefined') return () => {};
  const key = keyOf(options);
  const incoming = clean(Object.fromEntries(new URLSearchParams(location.search)));
  if (Object.keys(incoming).length) {
    try { localStorage.setItem(key, JSON.stringify(incoming)); fallback.delete(key); }
    catch { fallback.set(key, incoming); }
  }
  const decorate = () => {
    const tags = get(options);
    for (const form of document.forms) {
      for (const [name, value] of Object.entries(tags)) {
        let input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (input && input.type !== 'hidden') continue;
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          form.append(input);
        }
        input.value = value;
      }
    }
  };
  decorate();
  const observer = new MutationObserver(decorate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('submit', decorate, true);
  return () => {
    observer.disconnect();
    document.removeEventListener('submit', decorate, true);
  };
}
