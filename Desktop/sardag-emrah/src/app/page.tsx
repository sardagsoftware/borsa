/**
 * HOME PAGE - Auto-redirect to Market
 *
 * Default route always opens market page
 */

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to market page as default
  redirect('/market');
}
