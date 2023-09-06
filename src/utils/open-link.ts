import { collect } from './mixpanel';
import { getUserAccount } from './user';
import { Link } from '../types/link';

export async function openLink(type: Link, url: string) {
  const user = await getUserAccount();
  collect('open_link', {
    type,
    url,
    user: user && user.address ? user.address : '',
  });
  window.open(url);
}
