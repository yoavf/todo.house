import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Schedule, ScheduleFrequency } from '../types/Task';

interface SchedulePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: Schedule) => void;
  initialSchedule?: Schedule;
}

export function SchedulePicker({ visible, onClose, onSave, initialSchedule }: SchedulePickerProps) {
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    initialSchedule?.frequency || ScheduleFrequency.WEEKLY
  );
  const [interval, setInterval] = useState<number>(initialSchedule?.interval || 1);

  const handleSave = () => {
    const schedule: Schedule = {
      frequency,
      interval,
    };
    onSave(schedule);
    onClose();
  };

  const handleClear = () => {
    onSave(undefined);
    onClose();
  };

  const renderIntervalOptions = () => {
    const options = [];
    const maxInterval = frequency === ScheduleFrequency.YEARLY ? 5 : 12;
    
    for (let i = 1; i <= maxInterval; i++) {
      options.push(
        <TouchableOpacity
          key={i}
          style={[styles.intervalOption, interval === i && styles.selectedIntervalOption]}
          onPress={() => setInterval(i)}
        >
          <Text style={[styles.intervalText, interval === i && styles.selectedIntervalText]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return options;
  };

  const getIntervalLabel = () => {
    switch (frequency) {
      case ScheduleFrequency.DAILY:
        return interval === 1 ? 'day' : 'days';
      case ScheduleFrequency.WEEKLY:
        return interval === 1 ? 'week' : 'weeks';
      case ScheduleFrequency.MONTHLY:
        return interval === 1 ? 'month' : 'months';
      case ScheduleFrequency.YEARLY:
        return interval === 1 ? 'year' : 'years';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Schedule</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Repeat every</Text>
          
          <View style={styles.intervalContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.intervalOptions}>
                {renderIntervalOptions()}
              </View>
            </ScrollView>
            <Text style={styles.intervalLabel}>{getIntervalLabel()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Frequency</Text>
          
          <View style={styles.frequencyOptions}>
            <TouchableOpacity
              style={[styles.frequencyOption, frequency === ScheduleFrequency.DAILY && styles.selectedFrequencyOption]}
              onPress={() => setFrequency(ScheduleFrequency.DAILY)}
            >
              <Ionicons
                name={frequency === ScheduleFrequency.DAILY ? "sunny" : "sunny-outline"}
                size={24}
                color={frequency === ScheduleFrequency.DAILY ? "#007bff" : "#6c757d"}
              />
              <Text style={[styles.frequencyText, frequency === ScheduleFrequency.DAILY && styles.selectedFrequencyText]}>
                Daily
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.frequencyOption, frequency === ScheduleFrequency.WEEKLY && styles.selectedFrequencyOption]}
              onPress={() => setFrequency(ScheduleFrequency.WEEKLY)}
            >
              <Ionicons
                name={frequency === ScheduleFrequency.WEEKLY ? "calendar" : "calendar-outline"}
                size={24}
                color={frequency === ScheduleFrequency.WEEKLY ? "#007bff" : "#6c757d"}
              />
              <Text style={[styles.frequencyText, frequency === ScheduleFrequency.WEEKLY && styles.selectedFrequencyText]}>
                Weekly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.frequencyOption, frequency === ScheduleFrequency.MONTHLY && styles.selectedFrequencyOption]}
              onPress={() => setFrequency(ScheduleFrequency.MONTHLY)}
            >
              <Ionicons
                name={frequency === ScheduleFrequency.MONTHLY ? "calendar" : "calendar-outline"}
                size={24}
                color={frequency === ScheduleFrequency.MONTHLY ? "#007bff" : "#6c757d"}
              />
              <Text style={[styles.frequencyText, frequency === ScheduleFrequency.MONTHLY && styles.selectedFrequencyText]}>
                Monthly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.frequencyOption, frequency === ScheduleFrequency.YEARLY && styles.selectedFrequencyOption]}
              onPress={() => setFrequency(ScheduleFrequency.YEARLY)}
            >
              <Ionicons
                name={frequency === ScheduleFrequency.YEARLY ? "calendar" : "calendar-outline"}
                size={24}
                color={frequency === ScheduleFrequency.YEARLY ? "#007bff" : "#6c757d"}
              />
              <Text style={[styles.frequencyText, frequency === ScheduleFrequency.YEARLY && styles.selectedFrequencyText]}>
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <Ionicons name="repeat" size={20} color="#28a745" style={styles.summaryIcon} />
            <Text style={styles.summaryText}>
              This task will repeat every {interval} {getIntervalLabel()}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  intervalOptions: {
    flexDirection: 'row',
  },
  intervalOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedIntervalOption: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  intervalText: {
    fontSize: 16,
    color: '#6c757d',
  },
  selectedIntervalText: {
    color: 'white',
    fontWeight: '600',
  },
  intervalLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  frequencyOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 8,
    marginRight: '4%',
  },
  selectedFrequencyOption: {
    borderColor: '#007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  frequencyText: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  selectedFrequencyText: {
    color: '#007bff',
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#28a745',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});