import { redirect } from 'next/navigation';

// The app starts on /templates — Templates are the primary product.
export default function Home() {
  redirect('/templates');
}
