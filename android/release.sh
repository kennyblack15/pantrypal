#!/bin/bash

# Ensure we're in the android directory
cd "$(dirname "$0")"

# Clean the project
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Location of the output APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo "✅ Release APK generated successfully!"
    echo "📱 APK location: $APK_PATH"
    echo "
Next steps:
1. Test the release build thoroughly
2. Update version code and name in build.gradle if needed
3. Sign the APK with your release key
4. Create Play Store listing
5. Upload APK to Play Store Console
"
else
    echo "❌ Error generating release APK"
    exit 1
fi
