import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Layout.module.css";

const navigation = [
  ["Home", "/"],
  ["About", "/about"],
  ["Projects", "/projects"],
  ["Contact", "/contact"],
];

export default function Layout({ children, title = "Raya K. | Frontend Developer" }) {
  const router = useRouter();
  return (
    <div className={styles.shell}>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Portfolio of Raya K., frontend developer and thoughtful problem solver." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="Raya K. home">RK<span>.</span></Link>
        <nav aria-label="Main navigation" className={styles.nav}>
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className={router.pathname === href ? styles.active : ""}>{label}</Link>
          ))}
        </nav>
        <a href="mailto:hello@rayak.dev" className={styles.hello}>Let&apos;s talk <span>↗</span></a>
      </header>
      <main>{children}</main>
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Raya K. Built with care and Next.js.</p>
        <div><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a><a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></div>
      </footer>
    </div>
  );
}
