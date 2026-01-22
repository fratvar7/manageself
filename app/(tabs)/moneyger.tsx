import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GastosForm, IngresosForm } from '../../components/GastosIngresosForm';
import { RecentTransactions } from '../../components/RecentTransactions';
import { SpendingDashboard } from '../../components/SpendingDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { TransactionsService } from '../../services/transactionsService';
import { CategoriesService } from '../../services/categoriesService';
import { Transaction } from '../../types';
import { colors } from '../../css/colors';

export default function Moneyger() {
  const [selectedType, setSelectedType] = useState<'gasto' | 'ingreso'>('gasto');
  const [viewMode, setViewMode] = useState<'registrar' | 'stats'>('stats');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const transactions = await TransactionsService.getTransactions(user.uid);
        const sortedTransactions = transactions
          .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
          .slice(0, 10);
        setRecentTransactions(sortedTransactions);

        const categoriesData = await CategoriesService.getCategories(user.uid);
        setCategories(categoriesData);
      } catch {
        // Error silencioso
      }
    };
    loadData();
  }, [user]);



  return (
    <View style={styles.container}>
      {/* Selector de vista - estilo pill moderno */}
      <View style={styles.viewSelector}>
        <Pressable
          style={[styles.viewOption, viewMode === 'stats' && styles.viewOptionActive]}
          onPress={() => setViewMode('stats')}
        >
          <Ionicons
            name="analytics"
            size={18}
            color={viewMode === 'stats' ? '#fff' : colors.text.secondary}
          />
          <Text style={[styles.viewOptionText, viewMode === 'stats' && styles.viewOptionTextActive]}>
            Resumen
          </Text>
        </Pressable>

        <Pressable
          style={[styles.viewOption, viewMode === 'registrar' && styles.viewOptionActive]}
          onPress={() => setViewMode('registrar')}
        >
          <Ionicons
            name="add"
            size={18}
            color={viewMode === 'registrar' ? '#fff' : colors.text.secondary}
          />
          <Text style={[styles.viewOptionText, viewMode === 'registrar' && styles.viewOptionTextActive]}>
            Nuevo
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {viewMode === 'stats' ? (
          <SpendingDashboard />
        ) : (
          <>
            {/* Selector de tipo con tarjetas */}
            <View style={styles.typeCards}>
              <Pressable
                style={[styles.typeCard, selectedType === 'gasto' && styles.typeCardExpenseActive]}
                onPress={() => setSelectedType('gasto')}
              >
                <View style={[styles.typeIconContainer, selectedType === 'gasto' && styles.typeIconExpense]}>
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={selectedType === 'gasto' ? '#fff' : colors.status.error}
                  />
                </View>
                <Text style={[styles.typeLabel, selectedType === 'gasto' && styles.typeLabelActive]}>
                  Gasto
                </Text>
                <Text style={styles.typeSubtitle}>Registrar salida</Text>
              </Pressable>

              <Pressable
                style={[styles.typeCard, selectedType === 'ingreso' && styles.typeCardIncomeActive]}
                onPress={() => setSelectedType('ingreso')}
              >
                <View style={[styles.typeIconContainer, selectedType === 'ingreso' && styles.typeIconIncome]}>
                  <Ionicons
                    name="arrow-down"
                    size={20}
                    color={selectedType === 'ingreso' ? '#fff' : colors.status.success}
                  />
                </View>
                <Text style={[styles.typeLabel, selectedType === 'ingreso' && styles.typeLabelActive]}>
                  Ingreso
                </Text>
                <Text style={styles.typeSubtitle}>Registrar entrada</Text>
              </Pressable>
            </View>

            {selectedType === 'gasto' ? <GastosForm /> : <IngresosForm />}

            <RecentTransactions
              transactions={recentTransactions}
              categories={categories}
              onViewAll={() => {}}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Selector de vista
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 4,
  },
  viewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    borderRadius: 10,
  },
  viewOptionActive: {
    backgroundColor: colors.accent.primary,
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewOptionTextActive: {
    color: '#fff',
  },

  // Contenido
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // Tarjetas de tipo
  typeCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  typeCardExpenseActive: {
    backgroundColor: colors.status.errorSoft,
    borderColor: colors.status.error,
  },
  typeCardIncomeActive: {
    backgroundColor: colors.status.successSoft,
    borderColor: colors.status.success,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeIconExpense: {
    backgroundColor: colors.status.error,
  },
  typeIconIncome: {
    backgroundColor: colors.status.success,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  typeLabelActive: {
    color: colors.text.primary,
  },
  typeSubtitle: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
