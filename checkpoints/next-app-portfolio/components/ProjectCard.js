import Image from "next/image";
import Link from "next/link";
import styles from "./ProjectCard.module.css";

export default function ProjectCard({ project }) {
  return <Link href={`/projects#${project.id}`} className={styles.card}>
    <div className={styles.visual} style={{ background: project.color }}><Image src={project.image} alt={`${project.title} project preview`} fill sizes="(max-width: 760px) 100vw, 33vw" /></div>
    <div className={styles.meta}><div><p>{project.type}</p><h3>{project.title}</h3></div><span>{project.year} ↗</span></div>
  </Link>;
}
