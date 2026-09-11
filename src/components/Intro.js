import mukund from '../files/optimized/mukund.webp';
import resume from '../files/resume.pdf';

export default function Intro() {
    return (
        <header className="intro">
            <div className="intro-copy">
                <h1>Mukund Shankar</h1>
                <p>I'm a master's student in Computer Science at the University of Maryland interested in building reliable AI systems and products. My work spans language-model reasoning and evaluation, multimodal learning, and production ML. I also co-founded and build <a href="https://www.fulltimebrief.com" target="_blank" rel="noopener noreferrer">Full Time Brief</a>, a live football briefing platform.</p>
                <p className="current-research">Currently, I'm researching long-form language generation, with a focus on coherence, style, and human-like storytelling.</p>
                <nav className="inline-links" aria-label="Contact and profiles">
                    <a href="mailto:smukund23@gmail.com">Email</a>
                    <a href={resume} target="_blank" rel="noopener noreferrer">Resume</a>
                    <a href="https://www.linkedin.com/in/mukundsh" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://github.com/mukundshankar-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
                </nav>
            </div>
            <img className="portrait" src={mukund} alt="Mukund Shankar" width="112" height="112" />
        </header>
    );
}
