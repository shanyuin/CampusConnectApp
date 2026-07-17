import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/env";
import {
  DEPARTMENT_OPTIONS,
  SECTION_OPTIONS,
  SEMESTER_OPTIONS,
  SUBJECT_OPTIONS,
  YEAR_OPTIONS,
} from "./facultySessionConfig";
import {
  buildSessionPayload,
  formatDateLabel,
  formatTimeLabel,
  getDefaultSessionFormState,
  validateSessionForm,
} from "./facultySessionUtils";

type Props = {
  token: string;
};

type PhotoKey = "photo1" | "photo2" | "photo3" | "photo4" | "photo5";
type PhotoState = Record<PhotoKey, { url: string | null; uploading: boolean }>;

const PHOTO_SECTIONS: { key: PhotoKey; label: string }[] = [
  { key: "photo1", label: "Student Photo 1" },
  { key: "photo2", label: "Student Photo 2" },
  { key: "photo3", label: "Student Photo 3" },
  { key: "photo4", label: "Student Photo 4" },
  { key: "photo5", label: "Student Photo 5" },
];

const initialPhotoState: PhotoState = {
  photo1: { url: null, uploading: false },
  photo2: { url: null, uploading: false },
  photo3: { url: null, uploading: false },
  photo4: { url: null, uploading: false },
  photo5: { url: null, uploading: false },
};

type DropdownProps = {
  id: string;
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  placeholder?: string;
};

