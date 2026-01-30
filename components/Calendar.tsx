import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, TextInput } from 'react-native';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { colors } from '../css/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDateISO } from '../utils/dateUtils';

interface CalendarProps {
  selectedDate: string;
  onDateChange: (_date: string) => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Calendar({ selectedDate, onDateChange }: CalendarProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate + 'T12:00:00'));
  const [view, setView] = useState<'calendar' | 'month' | 'year'>('calendar');

  const formatDate = (date: Date): string => {
    return formatDateISO(date);
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    onDateChange(formatDate(newDate));
    setCurrentMonth(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateChange(formatDate(selected));
    setShowModal(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === formatDate(new Date());

      days.push(
        <Pressable
          key={day}
          style={[
            styles.day,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay
          ]}
          onPress={() => selectDate(day)}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText
          ]}>
            {day}
          </Text>
        </Pressable>
      );
    }
    return days;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const selectMonth = (index: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(index);
    setCurrentMonth(newDate);
    setView('calendar');
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setView('calendar');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={() => navigateDay('prev')}>
          <ChevronLeftIcon color={colors.text.primary} />
        </Pressable>

        <Pressable style={styles.dateDisplay} onPress={() => { setShowModal(true); setView('calendar'); }}>
          <CalendarIcon color={colors.text.primary} />
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => navigateDay('next')}>
          <ChevronRightIcon color={colors.text.primary} />
        </Pressable>
      </View>

      <Modal transparent visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ir a fecha...</Text>
                    <Pressable onPress={() => setShowModal(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </Pressable>
                </View>

                {view === 'calendar' && (
                    <>
                        <View style={styles.monthNavigation}>
                            <Pressable onPress={() => navigateMonth('prev')} style={styles.navBtn}>
                                <ChevronLeftIcon color={colors.text.primary} />
                            </Pressable>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Pressable onPress={() => setView('month')}>
                                    <Text style={styles.monthText}>{MONTHS[currentMonth.getMonth()]}</Text>
                                </Pressable>
                                <Pressable onPress={() => setView('year')}>
                                    <Text style={styles.monthText}>{currentMonth.getFullYear()}</Text>
                                </Pressable>
                            </View>
                            <Pressable onPress={() => navigateMonth('next')} style={styles.navBtn}>
                                <ChevronRightIcon color={colors.text.primary} />
                            </Pressable>
                        </View>

                        <View style={styles.weekDays}>
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                <Text key={day} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {renderCalendarDays()}
                        </View>
                    </>
                )}

                {view === 'month' && (
                    <View style={styles.selectionGrid}>
                        <Text style={styles.selectionTitle}>Seleccionar Mes</Text>
                        <View style={styles.gridItems}>
                            {MONTHS.map((m, i) => (
                                <Pressable key={m} style={[styles.gridItem, currentMonth.getMonth() === i && styles.selectedGridItem]} onPress={() => selectMonth(i)}>
                                    <Text style={[styles.gridItemText, currentMonth.getMonth() === i && styles.selectedGridItemText]}>{m.substring(0, 3)}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <Pressable style={styles.backBtn} onPress={() => setView('calendar')}>
                            <Text style={styles.backBtnText}>Volver</Text>
                        </Pressable>
                    </View>
                )}

                {view === 'year' && (
                    <View style={styles.selectionGrid}>
                        <Text style={styles.selectionTitle}>Introducir Año</Text>
                        <TextInput
                            style={styles.inputYear}
                            keyboardType="numeric"
                            maxLength={4}
                            defaultValue={currentMonth.getFullYear().toString()}
                            onChangeText={(val) => {
                                if (val.length === 4) {
                                    selectYear(parseInt(val));
                                }
                            }}
                            autoFocus
                        />
                         <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 10 }}>Ingresa 4 dígitos para cambiar</Text>
                        <Pressable style={styles.backBtn} onPress={() => setView('calendar')}>
                            <Text style={styles.backBtnText}>Volver</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.secondary, borderRadius: 16, padding: 4, marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: colors.border.light },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  navButton: { padding: 12 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  dateText: { fontSize: 13, color: colors.text.primary, fontWeight: '700', textTransform: 'capitalize' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: colors.background.secondary, borderRadius: 24, width: '100%', maxWidth: 350, padding: 24, borderWidth: 1, borderColor: colors.border.default },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  closeBtn: { padding: 4 },
  monthNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: colors.background.tertiary, borderRadius: 12, padding: 4 },
  navBtn: { padding: 8 },
  monthText: { fontSize: 15, fontWeight: '700', color: colors.accent.primary },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayText: { width: 35, textAlign: 'center', fontSize: 12, color: colors.text.tertiary, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  day: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', margin: 4, borderRadius: 10 },
  emptyDay: { width: 35, height: 35, margin: 4 },
  dayText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  selectedDay: { backgroundColor: colors.accent.primary },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  todayDay: { borderWidth: 1, borderColor: colors.accent.primary },
  todayDayText: { color: colors.accent.primary, fontWeight: '700' },
  selectionGrid: { alignItems: 'center' },
  selectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 20 },
  gridItems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  gridItem: { width: 70, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
  selectedGridItem: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
  gridItemText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14 },
  selectedGridItemText: { color: '#fff' },
  inputYear: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 15,
    width: 200,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  backBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10, backgroundColor: colors.background.tertiary },
  backBtnText: { color: colors.text.primary, fontWeight: '700' }
});
