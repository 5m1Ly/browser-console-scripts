console.log("Script is created by github.com/5m1Ly and other contributors to the github.com/5m1Ly/browser-console-scripts repository. Feel free to contribute or just enjoy the results!");

class MatchHistory {
    matches = [];

    constructor() { }
}

// class for loading elements from the DOM
class DOMLoader {
    static all = document.querySelectorAll;
    static single = document.querySelector;

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

    buttons() {
        return Array.from(document.querySelectorAll('button'));
    }

    tables() {
        return document.querySelectorAll('table');
    }
}

(() => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const MATCHES_TABLE_COLUMNS = 5;

    console.log('Starting auto-clip script...');

    const matchHistory = new MatchHistory();

    function getAllButtons() {
        return Array.from(document.querySelectorAll('button'));
    }

    function getLoadMoreButton() {
        const buttons = getAllButtons();
        return buttons.find(el => el.textContent.includes('Load More'));
    }

    function getUnfilteredMatchHistory() {
        const matches = Array.from(document.querySelectorAll("tr"));
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
            const more = getLoadMoreButton();
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
            console.log(`Clicked match ${i + 1}/${matches.length}`);
            await sleep(500);
        }
    }

    initialize().then(() => console.log('Initialization complete'));
})();
