export default function ExperienceItem({ id, title, organization, date, logo, bullets, links = [], quieter = false }) {
    return (
        <article className={`experience-item${quieter ? ' experience-quieter' : ''}`} aria-labelledby={`${id}-title`}>
            <img className="experience-logo" src={logo} alt={organization} width="48" height="48" loading="lazy" />
            <div>
                <header className="item-heading">
                    <h3 id={`${id}-title`}>{title} · {organization}</h3>
                    <span className="date">{date}</span>
                </header>
                <ul className="experience-bullets">{bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
                {links.length > 0 && <div className="inline-links">{links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</div>}
            </div>
        </article>
    );
}
