"use client";
import Link from 'next/link';
export default function Home() {


  return (
    <>
    <div>Главная страница</div>
    <nav>
      <Link href="/agent">Агент</Link>
    </nav>
    </>
  );
}
