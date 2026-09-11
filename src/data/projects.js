import toolCallPreview from '../files/tool-call-probes.png';
import confidencePreview from '../files/confidence-probe-roc.png';
import toolCallReport from '../files/tool_call_report.pdf';
import confidenceReport from '../files/723_report.pdf';

// Explicit reverse chronology. Toggle visible to publish or hide an experiment.
export const projects = [
    {
        slug: 'loopformer', title: 'LoopFormer', date: 'Sep 2026 – Present',
        status: 'Early experiment', visible: false,
        // No detail page until the experiment has substantive results.
        image: '/projects/loopformer/architecture.svg', imageAlt: 'Shared transformer blocks applied repeatedly between input and output',
        href: 'https://github.com/MukundShankar-dev/loopformer', external: true,
        links: [{ label: 'GitHub', href: 'https://github.com/MukundShankar-dev/loopformer', external: true }],
        description: 'Exploring recurrent computation in small language models by repeatedly applying shared transformer blocks and evaluating how learned reasoning depth generalizes.',
    },
    {
        slug: 'full-time-brief', title: 'Full Time Brief', date: 'Jun 2026 – Present',
        status: 'Live', visible: true,
        image: '/projects/full-time-brief/screenshot.jpg',
        imageAlt: 'Full Time Brief homepage with football briefings and match coverage',
        href: '/projects/full-time-brief/',
        description: 'A live football briefing platform I co-founded and built end-to-end, combining automated news discovery with near-live match coverage.',
        links: [
            { label: 'Website ↗', href: 'https://www.fulltimebrief.com', external: true },
            { label: 'More details →', href: '/projects/full-time-brief/' },
        ],
    },
    {
        slug: 'dexvision', title: 'DexVision', date: 'Jun 2026 – Present',
        status: 'In progress', visible: true,
        image: '/projects/dexvision/images/lift.png',
        imageAlt: 'Simulated Shadow Hand lifting a block in the DexVision workcell',
        href: '/projects/dexvision/',
        description: 'Exploring reusable robot skills for task-level language-model control, starting with dexterous manipulation, data collection, and learned controllers in MuJoCo.',
        links: [
            { label: 'Project journal', href: '/projects/dexvision/' },
            { label: 'GitHub', href: 'https://github.com/MukundShankar-dev/DexVision', external: true },
        ],
    },
    {
        slug: 'tool-calling', title: 'Diagnosing Tool-Call Decision Making in Small LLMs', date: 'Feb–May 2026', visible: true,
        image: toolCallPreview, imageAlt: 'When2Call probe accuracy across layers for Gemma and Llama models', imageFit: 'contain',
        href: '/projects/tool-calling/',
        description: 'Studied how small language models decide whether to call a tool, ask for clarification, or abstain, and whether correct decisions can be recovered from internal representations when final behavior is wrong.',
        links: [
            { label: 'Project page', href: '/projects/tool-calling/' },
            { label: 'Report', href: toolCallReport, external: true },
            { label: 'Code', href: 'https://github.com/anirudhporuri/tool-call-decision-making/', external: true },
        ],
    },
    {
        slug: 'confidence-probes', title: 'Confidence Probes for Language Models', date: 'Sep–Dec 2025', visible: true,
        image: confidencePreview, imageAlt: 'Qwen 2.5 7B confidence probe on TriviaQA: ROC curve with AUC 0.953', imageFit: 'contain',
        href: '/projects/confidence-probes/',
        description: 'Trained lightweight probes over internal language-model signals to predict answer correctness across datasets and model sizes, then studied how those signals fail under distribution shift.',
        links: [
            { label: 'Project page', href: '/projects/confidence-probes/' },
            { label: 'Report', href: confidenceReport, external: true },
            { label: 'Code', href: 'https://github.com/MukundShankar-dev/Confidence-Probes-For-LMs', external: true },
        ],
    },
];

export const earlierWork = [
    {
        slug: 'agora', title: 'agora.', date: '2023', description: 'Meal-planning application I co-founded while at UMD.',
        links: [
            { label: 'UMD feature', href: 'https://www.cs.umd.edu/article/2023/10/umd-undergrads-revolutionize-meal-planning-innovative-app' },
            { label: 'App Store', href: 'https://apps.apple.com/us/app/agora/id6462011570?ign-itscg=30200&ign-itsct=apps_box_badge' },
            { label: 'Website', href: 'https://master.d1frbpmrrocpzu.amplifyapp.com/' },
        ],
    },
    {
        slug: 'aerial-object-detector', title: 'Aerial Object Detector', date: 'Feb 2023',
        description: 'First place, 2023 Northrop Grumman Hack Week. YOLOv5 balloon detection system.',
        links: [{ label: 'GitHub', href: 'https://github.com/MukundShankar-dev/aerial-object-classification' }],
    },
];
