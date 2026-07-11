import React, { useState } from 'react';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';

const YEAR_OPTIONS: string[] = [
  'First Year', 'Second Year', 'Third Year', 'Fourth Year'
];

const DEPARTMENT_OPTIONS: string[] = [
  'Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical'
];

const SEMESTER_OPTIONS: Record<string, string[]> = {
  'First Year': ['Semester 1', 'Semester 2'],
  'Second Year': ['Semester 3', 'Semester 4'],
  'Third Year': ['Semester 5', 'Semester 6'],
  'Fourth Year': ['Semester 7', 'Semester 8'],
};

const SECTION_OPTIONS: string[] = [
  'Section A', 'Section B', 'Section C', 'Section D'
];

// moved `batch` state into the component below








const SUBJECT_OPTIONS: string[] = [
  'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'Mechanics'
];

type PhotoKey = 'photo1' | 'photo2' | 'photo3' | 'photo4' | 'photo5';

const PHOTO_SECTIONS: { key: PhotoKey; label: string }[] = [
  { key: 'photo1', label: 'Student Photo 1' },
  { key: 'photo2', label: 'Student Photo 2' },
  { key: 'photo3', label: 'Student Photo 3' },
  { key: 'photo4', label: 'Student Photo 4' },
   { key: 'photo5', label: 'Student Photo 5' },

];

// Note: Cloudinary removed. Images (if picked) are kept as local URIs
// and not uploaded from this component.

// ---------- Types for state ----------
type PhotoState = Record<PhotoKey, { url: string | null; uploading: boolean }>;

const initialPhotoState: PhotoState = {
  photo1: { url: null, uploading: false },
  photo2: { url: null, uploading: false },
  photo3: { url: null, uploading: false },
  photo4: { url: null, uploading: false },
  photo5: { url: null, uploading: false },
};

// ---------- Reusable Inline Dropdown ----------
interface DropdownProps {
  id: string;
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  placeholder?: string;
}

function Dropdown({
  id,
  label,
  options,
  selectedValue,
  onSelect,
  openId,
  setOpenId,
  placeholder = '-- Select --',
}: DropdownProps) {
  const isOpen = openId === id;

  const toggleOpen = () => {
    setOpenId(isOpen ? null : id);
  };

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.heading}>{label}</Text>

      <TouchableOpacity style={styles.selectBox} onPress={toggleOpen} activeOpacity={0.7}>
        <Text style={selectedValue ? styles.selectedText : styles.placeholderText}>
          {selectedValue || placeholder}
        </Text>
        <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.optionsListOverlay}>
          <ScrollView nestedScrollEnabled>
            {options.map((item) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                onPress={() => {
                  onSelect(item);
                  setOpenId(null);
                }}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {item}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function StudentAttendanceComponent() {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [batch, setBatch] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoState>(initialPhotoState);

 



  // ---------- Add these near your other state ----------
const [startTime, setStartTime] = useState<Date | null>(null);
const [endTime, setEndTime] = useState<Date | null>(null);
const [showStartPicker, setShowStartPicker] = useState(false);
const [showEndPicker, setShowEndPicker] = useState(false);

const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [showDatePicker, setShowDatePicker] = useState(false);
 const [isFocused, setIsFocused] = useState<boolean>(false);
 const [location, setLocation] = useState<string>('');

const handleReset = () => {
  Alert.alert(
    'Reset Form',
    'Are you sure you want to clear all entered data?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setSelectedYear('');
          setSelectedDepartment('');
          setSelectedSemester('');
          setSelectedSection('');
          setSelectedSubject('');
          setBatch('');
          setLocation('');

          setSelectedDate(null);
          setStartTime(null);
          setEndTime(null);
          setOpenDropdownId(null);
          setPhotos(initialPhotoState);
        },
      },
    ]
  );
};

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }); // e.g. "04 Jul 2026"
};

const onChangeDate = (event: any, selected?: Date) => {
  setShowDatePicker(false);
  if (selected) setSelectedDate(selected);
};

const formatTime = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const onChangeStartTime = (_event: any, selectedDate?: Date) => {
  setShowStartPicker(false);

  if (!selectedDate) return;

  setStartTime(selectedDate);

  if (endTime && selectedDate >= endTime) {
    setEndTime(null);
    Alert.alert(
      'End Time Reset',
      'Please select the End Time again because it must be after the Start Time.'
    );
  }
};

