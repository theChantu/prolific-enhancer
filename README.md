# Prolific Enhancer

A JavaScript userscript that augments the Prolific user experience.

## Features

- **Color Code:** Applies logarithmic color scaling to hourly rates\.
- **Currency Conversion:** Converts GBP values to USD.
- **Direct Survey Links:** Adds direct links to each survey to allow taking part in a study faster.
- **Notifications:** Background alerts for new studies.

## Screenshots

![Features](assets/prolific-color-coding-direct-links.png "Color coding and direct survey links on the studies page")

## Technologies

- JavaScript (ES6+)
- Violentmonkey / Tampermonkey API

## Installation

1. **Install a Userscript Manager**
   You need a browser extension to run this script. I recommend:
    - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari)
    - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Edge, Firefox)

2. **Install the Script**
    - Install directly from the raw file:
      `https://github.com/theChantu/prolific-enhancer/raw/main/dist/prolific-enhancer.user.js`
    - Or, navigate to the `dist/prolific-enhancer.user.js` file in this repository and click **Raw**.
    - Your Userscript Manager should automatically detect the script and prompt you to install.
    - Click **Confirm** or **Install**.
    - If you cloned this repo, open `dist/prolific-enhancer.user.js` in your browser instead.

## Usage

- Log in to [Prolific](https://app.prolific.com/).
- Open the studies page to see the enhancements.
- Notifications only work when a tab is open on the studies page.
- The script will automatically run in the background.

## Development

### Prerequisites

- Node.js v18+ or Bun v1.2+
- npm or Bun package manager

### Installation

```
npm install
```

Or, with Bun:

```
bun install
```

### Development

To watch for changes, run the following command:

```
npm run watch
```

Or, with Bun:

```
bun run watch
```
