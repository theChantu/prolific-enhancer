# Prolific Enhancer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/github/package-json/v/theChantu/prolific-enhancer?color=gre)

A JavaScript userscript that augments the Prolific user experience.

## Features

- **Color Code:** Applies logarithmic color scaling to hourly rates to highlight high vs low paying studies.
- **Currency Conversion:** Supports conversion to either USD or GBP.
- **Direct Survey Links:** Adds "Take part" buttons directly to each survey.
- **Notifications:** Background alerts for new studies.
- **Settings:** Toggle any feature directly from the Userscript menu.

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
    - Install directly from [here](https://github.com/theChantu/prolific-enhancer/raw/main/dist/prolific-enhancer.user.js).
    - Or, navigate to the `dist/prolific-enhancer.user.js` file in this repository and click **Raw**.
    - Your Userscript Manager should automatically detect the script and prompt you to install.
    - Click **Confirm** or **Install**.
    - If you cloned this repo, open `dist/prolific-enhancer.user.js` in your browser instead.

## Usage

1. **Dashboard:** Log in to [Prolific](https://app.prolific.com/) and open the "Studies" tab.
2. **Settings:** To toggle features (e.g., turn off Currency Conversion):
    - Click your Userscript Manager icon (Violentmonkey/Tampermonkey) in the browser toolbar.
    - Look under "Prolific Enhancer" to see the "Enable/Disable" commands.
    - Click a command to toggle it. The page updates instantly.
3. **Notifications:** Keep the Prolific tab open (it can be in the background) to receive alerts.

## Development

### Prerequisites

- Node.js v18+ or Bun v1.2+
- npm or Bun package manager

### Installation

Clone the repository

```
git clone https://github.com/theChantu/prolific-enhancer.git
```

Navigate to the directory

```
cd prolific-enhancer/
```

Install the dependencies

```
npm install
```

### Development

Build

```
npm run build
```

Build and watch for changes

```
npm run watch
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
