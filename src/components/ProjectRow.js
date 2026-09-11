export default function ProjectRow({ slug, title, date, status, image, imageAlt, imageFit, href, external, description, links }) {
    const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
        <article className="project-row" aria-labelledby={`${slug}-title`}>
            <a className="project-thumbnail" href={href} {...externalProps} aria-label={`View ${title}`}>
                <img src={image} alt={imageAlt} width="140" height="88" loading="lazy" style={imageFit ? { objectFit: imageFit } : undefined} />
            </a>
            <div className="project-copy">
                <header className="item-heading">
                    <h3 id={`${slug}-title`}><a href={href} {...externalProps}>{title}</a></h3>
                    <span className="date">{date}{status && <> · <span className="project-status">{status}</span></>}</span>
                </header>
                <p>{description}</p>
                <div className="inline-links project-links">
                    {links.map(link => <a key={link.href} href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.label}</a>)}
                </div>
            </div>
        </article>
    );
}
