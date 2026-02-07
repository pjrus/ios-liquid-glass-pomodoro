# iOS Liquid Glass Pomodoro

A beautiful, immersive Pomodoro timer application for iOS built with React Native and Expo. This app combines productivity with a satisfying "Liquid Glass" aesthetic, featuring a unique draining liquid timer, glassmorphism UI elements, and robust task tracking.

## Features

- **Liquid Timer Visualization**: A unique U-shaped tank indicator where time determines the liquid level, featuring smooth SVG animations and meniscus effects.
- **Glassmorphism UI**: Modern, translucent interface components (`GlassView`) using blur effects for a premium native feel.
- **Focus & Task Management**:
  - Create and manage tasks.
  - Link focus sessions to specific tasks to track productivity.
  - Track completed Pomodoros per task.
- **Customizable Profiles**: Switch between different timer modes (Focus, Short Break, Long Break) with custom durations.
- **Audio Experience**:
  - Integrated ambient background sounds (White Noise, Rain, etc.) to help you focus.
  - Custom alarm sounds for timer completion.
- **Rich Analytics**: Visual history of your focus sessions and daily productivity using `FocusHistoryGraph`.
- **Haptic Feedback**: Tactile responses for user interactions and timer events.
- **Theming**: Full support for Light, Dark, and System themes.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with persistence)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [React Native SVG](https://github.com/software-mansion/react-native-svg)
- **UI Components**: `expo-blur`, `expo-haptics`, `react-native-gesture-handler`.
- **Storage**: `@react-native-async-storage/async-storage` & `expo-file-system`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (for Mac users) or the Expo Go app on your physical device.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/ios-liquid-glass-pomodoro.git
    cd ios-liquid-glass-pomodoro
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Run the app:
    ```bash
    npx expo start
    ```

4.  Press `i` to open in the iOS Simulator, or scan the QR code with your phone (using Expo Go or Camera app).

## Project Structure

```
ios-liquid-glass-pomodoro/
├── app/                  # Expo Router pages and layouts
│   ├── (tabs)/           # Main tab navigation (Timer, Tasks, Analytics, Settings)
│   └── ...
├── components/           # Reusable UI components
│   ├── LiquidTank.tsx    # The core liquid timer visualization
│   ├── GlassView.tsx     # Blurred glass background container
│   └── ...
├── constants/            # App constants and theme colors
├── hooks/                # Custom React hooks
├── store/                # Zustand state stores (timer, tasks, theme, sound)
├── assets/               # Images, fonts, and sound files
└── ios/                  # Native iOS project files
```

## Key Components

- **`TimerScreen` (`app/(tabs)/index.tsx`)**: The main dashboard handling the countdown logic, audio playback, and animation coordination.
- **`LiquidTank`**: An SVG-based component that renders the fluid animation based on the percentage of time remaining.
- **`TaskStore`**: Manages the state of user tasks and their associated completion metrics.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is open source.

## Acknowledgements

Generative AI was utilized for assistance throughout the development of this application.
