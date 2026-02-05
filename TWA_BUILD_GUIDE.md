# Proxima 8 TWA Build Guide

This document outlines the process used to convert the Proxima 8 PWA into an Android Trusted Web Activity (TWA) using Bubblewrap and Gradle.

## Prerequisites

The following tools were installed/configured during the setup:
- **Node.js**: Required for Bubblewrap.
- **@bubblewrap/cli**: Installed locally (`npm install @bubblewrap/cli`).
- **Bubblewrap SDKs**: Java JDK and Android SDK installed by Bubblewrap in `~/.bubblewrap`.

## 1. PWA Preparation

Before wrapping, the PWA required specific configurations:
1.  **Manifest Rename**: Renamed `manifest.webmanifest` to `manifest.json` for better compatibility.
2.  **Absolute URLs**: Updated `manifest.json` icons and `start_url` to use absolute HTTPS URLs (e.g., `https://fifthrace.github.io/proxima8/...`).
3.  **Live Deployment**: The PWA changes must be deployed to a live URL (GitHub Pages) because `bubblewrap init` validates the manifest over the network.

## 2. Project Initialization

We initialized the Android project using Bubblewrap. Due to interactive prompt issues in the CLI environment, we used a pipe workaround to feed inputs to the command.

**Command:**
```bash
printf "Y\n" | ./node_modules/.bin/bubblewrap update
```
*Note: This command was used after an initial partial generation. Normally `bubblewrap init --manifest <url>` is the starting point.*

This process generated:
- `app/`: The Android project source code.
- `twa-manifest.json`: Configuration for the TWA.
- `android.keystore`: The signing key for the app.

## 3. Build Configuration

Directly running `bubblewrap build` failed due to the interactive prompts. We switched to using the underlying **Gradle** build system manually.

### A. Environment Setup
Bubblewrap installs its own versions of Java and the Android SDK. We had to point the environment to them explicitly.

1.  **Set JAVA_HOME**:
    ```bash
    export JAVA_HOME="/home/baxter/.bubblewrap/jdk/jdk-17.0.11+9"
    ```

2.  **Configure Android SDK**:
    Created `local.properties` in the project root:
    ```properties
    sdk.dir=/home/baxter/.bubblewrap/android_sdk
    ```

### B. Signing Configuration
To avoid interactive password prompts during the build, we modified `app/build.gradle` to include the signing configuration directly for the `release` build type:

```gradle
signingConfigs {
    release {
        storeFile file(project.findProperty("storeFile") ?: "../android.keystore")
        storePassword "password"
        keyAlias "android"
        keyPassword "password"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
    }
}
```

## 4. Building the APK

With the environment and signing configured, we built the signed Release APK using the Gradle Wrapper included in the project.

**Command:**
```bash
./gradlew assembleRelease
```

**Output:**
The final signed APK is located at:
`app/build/outputs/apk/release/app-release.apk`

## 5. Future Builds

To rebuild the app (e.g., after changing icons or `twa-manifest.json`):

1.  **Regenerate Project (if config changed):**
    ```bash
    rm -rf app
    printf "Y\n" | ./node_modules/.bin/bubblewrap update
    ```
    *Note: You may need to re-apply the `app/build.gradle` signing changes if the folder is wiped.*

2.  **Compile APK:**
    ```bash
    export JAVA_HOME="/home/baxter/.bubblewrap/jdk/jdk-17.0.11+9"
    ./gradlew assembleRelease
    ```
