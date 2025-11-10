import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------- TYPES ----------
type Course = 'Starter' | 'Main' | 'Dessert' | 'Beverage';

interface Dish {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
}

type ScreenName = 'Home' | 'ManageMenu' | 'FilterMenu';

// ---------- DATA ----------
const COURSES: Course[] = ['Starter', 'Main', 'Dessert', 'Beverage'];

const INITIAL_MENU: Dish[] = [
  { id: '1', name: 'Spicy Arancini', description: 'Crispy rice balls with mozzarella and hot sauce.', course: 'Starter', price: 9.5 },
  { id: '2', name: 'Angus Cheeseburger', description: 'Classic burger with aged cheddar and lettuce.', course: 'Main', price: 15.0 },
  { id: '3', name: 'Margherita Pizza', description: 'Tomato sauce, mozzarella, basil.', course: 'Main', price: 14.5 },
  { id: '4', name: 'Tiramisu', description: 'Espresso-soaked ladyfingers with mascarpone cream.', course: 'Dessert', price: 7.0 },
  { id: '5', name: 'Carbonara', description: 'Eggs, Pecorino cheese, and pancetta.', course: 'Main', price: 18.0 },
  { id: '6', name: 'Sparkling Water', description: 'Chilled mineral water.', course: 'Beverage', price: 3.0 },
];

// ---------- HOME SCREEN ----------
interface HomeProps {
  menu: Dish[];
  totalItems: number;
  averagePrice: number;
  navigate: (screen: ScreenName) => void;
}

const HomeScreen: React.FC<HomeProps> = ({ menu, totalItems, averagePrice, navigate }) => (
  <View style={styles.safeArea}>
    <View style={styles.header}>
      <Text style={styles.title}>Christoffel's Digital Menu</Text>
      <Text style={styles.subtitle}>Welcome, Chef!</Text>
    </View>

    <View style={styles.statusCardContainer}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Total Dishes</Text>
        <Text style={styles.statusValue}>{totalItems}</Text>
      </View>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Average Price</Text>
        <Text style={styles.statusValue}>${averagePrice.toFixed(2)}</Text>
      </View>
    </View>

    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Full Menu Overview</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigate('FilterMenu')}>
        <Text style={styles.actionButtonText}>Filter Menu</Text>
        <MaterialCommunityIcons name="filter-menu" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>

    <FlatList
      data={menu}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.menuItem}>
          <View>
            <Text style={styles.dishName}>{item.name} (${item.price.toFixed(2)})</Text>
            <Text style={styles.dishDescription}>{item.description}</Text>
          </View>
          <View style={styles.dishCourse}>
            <Text style={styles.courseTag}>{item.course}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={() => <Text style={styles.emptyText}>The menu is currently empty!</Text>}
      style={styles.menuList}
      contentContainerStyle={{ paddingBottom: 60 }}
    />
  </View>
);

// ---------- MANAGE MENU SCREEN ----------
interface ManageProps {
  menu: Dish[];
  setMenu: React.Dispatch<React.SetStateAction<Dish[]>>;
  totalItems: number;
}

