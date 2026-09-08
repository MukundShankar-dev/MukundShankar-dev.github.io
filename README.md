# Mukund Shankar's personal website

The homepage lives in `src/MainPage.js`, with styles in `src/MainPage.css`.
The resume download is `src/files/resume.pdf`.

## DexVision journal

The journal is a standalone HTML page at `public/projects/dexvision/index.html`,
served at `/projects/dexvision/`. GitHub Pages can open and refresh that address
directly, and the journal is readable without JavaScript. Styles are shared via
`public/projects/journal.css`.

The journal follows phases 1–4 chronologically using the complete
`docs/progress_level_1.md` through `docs/progress_level_4.md` logs and
`docs/CURRENT_STATUS.md` in the DexVision repository. The tracking, feature,
and smoothing descriptions were also checked against their implementations.
Historical write-ups are identified as retrospectives, and subsection labels
map the narrative back to checkpoint numbers. Replay image provenance is recorded in
`public/projects/dexvision/images/README.md`.

To write an update:

1. Read the relevant progress log, including the failed attempts, remediation
   notes, and manual results. Use `CURRENT_STATUS.md` to distinguish completed
   checkpoints from planned work. Check implementation code for algorithm names
   or formulas that the notes leave ambiguous.
2. Append a dated subsection at the comment near the end of the active phase.
   Explain what you tried, what happened, how you diagnosed it, what changed,
   and what remains unresolved. Include concrete observations and measurements
   when they explain the decision. Do not invent failures or personal reactions
   where the log only records a successful setup check.
3. Preserve earlier results. Explain a later correction in its chronological
   position rather than rewriting an unsuccessful attempt as a smooth success.
   Checkpoint numbers sometimes contain later revisits (such as 1.3B after
   1.10); use the actual sequence of events and label the revisit.
4. Add a new phase after the existing articles, oldest first. Give its article
   and headings unique IDs, connect `aria-labelledby` and the permalink, and
   append a matching `journal-index` link in the same order.
5. Keep the homepage focused on the project goal. Put completed experiments,
   difficulties, and the detailed development history in the journal. Mark
   planned work in prose; do not add a status box or claim it has been completed.

Use `npm start` to preview locally, `CI=true npm test -- --watchAll=false` for
the homepage check, and `npm run build` for the production build. The existing
`npm run deploy` command publishes the build to GitHub Pages when ready.

## Create React App reference

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
