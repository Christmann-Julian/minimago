# Minimago

Minimago is an Electron-based application designed to provide advanced image processing tools with a user-friendly interface. Built with TypeScript and React, it leverages the power of modern web technologies to deliver a seamless desktop experience.

## Features

- **Image Processing**: Perform various image transformations and enhancements.
- **Customizable UI**: Tailor the interface to your preferences.
- **Localization Support**: Available in multiple languages (English, French).
- **Lightweight and Fast**: Optimized for performance.

## Project Structure

The project is organized as follows:

```
minimago/
├── dist-electron/       # Compiled Electron files
├── src/                 # Source code
│   ├── electron/        # Electron main and preload scripts
│   └── ui/              # React frontend
│       ├── components/  # Reusable React components
│       ├── locales/     # Localization files
│       └── assets/      # Static assets
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration for development
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/minimago.git
   ```

2. Navigate to the project directory:

   ```bash
   cd minimago
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server:

```bash
npm run dev
```

## Distribution

To package the application for different platforms, use the following commands:

- **macOS**:

  ```bash
  npm run dist:mac
  ```

  This will transpile the Electron code, build the application, and create a distributable for macOS (ARM64).

- **Windows**:

  ```bash
  npm run dist:win
  ```

  This will transpile the Electron code, build the application, and create a distributable for Windows (x64).

- **Linux**:
  ```bash
  npm run dist:linux
  ```
  This will transpile the Electron code, build the application, and create a distributable for Linux (x64).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