const ManageMenuScreen: React.FC<ManageProps> = ({ menu, setMenu, totalItems }) => {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<Course>('Starter');
  const [price, setPrice] = useState('');

  const handleAddDish = () => {
    const parsedPrice = parseFloat(price);
    if (!dishName || !description || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Missing Details', 'Please enter a valid Name, Description, and Price.');
      return;
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name: dishName,
      description,
      course,
      price: parsedPrice,
    };

    setMenu((prev) => [...prev, newDish]);
    setDishName('');
    setDescription('');
    setPrice('');
    setCourse('Starter');
    Alert.alert('Success', `${dishName} has been added to the menu!`);
  };

  const handleRemoveDish = (id: string, name: string) => {
    Alert.alert('Confirm Removal', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setMenu((prev) => prev.filter((dish) => dish.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.managementTitle}>Menu Item Management</Text>

        {/* Add Dish */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Dish</Text>
          <TextInput style={styles.input} placeholder="Dish Name" value={dishName} onChangeText={setDishName} />
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Course:</Text>
            <View style={styles.courseButtonsContainer}>
              {COURSES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.courseButton, course === c && styles.courseButtonActive]}
                  onPress={() => setCourse(c)}
                >
                  <Text style={[styles.courseButtonText, course === c && styles.courseButtonTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Price (e.g. 14.50)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddDish}>
            <Text style={styles.addButtonText}>ADD DISH TO MENU</Text>
          </TouchableOpacity>
        </View>

        {/* Remove Dishes */}
        <View style={styles.removeListContainer}>
          <Text style={styles.formTitle}>Remove Existing Dishes ({totalItems})</Text>
          <FlatList
            data={menu}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.removeItem}>
                <Text style={styles.removeItemName}>{item.name}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveDish(item.id, item.name)}>
                  <MaterialCommunityIcons name="delete-empty" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => <Text style={styles.emptyText}>No dishes to remove.</Text>}
            nestedScrollEnabled
            style={{ maxHeight: 300 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

// ---------- FILTER MENU SCREEN ----------
interface FilterProps {
  menu: Dish[];
}

const FilterMenuScreen: React.FC<FilterProps> = ({ menu }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredMenu = useMemo(() => {
    if (!selectedCourse) return menu;
    return menu.filter((dish) => dish.course === selectedCourse);
  }, [menu, selectedCourse]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.titleFilter}>Guest View Filter</Text>
        <Text style={styles.subtitleFilter}>Filter dishes by category</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtonsContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !selectedCourse && styles.filterButtonActive]}
          onPress={() => setSelectedCourse(null)}
        >
          <Text style={[styles.filterButtonText, !selectedCourse && styles.filterButtonTextActive]}>All Dishes</Text>
        </TouchableOpacity>
        {COURSES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterButton, selectedCourse === c && styles.filterButtonActive]}
            onPress={() => setSelectedCourse(c)}
          >
            <Text style={[styles.filterButtonText, selectedCourse === c && styles.filterButtonTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredMenu}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItemFiltered}>
            <View>
              <Text style={styles.dishNameFiltered}>{item.name}</Text>
              <Text style={styles.dishDescriptionFiltered}>{item.description}</Text>
            </View>
            <Text style={styles.priceFiltered}>${item.price.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text style={styles.emptyText}>No dishes found for this course.</Text>}
        style={styles.menuList}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

// ---------- MAIN APP ----------
const STORAGE_KEY = '@menu_data';

const App: React.FC = () => {
  const [menu, setMenu] = useState<Dish[]>(INITIAL_MENU);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');

  // 🧠 Load menu on startup
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setMenu(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to load saved menu:', err);
      }
    };
    loadMenu();
  }, []);

  // 💾 Save menu whenever it changes
  useEffect(() => {
    const saveMenu = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
      } catch (err) {
        console.warn('Failed to save menu:', err);
      }
    };
    saveMenu();
  }, [menu]);

  const { totalItems, averagePrice } = useMemo(() => {
    const total = menu.length;
    const avg = total ? menu.reduce((sum, dish) => sum + dish.price, 0) / total : 0;
    return { totalItems: total, averagePrice: avg };
  }, [menu]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ManageMenu':
        return <ManageMenuScreen menu={menu} setMenu={setMenu} totalItems={totalItems} />;
      case 'FilterMenu':
        return <FilterMenuScreen menu={menu} />;
      default:
        return <HomeScreen menu={menu} totalItems={totalItems} averagePrice={averagePrice} navigate={setCurrentScreen} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('Home')}>
          <MaterialCommunityIcons name="food-fork-drink" size={24} color={currentScreen === 'Home' ? '#6EE7B7' : '#FFF'} />
          <Text style={[styles.navText, currentScreen === 'Home' && styles.navTextActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('ManageMenu')}>
          <MaterialCommunityIcons name="plus-minus-box" size={24} color={currentScreen === 'ManageMenu' ? '#6EE7B7' : '#FFF'} />
          <Text style={[styles.navText, currentScreen === 'ManageMenu' && styles.navTextActive]}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;

// ---------- STYLES ----------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { color: '#6B7280', fontSize: 16 },
  statusCardContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, width: '40%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  statusLabel: { color: '#6B7280', fontSize: 14 },
  statusValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  actionButton: { flexDirection: 'row', backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', marginRight: 6, fontWeight: '600' },
  menuList: { paddingHorizontal: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginVertical: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1 },
  dishName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  dishDescription: { color: '#6B7280', fontSize: 13, marginTop: 2, width: 240 },
  dishCourse: { justifyContent: 'center' },
  courseTag: { backgroundColor: '#10B981', color: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 },
  managementTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 15 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginHorizontal: 15, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 10 },
  pickerContainer: { marginBottom: 10 },
  pickerLabel: { color: '#6B7280', marginBottom: 6 },
  courseButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseButton: { backgroundColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  courseButtonActive: { backgroundColor: '#10B981' },
  courseButtonText: { color: '#374151' },
  courseButtonTextActive: { color: '#FFF' },
  addButton: { backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },
  removeListContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginHorizontal: 15 },
  removeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  removeItemName: { fontSize: 15, color: '#111827' },
  removeButton: { backgroundColor: '#EF4444', borderRadius: 8, padding: 6 },
  headerTitleContainer: { alignItems: 'center', marginVertical: 20 },
  titleFilter: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  subtitleFilter: { color: '#6B7280', fontSize: 14 },
  filterButtonsContainer: { paddingHorizontal: 10, marginBottom: 10 },
  filterButton: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  filterButtonActive: { backgroundColor: '#10B981' },
  filterButtonText: { color: '#111827' },
  filterButtonTextActive: { color: '#FFF' },
  menuItemFiltered: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginVertical: 6 },
  dishNameFiltered: { fontSize: 16, fontWeight: '600', color: '#111827' },
  dishDescriptionFiltered: { fontSize: 13, color: '#6B7280', width: 240 },
  priceFiltered: { color: '#10B981', fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1F2937', paddingVertical: 10 },
  navButton: { alignItems: 'center' },
  navText: { color: '#FFF', fontSize: 12, marginTop: 4 },
  navTextActive: { color: '#6EE7B7', fontWeight: 'bold' },
  scrollContainer: { paddingBottom: 40 },
});
