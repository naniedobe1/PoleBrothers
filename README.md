# PoleBrothers

A React Native iOS application for capturing and viewing photos with location/timestamp metadata, featuring a forest-inspired design theme. Users can capture pole inspection photos with GPS coordinates and view them in a gallery feed.

## Features

- 📸 Full-screen camera with capture functionality
- 📍 GPS location tagging for each photo
- 🖼️ Gallery view with photo cards (Twitter-style)
- 🌲 Forest-themed UI (green, beige, brown color palette)
- ⚡ Animated splash screen
- 📱 Bottom tab navigation

---

## Prerequisites

Before building and running the app, ensure you have the following installed:

### Required Software

1. **macOS** (required for iOS development)
   - macOS 12.0 or later recommended

2. **Xcode** (required)
   - Version 14.0 or later
   - Install from the [Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
   - After installation, open Xcode once to install additional components and accept the license agreement

3. **Command Line Tools**
   - After installing Xcode, set the command line tools:
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

4. **Node.js** (required)
   - Version 20.0 or later
   - Download from [nodejs.org](https://nodejs.org/) or install via Homebrew:
   ```bash
   brew install node
   ```

5. **Watchman** (recommended)
   - Helps React Native watch for file changes
   ```bash
   brew install watchman
   ```

6. **Ruby** (required for CocoaPods)
   - macOS comes with Ruby pre-installed
   - Verify version (2.7.0 or later recommended):
   ```bash
   ruby --version
   ```

7. **CocoaPods** (required for iOS dependencies)
   - Will be installed via Bundler (see installation steps below)

---

## Installation & Setup

Follow these steps to build and run the PoleBrothers iOS app on your local machine:

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd PoleBrothersApp
```

### 2. Install Node.js Dependencies

Install all JavaScript dependencies listed in `package.json`:

```bash
npm install
```

This will create the `node_modules/` folder with all required packages.

### 3. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```bash
cp .env.example .env
```

Or create it manually:
```bash
touch .env
```

Add the following variables to the `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get these values:**

1. Go to [supabase.com](https://supabase.com) and sign in to your project
2. Navigate to **Project Settings** → **API**
3. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
4. Copy your **anon/public key** (the long JWT token starting with `eyJhbG...`)

> **Important**: The `.env` file is already in `.gitignore` and will not be committed to Git. Never share your Supabase keys publicly!

### 4. Install Ruby Dependencies (Bundler)

Install the Ruby gems needed for CocoaPods:

```bash
bundle install
```

This installs CocoaPods and other Ruby dependencies specified in the `Gemfile`.

### 5. Install iOS Dependencies (CocoaPods)

Navigate to the iOS directory and install native iOS dependencies:

```bash
cd ios
bundle exec pod install
cd ..
```

This will:
- Download and install all iOS native dependencies
- Create the `Pods/` folder
- Generate `PoleBrothers.xcworkspace`

> **Note**: Always use `PoleBrothers.xcworkspace` (not `.xcodeproj`) when opening in Xcode.

### 6. Verify Installation

Check that Xcode can find the iOS SDK:

```bash
xcodebuild -version
```

You should see output like:
```
Xcode 15.0
Build version 15A240d
```

If you see an error about Xcode not being found, run:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

---

## Database Setup

Before running the app, you need to create the database table in Supabase:

### 1. Create the `PolesCaptured` Table

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Run the following SQL:

```sql
CREATE TABLE public."PolesCaptured" (
  taker_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  latitude double precision NOT NULL,
  longitude double precision NULL,
  image_uri text NULL,
  status text NULL,
  lower_confidence double precision NULL,
  upper_confidence double precision NULL,
  normal_pole boolean NULL,
  leaning_pole boolean NULL,
  warped_pole boolean NULL,
  vegetation_pole boolean NULL,
  cracked_pole boolean NULL,
  CONSTRAINT PolesCaptured_pkey PRIMARY KEY (taker_id, created_at)
) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public."PolesCaptured" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust for production)
CREATE POLICY "Allow all operations" ON public."PolesCaptured"
  FOR ALL USING (true);
```

### 2. Verify Connection

When you run the app, check the console logs. You should see:
```
Supabase connected successfully!
```

If you see connection errors, verify your `.env` file has the correct credentials.

---

## Running the App

### Option 1: Run via Command Line (Recommended)

From the project root directory:

```bash
npm run ios
```

This will:
- Start the Metro bundler (JavaScript packager)
- Build the iOS app
- Launch the iOS Simulator
- Install and run the app

### Option 2: Run via Xcode

1. Open the workspace in Xcode:
   ```bash
   open ios/PoleBrothers.xcworkspace
   ```

2. Select a simulator or connected device from the device menu (top toolbar)

3. Click the **Run** button (▶️) or press `Cmd + R`

### Choosing a Specific Simulator

To run on a specific iOS simulator:

```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

To list available simulators:

```bash
xcrun simctl list devices
```

---

## Permissions

The app requires the following permissions (configured in `Info.plist`):

- **Camera** - To capture pole photos
- **Location (When In Use)** - To tag photos with GPS coordinates
- **Photo Library** - To save and retrieve photos

These permissions will be requested automatically when first needed.

---

## Project Structure

```
PoleBrothersApp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── PhotoCard.js     # Photo display card
│   │   └── SplashScreen.js  # Animated splash screen
│   ├── screens/             # Main app screens
│   │   ├── CameraScreen.js  # Camera capture screen
│   │   └── PolesCapturedScreen.js  # Gallery view
│   ├── navigation/
│   │   └── TabNavigator.js  # Bottom tab navigation
│   ├── utils/               # Helper functions
│   │   ├── storage.js       # Photo file management
│   │   └── location.js      # GPS utilities
│   └── theme/               # Styling and colors
│       ├── colors.js        # Color palette
│       └── styles.js        # Style constants
├── assets/                  # Images and static files
│   └── logo.png            # App logo
├── ios/                     # iOS native code
├── android/                 # Android native code (not used)
└── App.js                   # Root component
```

---

## Troubleshooting

### `xcrun: error: SDK "iphoneos" cannot be located`

**Solution**: Install Xcode from the Mac App Store and set command line tools:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version
```

### `pod install` fails with glog errors

**Solution**: Ensure Xcode is fully installed (not just Command Line Tools). Run:
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
```

### Metro bundler connection issues

**Solution**: Reset Metro cache and restart:
```bash
npm start -- --reset-cache
```

### Build fails in Xcode

**Solution**: Clean build folder and retry:
1. In Xcode: `Product` → `Clean Build Folder` (or press `Cmd + Shift + K`)
2. Close Xcode
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
4. Rebuild

### Camera not working in simulator

**Note**: The iOS Simulator has limited camera support. For full camera functionality, test on a physical iOS device.

---

## Development

### Starting Metro Bundler Separately

If you prefer to run Metro separately:

```bash
npm start
```

Then in a new terminal:

```bash
npm run ios
```

### Hot Reloading

- Changes to JavaScript files will automatically reload
- Press `R` in the simulator to manually reload
- Press `Cmd + D` to open the developer menu

---

## Learn More

To learn more about React Native and the technologies used:

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Vision Camera](https://react-native-vision-camera.com/)
- [React Native Geolocation](https://github.com/Agontuk/react-native-geolocation-service)

---

## License

Private project - All rights reserved.
