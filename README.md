# Prolific Enhancer

A Javascript-based browser extension to augment the Prolific user experience.

## Features

-   **Color Code:** Applies logarithmic color scaling to hourly rates\.
-   **Currency Conversion:** Converts GBP values to USD.
-   **Direct Survey Links:** Adds direct links to each survey to allow taking part in a study faster.
-   **Notifications:** Background alerts for new studies.

## Screenshots

![Features](assets/prolific-color-coding-direct-links.png)

## Technologies

-   JavaScript (ES6+)
-   Violentmonkey / Tampermonkey API

## Installation

1. **Install a Userscript Manager**
   You need a browser extension to run this script. I recommend:

    - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari)
    - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Edge, Firefox)

2. **Install the Script**
    - Navigate to the `prolific-enhancer.user.js` file in this repository.
    - Click the **Raw** button (top right of the file viewer).
    - Your Userscript Manager should automatically detect the script and prompt you to install.
    - Click **Confirm** or **Install**.

## Usage

-   Log in to [Prolific](https://app.prolific.com/).
-   The script will automatically run in the background.
