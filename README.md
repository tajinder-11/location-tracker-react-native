# location-tracker-react-native

Go to master branch for full code.

just add these permissions in AndroidManifest file and you are good to go.

    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>

<service android:name="com.asterinet.react.bgactions.RNBackgroundActionsTask" android:foregroundServiceType="shortService"/>

now hit command "npm install" to install node modules.

Then hit "npm run android" to run the project.