const onChangeEndTime = (_event: any, selectedDate?: Date) => {
  setShowEndPicker(false);

  if (!selectedDate) return;

  if (startTime && selectedDate <= startTime) {
    Alert.alert(
      'Invalid Time',
      'End Time must be later than Start Time.'
    );
    return;
  }

  setEndTime(selectedDate);
};


  

  const pickAndUpload = async (key: PhotoKey, source: 'camera' | 'library') => {
    if (Platform.OS === 'web') {
      if (source === 'camera') {
        Alert.alert('Not supported on web', 'Camera capture is not available in the browser.');
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = false;

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const uri = typeof reader.result === 'string' ? reader.result : null;
          if (!uri) {
            return;
          }
          setPhotos((prev) => ({ ...prev, [key]: { url: uri, uploading: false } }));
        };
        reader.readAsDataURL(file);
      };

      input.click();
      return;
    }

    let result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerSuccessResult | null = null;

    if (source === 'camera') {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        Alert.alert('Permission required', 'Please allow access to your camera.');
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      } as ImagePicker.ImagePickerOptions);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      } as ImagePicker.ImagePickerOptions);
    }

    if (!result || (result as any).canceled || !(result as any).assets || (result as any).assets.length === 0) return;

    const uri = (result as any).assets[0].uri;

    // Save local URI (no upload to Cloudinary anymore)
    setPhotos((prev) => ({ ...prev, [key]: { url: uri, uploading: false } }));
  };

  const removePhoto = (key: PhotoKey) => {
    setPhotos((prev) => ({ ...prev, [key]: { url: null, uploading: false } }));
  };

  const handleSubmit = async () => {
    console.log('[StudentAttendance] Submit button pressed');

//     if (!selectedYear) {
//       Alert.alert('Missing info', 'Please select a year.');
//       return;
//     }
//     if (!selectedDepartment) {
//       Alert.alert('Missing info', 'Please select a department.');
//       return;
//     }
//     if (!selectedSemester) {
//       Alert.alert('Missing info', 'Please select a semester.');
//       return;
//     }
//     if (!selectedSection) {
//       Alert.alert('Missing info', 'Please select a section.');
//       return;
//     }

//     if(!location) {
//       Alert.alert('Missing info', 'Please enter a location.');
//       return;
//     }
//     if (!selectedSubject) {
//       Alert.alert('Missing info', 'Please select a subject.');
//       return;
//     }

//     if (!selectedDate) {
//   Alert.alert('Missing info', 'Please select a date.');
//   return;
// }



//     if (!startTime || !endTime) {
//   Alert.alert('Missing info', 'Please select start and end time.');
//   return;
// }
// if (endTime <= startTime) {
//   Alert.alert('Invalid time', 'End time must be after start time.');
//   return;
//}
    const payload = {
    // Hardcoded values for testing
    faculty_erpid: "FAC001",
    department_id: 1,
    subject_id: 3,
    division_id: "comp-2-a",

    // Values from frontend
    division: "A",

    year:
      selectedYear === "First Year" ? 1 :
      selectedYear === "Second Year" ? 2 :
      selectedYear === "Third Year" ? 3 : 4,

    semester:
      selectedSemester === "Semester 1" ? 1 :
      selectedSemester === "Semester 2" ? 2 :
      selectedSemester === "Semester 3" ? 3 :
      selectedSemester === "Semester 4" ? 4 :
      selectedSemester === "Semester 5" ? 5 :
      selectedSemester === "Semester 6" ? 6 :
      selectedSemester === "Semester 7" ? 7 : 8,

    batch,
    location,

    session_date: selectedDate?.toISOString().split("T")[0],

    start_time: startTime?.toISOString(),
    end_time: endTime?.toISOString(),

    cloudinary_prefix: "test-folder",
  };
    console.log('[StudentAttendance] Submitting payload:', payload);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert('Submit clicked. Check the browser console for the payload.');
    }

    const token = await AsyncStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/faculty/insert-session", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}`},
        body: JSON.stringify(payload),
      });
      const resJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert('Error', resJson?.message || `Submit failed (${res.status})`);
        return;
      }

      Alert.alert('Success', resJson?.message || 'Form submitted!');
    } catch (err) {
      console.log(err);
      Alert.alert('Network error', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (

     <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"

      
      
    >

      <View style={styles.formCard}>
  
     <View >
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#7f1d1d', marginTop: 20 }}>Student Attendance</Text>
        <Text style={{ fontSize: 14, color: '', marginTop: 4 }}>Please fill in the details below.</Text>
      </View>


      <Dropdown
        id="subject"
        label="Select Subject"
        options={SUBJECT_OPTIONS}
        selectedValue={selectedSubject}
        onSelect={setSelectedSubject}
        openId={openDropdownId}
        setOpenId={setOpenDropdownId}
      />

      <Dropdown
        id="department"
        label="Select Department"
        options={DEPARTMENT_OPTIONS}
        selectedValue={selectedDepartment}
        onSelect={setSelectedDepartment}
        openId={openDropdownId}
        setOpenId={setOpenDropdownId}
      />


       {/* <Dropdown
        id="Year"
        label="Select Year"
        options={YEAR_OPTIONS}
        selectedValue={selectedYear}
      onSelect={(value) => {
  setSelectedYear(value);
  setSelectedSemester(''); // Reset semester when class changes
}}
        openId={openDropdownId}
        setOpenId={setOpenDropdownId}
      />





        <Dropdown
  id="semester"
  label="Select Semester"
  options={SEMESTER_OPTIONS[selectedYear] || []}
  selectedValue={selectedSemester}
  onSelect={setSelectedSemester}
  openId={openDropdownId}
  setOpenId={setOpenDropdownId}
  placeholder={
    selectedYear ? '-- Select Semester --' : 'Select year first'
  }
/> */}


<View style={styles.columnRow}>
  <View style={styles.halfWidth}>
    <Dropdown
      id="Year"
      label="Select Year"
      options={YEAR_OPTIONS}
      selectedValue={selectedYear}
      onSelect={(value) => {
        setSelectedYear(value);
        setSelectedSemester('');
      }}
      openId={openDropdownId}
      setOpenId={setOpenDropdownId}
    />
  </View>

  <View style={styles.halfWidth}>
    <Dropdown
      id="semester"
      label="Select Semester"
      options={SEMESTER_OPTIONS[selectedYear] || []}
      selectedValue={selectedSemester}
      onSelect={setSelectedSemester}
      openId={openDropdownId}
      setOpenId={setOpenDropdownId}
      placeholder={
  selectedYear ? 'Semester' : 'Select Year'
}
    />
  </View>
</View>
       
     

      

      {/* <Dropdown
        id="semester"
        label="Select Semester"
        options={SEMESTER_OPTIONS}
        selectedValue={selectedSemester}
        onSelect={setSelectedSemester}
        openId={openDropdownId}
        setOpenId={setOpenDropdownId}
      /> */}

      <View style={styles.rowText}>
  <View style={styles.rowItem}>
    <Dropdown
      id="section"
      label="Select Section"
      options={SECTION_OPTIONS}
      selectedValue={selectedSection}
      onSelect={setSelectedSection}
      openId={openDropdownId}
      setOpenId={setOpenDropdownId}
    />
  </View>

  <View style={styles.rowItem}>
    <Text style={styles.heading}>Batch (Optional) </Text>
    <TextInput
      style={styles.textInput}
      placeholder="Enter Batch"
      value={batch}
      onChangeText={setBatch}
        placeholderTextColor="#888"
    />
  </View>
</View>

<View style={styles.RowDate}>
  <View style={styles.RowItemDate}>
    <Text style={styles.heading}>Start Time</Text>
    <TouchableOpacity
      style={styles.selectBox}
      onPress={() => setShowStartPicker(true)}
      activeOpacity={0.7}
    >
      <View style={styles.selectBoxContent}>
        <Ionicons name="time-outline" size={18} color="#666" style={styles.clockIcon} />
        <Text style={startTime ? styles.selectedText : styles.placeholderText}>
          {startTime ? formatTime(startTime) : '-- Select --'}
        </Text>
      </View>
    </TouchableOpacity>
  </View>

  <View style={styles.RowItemDate}>
    <Text style={styles.heading}>End Time</Text>
    <TouchableOpacity
      style={[
        styles.selectBox,
        !startTime && { opacity: 0.5 }
      ]}
      onPress={() => startTime && setShowEndPicker(true)}
      activeOpacity={0.7}
    >
      <View style={styles.selectBoxContent}>
        <Ionicons name="time-outline" size={18} color="#666" style={styles.clockIcon} />
        <Text style={endTime ? styles.selectedText : styles.placeholderText}>
          {endTime ? formatTime(endTime) : 'Select End Time'}
        </Text>
      </View>
    </TouchableOpacity>
  </View>
</View>

{showStartPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={startTime || new Date()}
    mode="time"
    is24Hour={false}
    display="default"
    onChange={onChangeStartTime}
  />
)}

{showEndPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={endTime || new Date()}
    mode="time"
    is24Hour={false}
    display="default"
    onChange={onChangeEndTime}
  />
)}


<Text style={styles.heading}>Select Date</Text>
<TouchableOpacity
  style={styles.selectBox}
  onPress={() => setShowDatePicker(true)}
  activeOpacity={0.7}
>
  <Text style={selectedDate ? styles.selectedText : styles.placeholderText}>
    {selectedDate ? formatDate(selectedDate) : '-- Select Date --'}
  </Text>
  <Text style={styles.chevron}>📅</Text>
</TouchableOpacity>

{showDatePicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={selectedDate || new Date()}
    mode="date"
    display="default"
    onChange={onChangeDate}
    minimumDate={new Date()}
  />
)}

      <Text style={styles.heading}>Enter Location</Text>
     <View style={[styles.containerBox, isFocused && styles.containerFocused]}>
      <Text style={styles.icon}>📍</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter Location"
        placeholderTextColor="#999"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="search"
      />
      {location?.length > 0 && (
        <TouchableOpacity onPress={() => setLocation('')}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>



      <Text style={styles.heading}>Upload Photos</Text>
       

    {PHOTO_SECTIONS.map(({ key, label }) => {
  const photo = photos[key] ?? { url: null, uploading: false };
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
              <Text style={styles.removeBadgeText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.uploadPlaceholder}>No image</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton} onPress={() => pickAndUpload(key, 'camera')} disabled={photo.uploading}>
          <Text style={styles.smallButtonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={() => pickAndUpload(key, 'library')} disabled={photo.uploading}>
          <Text style={styles.smallButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
})}


    

      {/* <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity> */}

      <View style={styles.buttonGroup}>

    <TouchableOpacity
      style={styles.submitButton}
      onPress={() => {
        console.log('[StudentAttendance] TouchableOpacity pressed');
        void handleSubmit();
      }}
    >
      <Text style={styles.submitButtonText}>Submit</Text>
    </TouchableOpacity>

  <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
    <Text style={styles.resetButtonText}>Reset</Text>
  </TouchableOpacity>

 
</View>

</View>


    </ScrollView>

   
  </View>

  

    
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: '#fff',
  
},
 
  content: {
  padding: 20,
    paddingBottom: 60,
  },
  uploadSection: {
  marginBottom: 16,
},
uploadLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#7f1d1d',
  marginBottom: 6,
},
formCard: {
  borderWidth: 2,
  borderColor: '#7f1d1d',
  // marginBottom:12,
  // marginTop: 12,
  // marginLeft:8,
  // marginRight:8,
  borderRadius: 12,
  padding: 16,
},
uploadBox: {
  width: '100%',
  height: 70,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  borderStyle: 'dashed',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: '#fafafa',
  position: 'relative',
},
uploadPlaceholder: {
  color: '#888',
  fontSize: 12,
},
previewImage: {
  width: '100%',
  height: '100%',
},


removeBadge: {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: '#ef4444',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#fff',
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
},
removeBadgeText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: '700',
  lineHeight: 11,
},
buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 8,
},
smallButton: {
  flex: 1,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: '#7f1d1d',
  alignItems: 'center',
  marginHorizontal: 4,
},
smallButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 13,
},


  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: '#7f1d1d',
     

  },
  dropdownContainer: {
    marginBottom: 8,
    position: 'relative',
    borderColor: '#475569'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  RowDate: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 8,
  gap: 12,
},
RowItemDate: {
  flex: 1,
},

