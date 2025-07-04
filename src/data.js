import { ref } from 'vue';

export const originalColumns = [
    {key: 'Patient', label: 'Patient'},
    {key: 'Age', label: 'Age'}, 
    {key: 'BloodPressure', label: 'Blood Pressure'},
    {key: 'HeartRate', label: 'Heart Rate'},
    {key: 'BMI', label: 'BMI'},
    {key: 'Cholesterol', label: 'Cholesterol'},
    {key: 'FitnessScore', label: 'Fitness Score'}
  ];

  export const originalRows = [
  { Patient: 'Patient A', Age: 45, BloodPressure: 120, HeartRate: 72, BMI: 25, Cholesterol: 200, FitnessScore: 90 },
  { Patient: 'Patient B', Age: 48, BloodPressure: 125, HeartRate: 75, BMI: 26, Cholesterol: 210, FitnessScore: 85 },
  { Patient: 'Patient C', Age: 51, BloodPressure: 130, HeartRate: 78, BMI: 27, Cholesterol: 220, FitnessScore: 80 },
  { Patient: 'Patient D', Age: 54, BloodPressure: 135, HeartRate: 81, BMI: 28, Cholesterol: 230, FitnessScore: 75 },
  { Patient: 'Patient E', Age: 57, BloodPressure: 140, HeartRate: 84, BMI: 29, Cholesterol: 240, FitnessScore: 70 },
  { Patient: 'Patient F', Age: 70, BloodPressure: 180, HeartRate: 60, BMI: 35, Cholesterol: 800, FitnessScore: 50 }
  ];

  export const columnsStudent = ref([
    {key: 'Name', label: 'Name'},
    {key: 'Maths', label: 'Maths'}, 
    {key: 'English', label: 'English'},
    {key: 'PE', label: 'PE'},
    {key: 'Art', label: 'Art'},
    {key: 'History', label: 'History'},
    {key: 'IT', label: 'IT'},
    {key: 'Biology', label: 'Biology'},
    {key: 'German', label: 'German'}
  ]);

  export const rowsStudent = ref([
  { Name: 'Adrian', Maths: 95, English: 24, PE: 82, Art: 49, History: 58, IT: 85, Biology: 21, German: 24 },
  { Name: 'Amelia', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 },
  { Name: 'Patient A', Maths: 45, English: 120, PE: 72, Art: 25, History: 200, IT: 85, Biology: 21, German: 24 }
  ]);
