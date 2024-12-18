import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [location, setLocation] = useState({latitude: null, longitude: null});
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    const initializeState = async () => {
      Alert.alert(
        'Location Permission',
        'This app requires location permissions to track your location. Do you want to grant permissions?',
        [
          {
            text: 'No',
            onPress: () => console.log('User denied location permissions.'),
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              const hasPermission = await requestLocationPermission();
              if (!hasPermission) {
                Alert.alert(
                  'Permission Denied',
                  'Please enable location permissions in your device settings to use this feature.',
                );
              }
            },
          },
        ],
      );

      const savedTrackingState = await AsyncStorage.getItem('trackingState');
      if (savedTrackingState === 'true') {
        setTracking(true);
        startBackgroundService();
      }
    };

    initializeState();

    return () => {
      Geolocation.stopObserving();
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const fineLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        const backgroundLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );

        if (
          fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED &&
          backgroundLocationGranted === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Location permissions granted.');
          return true;
        } else {
          console.warn('Location permissions denied.');
          return false;
        }
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setLocation({latitude, longitude});
          resolve({latitude, longitude});
        },
        error => {
          Alert.alert('Error', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000,
        },
      );
    });
  };

  const uploadLocation = async (latitude, longitude) => {
    try {
      const response = await axios({
        method: 'POST',
        url: `${baseUrl}/upload-location`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          lat: latitude,
          long: longitude,
        },
      });
      console.log('Location uploaded successfully:', response.data);
    } catch (error) {
      console.log('Error', error);
      Alert.alert('Error', 'Failed to upload location');
    }
  };

  const fetchLocation = async () => {
    try {
      const response = await axios({
        method: 'GET',
        url: `${baseUrl}/get-all-locations`,
      });
      console.log('Fetch all locations success: ', response.data);
    } catch (error) {
      console.log('Fetching location error: ', error);
    }
  };

  const deleteAllLocations = async () => {
    try {
      const response = await axios({
        method: 'DELETE',
        url: `${baseUrl}/delete-all-locations`,
      });
      console.log('Delete all locations successfully: ', response.data);
    } catch (error) {
      console.log('Delete location error: ', error);
    }
  };

  const backgroundTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    while (BackgroundService.isRunning()) {
      try {
        const {latitude, longitude} = await getLocation();
        console.log(`Background Location: ${latitude}, ${longitude}`);
        await uploadLocation(latitude, longitude);
      } catch (error) {
        console.error('Background Task Error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const options = {
    taskName: 'Location Tracking',
    taskTitle: 'Tracking Your Location',
    taskDesc: 'Running in background',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: 'white',
    parameters: {
      delay: 15000,
    },
  };

  const startBackgroundService = async () => {
    try {
      await BackgroundService.start(backgroundTask, options);
      setTracking(true);
      await AsyncStorage.setItem('trackingState', 'true');
    } catch (error) {
      console.error('Failed to start background service:', error);
    }
  };

  const stopBackgroundService = async () => {
    try {
      await BackgroundService.stop();
      setTracking(false);
      await AsyncStorage.setItem('trackingState', 'false');
    } catch (error) {
      console.error('Failed to stop background service:', error);
    }
  };

  const toggleTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use this feature.',
      );
      return;
    }

    if (!tracking) {
      startBackgroundService();
    } else {
      stopBackgroundService();
    }
  };

  return (
    <View style={styles.parentContainer}>
      <Text style={styles.textStyle}>
        Latitude: {location.latitude || 'N/A'}
      </Text>
      <Text style={styles.textStyle}>
        Longitude: {location.longitude || 'N/A'}
      </Text>
      <View>
        <Button
          title={tracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={toggleTracking}
        />
      </View>

      <View style={styles.buttonStyle}>
        <Button title={'Fetch Location'} onPress={fetchLocation} />
      </View>

      <View style={styles.buttonStyle}>
        <Button title={'Delete Location'} onPress={deleteAllLocations} />
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    marginBottom: 10,
  },
  buttonStyle: {
    marginTop: 12,
  },
});