selectBoxContent: {
  flexDirection: 'row',
  alignItems: 'center',
},
clockIcon: {
  marginRight: 6,
},


  rowText: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10, // If your React Native version doesn't support gap, remove it and use marginHorizontal below.
},

rowItem: {
  flex: 1,
},


 




containerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 4,
  },

selectedText: {
  flex: 1,
  fontSize: 14,
  color: '#111',
},

placeholderText: {
  flex: 1,
  fontSize: 14,
  color: '#888',
},

buttonGroup: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 24,
},
resetButton: {
  flex: 1,
  backgroundColor: '#c7cdda',
  paddingVertical: 14,
  borderRadius: 10,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#d1d5db',
},
resetButtonText: {
  color: '#374151',
  fontWeight: '600',
  fontSize: 16,
},

textInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 10,
  paddingHorizontal: 16,
  height: 50,
  // backgroundColor: '#fafafa',
 
  fontSize: 16,
},

//   rowText: {
//   flexDirection: 'row',    

   
//      alignItems: 'flex-start',
// },
// rowItem: {
//   flex: 1,
// },
// textInput: {
//   borderWidth: 1,
//   borderColor: '#ccc',
//   borderRadius: 10,
//   paddingVertical: 14,
//   paddingHorizontal: 16,
//   backgroundColor: '#fafafa',
//   fontSize: 16,
//   color: '#111',
// },
  selectBox: {
    borderWidth: 1,
    borderColor: '#4d3e3e',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  chevron: {
    fontSize: 14,
    color: '#888',
  },
  optionsList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#fff',
    maxHeight: 220,
    overflow: 'hidden',
  },
  optionsListOverlay: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    maxHeight: 220,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  columnRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

halfWidth: {
  flex: 1,
  marginHorizontal: 5,
},

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionRowSelected: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 15,
    color: '#111',
  },
  optionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 16,
  },
 
 

 
 submitButton: {
  flex: 1,
  backgroundColor: '#7f1d1d',
  paddingVertical: 14,
  borderRadius: 10,
  alignItems: 'center',
},
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});