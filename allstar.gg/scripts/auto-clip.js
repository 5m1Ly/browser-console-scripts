console.log("Script is created by github.com/5m1Ly and other contributors to the github.com/5m1Ly/browser-console-scripts repository. Feel free to contribute or just enjoy the results!");

(() => {
    // class for loading elements from the DOM
    class DOMLoader {
        static all = (...args) => document.querySelectorAll(...args);
        static single = (...args) => document.querySelector(...args);

        static actionAsync(selector, action = DOMLoader.single, timeout = 3000) {
            return new Promise((resolve, reject) => {
                const interval = 100;
                let elapsedTime = 0;
                const timer = setInterval(() => {
                    const element = action(selector);
                    if (element) {
                        clearInterval(timer);
                        resolve(element);
                    } else if (elapsedTime >= timeout) {
                        clearInterval(timer);
                        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                    }
                    elapsedTime += interval;
                }, interval);
            });
        }

        static singleAsync(selector, timeout = 3000) {
            return DOMLoader.actionAsync(DOMLoader.single, selector, timeout);
        }

        static allAsync(selector, timeout = 3000) {
            return DOMLoader.actionAsync(DOMLoader.all, selector, timeout);
        }

        static buttons() {
            return Array.from(DOMLoader.all('button'));
        }

        static buttonsByContent(content) {
            const buttons = DOMLoader.buttons();
            const filtered = buttons.filter(el => el.textContent.includes(content));
            return filtered.length > 0 ? filtered.length === 1 ? filtered[0] : filtered : null;
        }

        static tables() {
            return DOMLoader.all('table');
        }
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const MATCHES_TABLE_COLUMNS = 5;

    console.log('Starting auto-clip script...');

    function getUnfilteredMatchHistory() {
        const matches = Array.from(DOMLoader.all("tr"));
        matches.shift();
        return matches;
    }

    function continueLoading(loadMoreButton) {
        const matches = getUnfilteredMatchHistory();
        const lastMatch = matches[matches.length - 1];
        const lastMatchColumns = lastMatch ? lastMatch.children.length : 0;
        return !loadMoreButton.disabled && lastMatchColumns == MATCHES_TABLE_COLUMNS;
    }

    async function loadMatches() {
        try {
            const more = DOMLoader.buttonsByContent('Load More');
            while (continueLoading(more)) {
                more.click();
                console.log('loading more matches...');
                await sleep(1000);
            }
        } catch (e) {
            console.error('Failed to load all matches', e);
            return false;
        }
        console.log('Loaded all matches');
        return true;
    }

    function getMatchHistory() {
        const matches = getUnfilteredMatchHistory();
        return matches.filter(({ children: match }) => match.length == MATCHES_TABLE_COLUMNS);
    }

    async function handleClipping(button) {
        console.log('Handling clipping...');
        button.click();
        await sleep(2000);
        const next = DOMLoader.buttonsByContent('Next');
        if (next) {
            next.click();
            console.log('Clicked Next button');
            await sleep(2000);
            const create = DOMLoader.buttonsByContent('Create')[1];
            if (create) {
                create.click();
                console.log('Clicked Create button');
                await sleep(1000);
            }
        }
    }

    async function initialize() {
        const success = await loadMatches();
        if (!success) throw new Error('Failed to load all matches');

        const matches = getMatchHistory();
        console.log(`Found ${matches.length} matches`);
        if (matches.length === 0) throw new Error('No matches found');

        // click the match history table rows one by one
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            match.click();

            await sleep(2000);

            console.log(`Clicked match ${i + 1}/${matches.length}`);

            const clipButtons = DOMLoader.buttonsByContent('Clip');

            if (clipButtons) {
                if (Array.isArray(clipButtons)) {
                    console.warn(`Found multiple clip buttons for match ${i + 1}, clicking the first one`);
                    for (const [index, button] of clipButtons.entries()) {
                        console.warn(`Clicking clip button ${index + 1} of ${clipButtons.length} for match ${i + 1}`);
                        await handleClipping(button);
                        await sleep(1000);
                    }
                } else {
                    await handleClipping(clipButtons);
                    await sleep(1000);
                }
                console.log(`Clicked clip button for match ${i + 1}`);
            } else {
                console.warn(`No clip button found for match ${i + 1}`);
            }

        }
    }

    initialize().then(() => console.log('Initialization complete'));
})();