function Dropdown({
  id,
  label,
  options,
  selectedValue,
  onSelect,
  openId,
  setOpenId,
  placeholder = "-- Select --",
}: DropdownProps) {
  const isOpen = openId === id;

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.heading}>{label}</Text>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setOpenId(isOpen ? null : id)}
        activeOpacity={0.7}
      >
        <Text style={selectedValue ? styles.selectedText : styles.placeholderText}>
          {selectedValue || placeholder}
        </Text>
        <Text style={styles.chevron}>{isOpen ? "^" : "v"}</Text>
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.optionsListOverlay}>
          <ScrollView nestedScrollEnabled>
            {options.map(option => {
              const isSelected = option === selectedValue;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => {
                    onSelect(option);
                    setOpenId(null);
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {isSelected ? <Text style={styles.checkmark}>Selected</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function FacultySessionForm({ token }: Props) {
  const [form, setForm] = useState(getDefaultSessionFormState());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoState>(initialPhotoState);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm(getDefaultSessionFormState());
    setOpenDropdownId(null);
    setPhotos(initialPhotoState);
  };

  const confirmReset = () => {
    Alert.alert("Reset Form", "Are you sure you want to clear all entered data?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetForm },
    ]);
  };

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const removePhoto = (key: PhotoKey) => {
    setPhotos(current => ({ ...current, [key]: { url: null, uploading: false } }));
  };

  const pickAndUpload = async (key: PhotoKey, source: "camera" | "library") => {
    if (Platform.OS === "web") {
      if (source === "camera") {
        Alert.alert("Not supported on web", "Camera capture is not available in the browser.");
        return;
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : null;
          if (!result) return;
          setPhotos(current => ({ ...current, [key]: { url: result, uploading: false } }));
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        source === "camera"
          ? "Please allow access to your camera."
          : "Please allow access to your photo library.",
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });

    if (result.canceled || !result.assets.length) {
      return;
    }

    setPhotos(current => ({
      ...current,
      [key]: { url: result.assets[0].uri, uploading: false },
    }));
  };

  const handleSubmit = async () => {
    const validationError = validateSessionForm(form);
    if (validationError) {
      Alert.alert("Missing info", validationError);
      return;
    }

    try {
      setLoading(true);
      const payload = buildSessionPayload(form);
      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      Object.values(photos).forEach((photo, index) => {
        if (!photo.url) return;
        formData.append("images", {
          uri: photo.url,
          name: `photo-${index + 1}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const response = await fetch(`${API_BASE_URL}/api/faculty/insert-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert("Error", responseJson?.message || `Submit failed (${response.status})`);
        return;
      }

      Alert.alert("Success", responseJson?.message || "Form submitted successfully!");
      resetForm();
    } catch (error) {
      Alert.alert(
        "Network Error",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const semesterOptions = (SEMESTER_OPTIONS[form.selectedYear] ?? []).map(option => option.label);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View>
            <Text style={styles.pageTitle}>Student Attendance</Text>
            <Text style={styles.pageSubtitle}>Please fill in the details below.</Text>
          </View>

          <Dropdown
            id="subject"
            label="Select Subject"
            options={SUBJECT_OPTIONS.map(option => option.label)}
            selectedValue={form.selectedSubject}
            onSelect={value => updateForm("selectedSubject", value)}
            openId={openDropdownId}
            setOpenId={setOpenDropdownId}
          />

          <Dropdown
            id="department"
            label="Select Department"
            options={DEPARTMENT_OPTIONS.map(option => option.label)}
            selectedValue={form.selectedDepartment}
            onSelect={value => updateForm("selectedDepartment", value)}
            openId={openDropdownId}
            setOpenId={setOpenDropdownId}
          />

          <View style={styles.columnRow}>
            <View style={styles.halfWidth}>
              <Dropdown
                id="year"
                label="Select Year"
                options={YEAR_OPTIONS.map(option => option.label)}
                selectedValue={form.selectedYear}
                onSelect={value =>
                  setForm(current => ({
                    ...current,
                    selectedYear: value,
                    selectedSemester: "",
                  }))
                }
                openId={openDropdownId}
                setOpenId={setOpenDropdownId}
              />
            </View>

            <View style={styles.halfWidth}>
              <Dropdown
                id="semester"
                label="Select Semester"
                options={semesterOptions}
                selectedValue={form.selectedSemester}
                onSelect={value => updateForm("selectedSemester", value)}
                openId={openDropdownId}
                setOpenId={setOpenDropdownId}
                placeholder={form.selectedYear ? "Semester" : "Select Year"}
              />
            </View>
          </View>

          <View style={styles.rowGroup}>
            <View style={styles.rowItem}>
              <Dropdown
                id="section"
                label="Select Section"
                options={SECTION_OPTIONS.map(option => option.label)}
                selectedValue={form.selectedSection}
                onSelect={value => updateForm("selectedSection", value)}
                openId={openDropdownId}
                setOpenId={setOpenDropdownId}
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.heading}>Batch (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Batch"
                placeholderTextColor="#888"
                value={form.batch}
                onChangeText={value => updateForm("batch", value)}
              />
            </View>
          </View>

          <View style={styles.rowGroup}>
            <View style={styles.rowItem}>
              <Text style={styles.heading}>Start Time</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setShowStartPicker(true)}>
                <View style={styles.selectBoxContent}>
                  <Ionicons name="time-outline" size={18} color="#666" style={styles.clockIcon} />
                  <Text style={form.startTime ? styles.selectedText : styles.placeholderText}>
                    {form.startTime ? formatTimeLabel(form.startTime) : "-- Select --"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.heading}>End Time</Text>
              <TouchableOpacity
                style={[styles.selectBox, !form.startTime && { opacity: 0.5 }]}
                onPress={() => {
                  if (form.startTime) setShowEndPicker(true);
                }}
              >
                <View style={styles.selectBoxContent}>
                  <Ionicons name="time-outline" size={18} color="#666" style={styles.clockIcon} />
                  <Text style={form.endTime ? styles.selectedText : styles.placeholderText}>
                    {form.endTime ? formatTimeLabel(form.endTime) : "Select End Time"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {showStartPicker && Platform.OS !== "web" ? (
            <DateTimePicker
              value={form.startTime || new Date()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(_, selectedDate) => {
                setShowStartPicker(false);
                if (!selectedDate) return;
                setForm(current => ({
                  ...current,
                  startTime: selectedDate,
                  endTime:
                    current.endTime && selectedDate >= current.endTime ? null : current.endTime,
                }));
                if (form.endTime && selectedDate >= form.endTime) {
                  Alert.alert(
                    "End Time Reset",
                    "Please select the End Time again because it must be after the Start Time.",
                  );
                }
              }}
            />
          ) : null}

          {showEndPicker && Platform.OS !== "web" ? (
            <DateTimePicker
              value={form.endTime || new Date()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(_, selectedDate) => {
                setShowEndPicker(false);
                if (!selectedDate) return;
                if (form.startTime && selectedDate <= form.startTime) {
                  Alert.alert("Invalid Time", "End Time must be later than Start Time.");
                  return;
                }
                updateForm("endTime", selectedDate);
              }}
            />
          ) : null}

          <Text style={styles.heading}>Select Date</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setShowDatePicker(true)}>
            <Text style={form.selectedDate ? styles.selectedText : styles.placeholderText}>
              {form.selectedDate ? formatDateLabel(form.selectedDate) : "-- Select Date --"}
            </Text>
            <Text style={styles.chevron}>Cal</Text>
          </TouchableOpacity>

          {showDatePicker && Platform.OS !== "web" ? (
            <DateTimePicker
              value={form.selectedDate || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) updateForm("selectedDate", selectedDate);
              }}
            />
          ) : null}

          <Text style={styles.heading}>Enter Location</Text>
          <View style={[styles.locationBox, isLocationFocused && styles.locationBoxFocused]}>
            <Text style={styles.locationIcon}>Loc</Text>
            <TextInput
              style={styles.locationInput}
              value={form.location}
              onChangeText={value => updateForm("location", value)}
              placeholder="Enter Location"
              placeholderTextColor="#999"
              onFocus={() => setIsLocationFocused(true)}
              onBlur={() => setIsLocationFocused(false)}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
            {form.location.length > 0 ? (
              <TouchableOpacity onPress={() => updateForm("location", "")}>
                <Text style={styles.clearIcon}>X</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.heading}>Upload Photos</Text>
          {PHOTO_SECTIONS.map(({ key, label }) => {
            const photo = photos[key];
            return (
              <View key={key} style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>{label}</Text>
                <View style={styles.uploadBox}>
                  {photo.uploading ? (
                    <ActivityIndicator size="small" />
                  ) : photo.url ? (
                    <>
                      <Image source={{ uri: photo.url }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeBadge}
                        onPress={() => removePhoto(key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.removeBadgeText}>Del</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.uploadPlaceholder}>No image</Text>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => pickAndUpload(key, "camera")}
                    disabled={photo.uploading}
                  >
                    <Text style={styles.smallButtonText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => pickAndUpload(key, "library")}
                    disabled={photo.uploading}
                  >
                    <Text style={styles.smallButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              disabled={loading}
              onPress={() => void handleSubmit()}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 60 },
  formCard: { borderWidth: 2, borderColor: "#7f1d1d", borderRadius: 12, padding: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#7f1d1d", marginTop: 20 },
  pageSubtitle: { fontSize: 14, marginTop: 4 },
  heading: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#7f1d1d" },
  dropdownContainer: { marginBottom: 8, position: "relative" },
  selectBox: {
    borderWidth: 1,
    borderColor: "#4d3e3e",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectBoxContent: { flexDirection: "row", alignItems: "center" },
  clockIcon: { marginRight: 6 },
  selectedText: { flex: 1, fontSize: 14, color: "#111" },
  placeholderText: { flex: 1, fontSize: 14, color: "#888" },
  chevron: { fontSize: 14, color: "#888" },
  optionsListOverlay: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    maxHeight: 220,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionRowSelected: { backgroundColor: "#eff6ff" },
  optionText: { fontSize: 15, color: "#111" },
  optionTextSelected: { color: "#2563eb", fontWeight: "600" },
  checkmark: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  columnRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  halfWidth: { flex: 1, marginHorizontal: 5 },
  rowGroup: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  rowItem: { flex: 1 },
  textInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 16, height: 50, fontSize: 16 },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "transparent",
  },
  locationBoxFocused: { borderColor: "#4A90E2", backgroundColor: "#FFFFFF" },
  locationIcon: { fontSize: 16, marginRight: 8 },
  locationInput: { flex: 1, fontSize: 16, color: "#222", padding: 0 },
  clearIcon: { fontSize: 14, color: "#999", paddingHorizontal: 4 },
  uploadSection: { marginBottom: 16 },
  uploadLabel: { fontSize: 14, fontWeight: "500", color: "#7f1d1d", marginBottom: 6 },
  uploadBox: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#fafafa",
    position: "relative",
  },
  uploadPlaceholder: { color: "#888", fontSize: 12 },
  previewImage: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  removeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", lineHeight: 11 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  smallButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#7f1d1d",
    alignItems: "center",
    marginHorizontal: 4,
  },
  smallButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  buttonGroup: { flexDirection: "row", gap: 12, marginTop: 24 },
  submitButton: {
    flex: 1,
    backgroundColor: "#7f1d1d",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  resetButton: {
    flex: 1,
    backgroundColor: "#c7cdda",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  resetButtonText: { color: "#374151", fontWeight: "600", fontSize: 16 },
});
