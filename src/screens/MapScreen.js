import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../services/api';
import { COLORS, FONT_SIZES, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tempLocation, setTempLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [serviceType, setServiceType] = useState('charger');
  const [hourlyRate, setHourlyRate] = useState('');
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    loadLocation();
    loadServices();
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setLocation({
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      setLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await serviceAPI.getAllServices();
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleMapPickerPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setTempLocation(coordinate);
  };

  const handleConfirmLocation = async () => {
    if (!tempLocation) {
      Alert.alert('Error', 'Please tap on the map to select a location');
      return;
    }

    // Reverse geocode to get address
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      });

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        setLocationAddress(addr);
        setSelectedLocation(tempLocation);
        setShowMapPicker(false);
      } else {
        Alert.alert('Error', 'Could not get address for this location');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert('Error', 'Could not get address for this location');
    }
  };

  const handleAddService = () => {
    setShowAddModal(true);
    setSelectedLocation(null);
    setTempLocation(null);
    setLocationAddress(null);
    setHourlyRate('');
  };

  const handleSaveService = async () => {
    if (!selectedLocation || !locationAddress) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    setSavingService(true);

    try {
      // Format coordinates to match backend validation (must have 1-8 decimal places)
      const formatCoordinate = (coord) => {
        return coord.toFixed(6); // Use 6 decimal places for GPS precision
      };

      const serviceData = {
        serviceType: serviceType,
        status: 'active',
        address: `${locationAddress.street || ''} ${locationAddress.streetNumber || ''}`.trim() || locationAddress.name || 'Unknown Address',
        city: locationAddress.city || locationAddress.subregion || '',
        state: locationAddress.region || '',
        postalCode: locationAddress.postalCode || '',
        country: locationAddress.country || '',
        latitude: formatCoordinate(selectedLocation.latitude),
        longitude: formatCoordinate(selectedLocation.longitude),
        hourlyRate: hourlyRate,
      };

      const response = await serviceAPI.addService(serviceData);

      if (response.success) {
        Alert.alert('Success', 'Service added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowAddModal(false);
              loadServices();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add service. Please try again.'
      );
    } finally {
      setSavingService(false);
    }
  };

  const handleRefresh = () => {
    loadLocation();
    loadServices();
  };

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Provider Map</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color={COLORS.yellow} />
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {services.map((service) => (
          <Marker
            key={service.serviceId}
            coordinate={{
              latitude: parseFloat(service.latitude),
              longitude: parseFloat(service.longitude),
            }}
          >
            <View
              style={[
                styles.markerContainer,
                {
                  backgroundColor:
                    service.serviceType === 'parking' ? COLORS.parking : COLORS.charging,
                },
              ]}
            >
              <Text style={styles.markerText}>
                {service.serviceType === 'parking' ? 'P' : 'C'}
              </Text>
            </View>
          </Marker>
        ))}

        {selectedLocation && showAddModal && (
          <Marker coordinate={selectedLocation} pinColor={COLORS.yellow} />
        )}
      </MapView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
        <Ionicons name="add" size={32} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Add Service Modal */}
      <Modal
        visible={showAddModal && !showMapPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.instructionText}>
                {selectedLocation
                  ? 'Service location selected. Complete the details below:'
                  : 'Select a location on the map for your service'}
              </Text>

              {/* Select Location Button */}
              {!selectedLocation && (
                <TouchableOpacity
                  style={styles.selectLocationButton}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Ionicons name="location" size={24} color={COLORS.yellow} style={styles.locationIcon} />
                  <Text style={styles.selectLocationText}>Select Location on Map</Text>
                </TouchableOpacity>
              )}

              {locationAddress && selectedLocation && (
                <View style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressLabel}>Selected Location:</Text>
                    <TouchableOpacity
                      onPress={() => setShowMapPicker(true)}
                      style={styles.changeButton}
                    >
                      <Ionicons name="pencil" size={18} color={COLORS.yellow} />
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addressText}>
                    {`${locationAddress.street || ''} ${locationAddress.streetNumber || ''}`.trim() ||
                      locationAddress.name ||
                      'Unknown Address'}
                  </Text>
                  <Text style={styles.addressSubtext}>
                    {locationAddress.city}, {locationAddress.region} {locationAddress.postalCode}
                  </Text>
                  <Text style={styles.addressSubtext}>{locationAddress.country}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Service Type</Text>
                <View style={styles.serviceTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.serviceTypeButton,
                      serviceType === 'charger' && styles.serviceTypeButtonActive,
                    ]}
                    onPress={() => setServiceType('charger')}
                  >
                    <Text
                      style={[
                        styles.serviceTypeText,
                        serviceType === 'charger' && styles.serviceTypeTextActive,
                      ]}
                    >
                      Charger
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.serviceTypeButton,
                      serviceType === 'parking' && styles.serviceTypeButtonActive,
                    ]}
                    onPress={() => setServiceType('parking')}
                  >
                    <Text
                      style={[
                        styles.serviceTypeText,
                        serviceType === 'parking' && styles.serviceTypeTextActive,
                      ]}
                    >
                      Parking
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hourly Rate ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter hourly rate"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!selectedLocation || savingService) && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveService}
                disabled={!selectedLocation || savingService}
              >
                {savingService ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Service</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.mapPickerContainer}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

          {/* Map Picker Header */}
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity
              onPress={() => setShowMapPicker(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.yellow} />
            </TouchableOpacity>
            <Text style={styles.mapPickerTitle}>Select Location</Text>
            <View style={styles.backButton} />
          </View>

          {/* Full Screen Map */}
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.fullMap}
            initialRegion={selectedLocation || location}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={handleMapPickerPress}
          >
            {tempLocation && (
              <Marker
                coordinate={tempLocation}
                draggable
                onDragEnd={handleMapPickerPress}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={48} color={COLORS.yellow} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Instructions */}
          <View style={styles.mapPickerInstructions}>
            <Text style={styles.instructionTitle}>
              {tempLocation ? 'Drag the pin to adjust location' : 'Tap on the map to place a pin'}
            </Text>
          </View>

          {/* Confirm Button */}
          <View style={styles.mapPickerFooter}>
            <TouchableOpacity
              style={[styles.confirmButton, !tempLocation && styles.confirmButtonDisabled]}
              onPress={handleConfirmLocation}
              disabled={!tempLocation}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.yellow,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  markerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.yellow,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  instructionText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  addressText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  addressSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  serviceTypeButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  serviceTypeButtonActive: {
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.cardBackground,
  },
  serviceTypeText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  serviceTypeTextActive: {
    color: COLORS.yellow,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.yellow,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.yellow,
    marginBottom: SPACING.lg,
  },
  locationIcon: {
    marginRight: SPACING.sm,
  },
  selectLocationText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.yellow,
    fontWeight: 'bold',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.yellow,
    fontWeight: '600',
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  mapPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
    width: 40,
  },
  mapPickerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.yellow,
  },
  fullMap: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerInstructions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 80,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  instructionTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  mapPickerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.yellow,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
});
