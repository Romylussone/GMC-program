import Layout from "../components/Layout";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";
import styles from "../styles/Pages.module.css";
export default function Projects({ allProjects }) { return <Layout title="Projects | Raya K."><section className={styles.pageHero}><p className="eyebrow">Selected projects</p><h1>Thoughtful work for the web.</h1><p className={styles.subhead}>A selection of interfaces and digital products shaped with care, clarity and a little curiosity.</p></section><section className={styles.projectList}>{allProjects.map((project, index) => <article id={project.id} key={project.id} className={styles.projectRow}><ProjectCard project={project} /><div className={styles.projectDetails}><span>0{index + 1}</span><p>{project.type}</p><div>{project.tags.map(tag => <small key={tag}>{tag}</small>)}</div><p className={styles.description}>A focused digital experience designed to make the important things feel effortless.</p></div></article>)}</section></Layout>; }
export async function getServerSideProps() { return { props: { allProjects: projects } }; }
