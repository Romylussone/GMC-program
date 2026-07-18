import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";
import styles from "../styles/Home.module.css";

export default function Home({ featuredProjects }) {
  return <Layout>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><p className="eyebrow">Frontend developer · Based in Abidjan</p><h1>I make digital spaces feel <em>human.</em></h1><p className={styles.intro}>I&apos;m Raya, a frontend developer who turns considered ideas into warm, clear and useful web experiences.</p><Link href="/projects" className="button">See selected work <span>↓</span></Link></div>
      <div className={styles.portrait}><Image src="/images/profile-art.svg" alt="Illustrated portrait of Raya" fill priority sizes="(max-width: 760px) 100vw, 42vw" /></div>
    </section>
    <section className={styles.statement}><p className="eyebrow">A little about me</p><div><h2>Good design is less about decoration, more about making someone&apos;s day <em>easier.</em></h2><Link href="/about" className="textLink">More about me <span>→</span></Link></div></section>
    <section className={styles.work}><div className={styles.sectionHead}><p className="eyebrow">Selected work</p><Link href="/projects" className="textLink">All projects <span>→</span></Link></div><div className={styles.grid}>{featuredProjects.map(project => <ProjectCard project={project} key={project.id} />)}</div></section>
    <section className={styles.cta}><p className="eyebrow">Have an idea?</p><h2>Let&apos;s make something <em>meaningful.</em></h2><a href="mailto:hello@rayak.dev" className={styles.email}>hello@rayak.dev <span>↗</span></a></section>
  </Layout>;
}

export async function getServerSideProps() { return { props: { featuredProjects: projects.slice(0, 3) } }; }
