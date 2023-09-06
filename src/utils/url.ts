import queryString from 'query-string';

export function parseQuery(url = '') {
  const { query } = queryString.parseUrl(url);
  return query;
}

export function padQuery(search = '', params: Record<string, string | number>) {
  const query = parseQuery(search);
  return `?${queryString.stringify({ ...query, ...params })}`;
}
