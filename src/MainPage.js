import './MainPage.css';
import Intro from './components/Intro';
import ExperienceItem from './components/ExperienceItem';
import ProjectRow from './components/ProjectRow';
import EducationItem from './components/EducationItem';
import { experiences } from './data/experiences';
import { projects, earlierWork } from './data/projects';

export default function MainPage() {
    return (
        <main className="container" id="main-content" tabIndex="-1">
            <Intro />
            <section id="experience" aria-labelledby="experience-title">
                <h2 id="experience-title">Experience</h2>
                {experiences.map(experience => <ExperienceItem key={experience.id} {...experience} />)}
            </section>
            <section id="projects" aria-labelledby="projects-title">
                <h2 id="projects-title">Selected Work</h2>
                {projects.filter(project => project.visible).map(project => <ProjectRow key={project.slug} {...project} />)}
            </section>
            <section id="education" aria-labelledby="education-title">
                <h2 id="education-title">Education</h2>
                <EducationItem />
            </section>
            <section id="earlier-work" aria-labelledby="earlier-work-title">
                <h2 id="earlier-work-title">Earlier Work</h2>
                {earlierWork.map(work => (
                    <article className="earlier-work" key={work.slug} aria-labelledby={`${work.slug}-title`}>
                        <header className="item-heading">
                            <h3 id={`${work.slug}-title`}>{work.title}</h3>
                            <span className="date">{work.date}</span>
                        </header>
                        <p>{work.description}{' '}
                            <span className="inline-links">{work.links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</span>
                        </p>
                    </article>
                ))}
            </section>
            <footer className="site-footer">Mukund Shankar · <a href="mailto:smukund23@gmail.com">Email</a></footer>
        </main>
    );
}
