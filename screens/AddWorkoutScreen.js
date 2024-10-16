import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { format, addDays, subDays } from 'date-fns';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = 30;

const AddWorkoutScreen = ({ navigation }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [dates, setDates] = useState(() =>
    Array.from({ length: ITEM_SIZE }, (_, i) => addDays(today, i - Math.floor(ITEM_SIZE / 2)))
  );
  

  const handleDatePress = useCallback((date) => {
    setSelectedDate(date);
    const index = dates.findIndex(d => d.toDateString() === date.toDateString());
    flatListRef.current.scrollToIndex({ index, animated: true });
  }, [dates]);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    hideDatePicker();
    handleDatePress(date);
  };

  const [hasItems, setHasItems] = useState(false);
/*
  // In your useEffect or wherever you fetch data for the current day
  useEffect(() => {
    // Check if there are any exercises or meals for the selected date
    const itemsExist = checkIfItemsExistForDate(selectedDate);
    setHasItems(itemsExist);
  }, [selectedDate]);
   */

  const renderItem = useCallback(({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4]
    });
  
    return (
      <Animated.View style={[styles.carouselItem, { opacity }]}>
        {!hasItems && (
          <Text style={styles.emptyMessage}>Diary is empty for this day</Text>
        )}
      </Animated.View>
    );
  }, [scrollX, hasItems]);
  
  

  const getItemLayout = useCallback((_, index) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  const onEndReached = useCallback(() => {
    setDates(prevDates => [
      ...prevDates,
      ...Array.from({ length: ITEM_SIZE }, (_, i) => addDays(prevDates[prevDates.length - 1], i + 1))
    ]);
  }, []);

  const onStartReached = useCallback(() => {
    setDates(prevDates => [
      ...Array.from({ length: ITEM_SIZE }, (_, i) => subDays(prevDates[0], ITEM_SIZE - i)),
      ...prevDates
    ]);
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setSelectedDate(viewableItems[0].item);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showDatePicker} style={styles.topDateContainer}>
        <Text style={styles.topDateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item.toISOString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        onStartReached={onStartReached}
        onStartReachedThreshold={0.1}
        initialScrollIndex={Math.floor(ITEM_SIZE / 2)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />

      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={() => handleDatePress(subDays(selectedDate, 1))} style={styles.navButton}>
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDatePress(addDays(selectedDate, 1))} style={styles.navButton}>
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fixedButtonsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ExerciseListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })}
        >
          <Text style={styles.buttonText}>+ Add Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMealScreen')}
        >
          <Text style={styles.buttonText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dad7d7',
  },
  
  topDateContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#232799',
    paddingVertical: 15,
    paddingHorizontal: 20,
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  topDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  
  carouselItem: {
    width: width * 0.98, // Slightly smaller than full width
    height: height * 0.98, // Slightly smaller than full height
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15, // Slightly reduced border radius
    marginHorizontal: width * 0.01, // Consistent horizontal margin
    marginVertical: height * 0.01, // Consistent vertical margin
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5, // for Android
  },
  


  panelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232799',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: '50%',
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    backgroundColor: 'rgba(35, 39, 153, 0.7)',
    borderRadius: 25,
    padding: 15,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  fixedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#232799',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyMessage: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  
});

export default AddWorkoutScreen;
