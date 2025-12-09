# WBGDB - Shadowverse: Worlds Beyond Database

A comprehensive web application for browsing and exploring cards from the game "Shadowverse: Worlds Beyond". This project provides an interactive database with voice lines, card images, and detailed metadata for all available cards.

## Features

### 🎴 Card Database
- **Complete Card Collection**: Browse all available cards from Shadowverse: Worlds Beyond
- **Dual Language Support**: Switch between English and Japanese UI and voice languages
- **Advanced Filtering**: Filter cards by rarity, class, type, cost, stats, illustrator, CV, and more
- **Multiple View Modes**: List view and waterfall layout options
- **Search Functionality**: Search cards by name in both English and Japanese

### 🎵 Audio Features
- **Voice Line Collection**: Listen to character voice lines for each card
- **Audio Controls**: Play, pause, and download individual voice clips
- **Language Toggle**: Switch between Japanese and English voice lines
- **Meeting Voice Support**: Special voice lines for character interactions

### 🖼️ Visual Features
- **High-Quality Images**: Full-resolution card images with zoom functionality
- **Evolution Support**: Toggle between base and evolved card forms
- **Alternate Art**: View alternate card styles when available
- **Lightbox Gallery**: Full-screen card viewing with navigation
- **Mobile Responsive**: Optimized for both desktop and mobile devices

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with dark theme
- **Keyboard Shortcuts**: Quick access to common functions
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive Layout**: Adapts to different screen sizes

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser with JavaScript enabled

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/mhmkhlrdn/WBGDB.git
   cd WBGDB
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Serve the website locally:
   ```bash
   # Using a simple HTTP server
   npx serve Site/
   
   # Or using Python
   cd Site && python -m http.server 8000
   ```

4. Open your browser and navigate to `http://localhost:8000`

## Usage

### Navigation
- **Search**: Use the search bar to find specific cards
- **Filters**: Use the filter panel to narrow down results by various criteria
- **View Modes**: Switch between list and waterfall layouts
- **Language**: Toggle between English and Japanese UI/voice languages

### Keyboard Shortcuts
- `Ctrl + F`: Toggle filter panel
- `Ctrl + L`: Switch voice language
- `Ctrl + R`: Reset all filters
- `A` or `←`: Previous card (in lightbox)
- `D` or `→`: Next card (in lightbox)
- `Escape`: Close lightbox

### Card Interaction
- **Click card image**: Open in lightbox for detailed view
- **Voice buttons**: Play character voice lines
- **Download buttons**: Download individual voice files
- **Evolution toggle**: Switch between base and evolved forms
- **Alternate art**: View different card styles when available

## Data Collection

The card data and voice lines are collected through automated processes:

- **Card Images**: Sourced from the official Shadowverse: Worlds Beyond API
- **Voice Lines**: Recorded from the in-game card library using Audacity
- **Metadata**: Extracted using OCR and automated data processing
- **Audio Processing**: Automated splitting and normalization of voice files

## Contributing

This project is open source and contributions are welcome! Please feel free to:

1. Report bugs or issues
2. Suggest new features
3. Submit pull requests
4. Improve documentation

## Known Issues

- Some voice lines may be cut off due to early automation limitations
- Missing cards for characters not owned by the data collector
- OCR accuracy may cause minor text errors in card names
- Some alternate art styles are not yet available

## Credits

- **Full-Art Images**: Provided by Xtopher17
- **Voice Data**: Collected and processed by the project maintainer
- **Card Data**: Sourced from Shadowverse: Worlds Beyond official sources

## Contact

For questions, suggestions, or issues:
- Discord: @Arishulmr
- X (Twitter): @Arishulmer
- GitHub Issues: [Project Issues](https://github.com/mhmkhlrdn/WBGDB/issues)

---

**Note**: This project is not affiliated with Cygames or the official Shadowverse: Worlds Beyond game. All game assets are used under fair use for educational and community purposes.
