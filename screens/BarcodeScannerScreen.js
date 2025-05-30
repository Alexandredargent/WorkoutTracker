import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Button,
  Image,
  FlatList,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addMealToDiary } from '../services/diaryService'; // Import the addMealToDiary function
import { auth } from '../services/firebase'; // Import auth to get the current user
import theme from '../styles/theme';

const renderListItem = ({ label, value, unit }) => (
  <View style={styles.listRow}>
    <Text style={styles.listLabel}>{label}:</Text>
    <Text style={styles.listValue}>
      {value} {unit || ''}
    </Text>
  </View>
);

const BarcodeScannerScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('nutrition');

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const result = await response.json();

      // Check status based on API documentation: status 1 means product found.
      if (result.status === 1 && result.product) {
        const product = result.product;
        const foodItem = {
          id: data,
          name: product.product_name || 'Unknown',
          image: product.image_front_url || null,
          brand: product.brands || 'Unknown brand',
          nutriments: product.nutriments || {},
          nutritionGrades: product.nutrition_grades || null,
          novaGroup: product.nova_group || null,
          ingredients: product.ingredients_text || 'Not available',
          ingredientsList: product.ingredients || [],
          additives: product.additives_tags || [],
          additivesN: product.additives_n || 0,
          allergens: product.allergens_tags || [],
          // Add knowledge panels for additives information
          knowledgePanels: product.knowledge_panels || {},
          fullData: product,
        };
        setProductInfo(foodItem);
      } else {
        alert('Food product not found in the database!');
        setScanned(false);
      }
    } catch (error) {
      console.error('Error fetching food data:', error);
      alert('Error fetching food details. Please check your connection.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMeal = async () => {
    if (productInfo) {
      const user = auth.currentUser;
      
      // Correctly access the date from route params
      const date = route.params?.date;
      
      console.log("Adding meal for date:", date); // Debug log
      
      if (!date) {
        console.error('No date provided in route params');
        alert('Error: No date information available');
        return;
      }
      
      if (user) {
        try {
          // Make sure all fields have valid values, especially mealName
          const mealName = productInfo.name || "Unknown Product";
          
          // Create meal object with the correct structure and valid values
          const meal = {
            mealName: mealName, // Ensure this is not undefined
            calories: productInfo.nutriments['energy-kcal'] || 0,
            carbs: productInfo.nutriments.carbohydrates || 0,
            lipids: productInfo.nutriments.fat || 0,
            proteins: productInfo.nutriments.proteins || 0,
            image: productInfo.image || null,
            type: "meal", // Add this field as it appears in your database
            userId: user.uid, // Add this field as it appears in your database
            date: date // Add this field as it appears in your database
          };
          
          console.log("Adding meal:", meal); // Debug log
          
          // Add the meal to the diary
          await addMealToDiary(user.uid, date, meal);
          
          console.log('Meal added successfully'); // Debug log
          
          // Navigate 2 screens backward
          navigation.pop(2);
        } catch (error) {
          console.error('Error adding meal:', error);
          alert('Failed to add meal: ' + error.message);
        }
      } else {
        alert('No user is signed in.');
      }
    } else {
      alert('No product information available.');
    }
  };
  
  
  
  const getAdditiveNameFromTag = (tag) => {
    if (!tag) return '';
    let name = tag.replace('en:', '');
    name = name.replace(/-/g, ' ').replace(/_/g, ' ');
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Update the getAdditiveDescription function to return a default message
  const getAdditiveDescription = (tag) => {
    return 'Food additive';  // Simple default description
  };

  const getNutriScoreColor = (grade) => {
    if (!grade) return '#CCCCCC';
    switch (grade.toLowerCase()) {
      case 'a':
        return '#27AE60';
      case 'b':
        return '#82E0AA';
      case 'c':
        return '#F4D03F';
      case 'd':
        return '#E67E22';
      case 'e':
        return '#E74C3C';
      default:
        return '#CCCCCC';
    }
  };

  const getNovaGroupDescription = (group) => {
    if (!group) return 'Nova group unknown';
    switch (parseInt(group)) {
      case 1:
        return 'Unprocessed or minimally processed foods';
      case 2:
        return 'Processed culinary ingredients';
      case 3:
        return 'Processed foods';
      case 4:
        return 'Ultra-processed foods';
      default:
        return 'Nova group unknown';
    }
  };

  const renderNutritionTab = () => {
    if (!productInfo) return null;
    const { nutriments } = productInfo;
    
    // Filter and organize nutrition data
    const importantNutrients = [
      { key: 'energy-kcal', label: 'Energy', unit: 'kcal' },
      { key: 'fat', label: 'Fat', unit: 'g' },
      { key: 'saturated-fat', label: 'Saturated Fat', unit: 'g' },
      { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
      { key: 'sugars', label: 'Sugars', unit: 'g' },
      { key: 'proteins', label: 'Proteins', unit: 'g' },
      { key: 'salt', label: 'Salt', unit: 'g' },
    ];
    
    const nutritionData = [];
    
    // Only add important nutrients in order
    importantNutrients.forEach(item => {
      if (nutriments[item.key] !== undefined) {
        nutritionData.push({
          label: item.label,
          value: nutriments[item.key],
          unit: item.unit
        });
      }
    });

    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.sectionTitle}>Nutrition Facts</Text>
        <Text style={styles.nutritionSubtitle}>Per 100g</Text>
        
        {nutritionData.length > 0 ? (
          <View style={styles.nutritionTable}>
            {nutritionData.map((item, index) => {
              const formattedValue = typeof item.value === 'number' 
                ? item.value.toFixed(1) 
                : item.value;
                
              return (
                <View 
                  key={`nutrition-${index}`} 
                  style={[
                    styles.nutritionRow,
                    index === 0 && styles.nutritionRowFirst,
                    index === nutritionData.length - 1 && styles.nutritionRowLast
                  ]}
                >
                  <Text style={styles.nutritionLabel}>{item.label}</Text>
                  <Text style={styles.nutritionValue}>
                    {formattedValue} {item.unit}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyMessage}>No nutrition information available</Text>
        )}
      </View>
    );
  };

  const renderIngredientsTab = () => {
    if (!productInfo) return null;

    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {productInfo.ingredients ? (
          <Text style={styles.ingredientsText}>{productInfo.ingredients}</Text>
        ) : (
          <Text style={styles.emptyMessage}>No ingredients information available</Text>
        )}
        
        
      </View>
    );
  };

  const renderAdditivesTab = () => {
    if (!productInfo) return null;

    // Extract additives knowledge panels
    const additivesPanels = productInfo.knowledgePanels?.additives?.elements || [];
    const additivesPanelIds = additivesPanels
      .filter(element => element.element_type === "panel")
      .map(element => element.panel_element.panel_id);
    
    // Get detailed information for each additive
    const additiveDetails = {};
    if (productInfo.knowledgePanels) {
      // Process all knowledge panels that start with "additive_"
      Object.keys(productInfo.knowledgePanels).forEach(panelId => {
        if (panelId.startsWith('additive_')) {
          const panel = productInfo.knowledgePanels[panelId];
          const title = panel.title_element?.title || '';
          let description = '';
          
          // Extract text from HTML content
          panel.elements?.forEach(element => {
            if (element.element_type === 'text' && element.text_element?.html) {
              // Simple HTML to text conversion (remove tags)
              const htmlContent = element.text_element.html;
              description += htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          });
          
          additiveDetails[panelId] = { title, description, level: panel.level };
        }
      });
    }

    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.sectionTitle}>Additives</Text>
        {productInfo.additives && productInfo.additives.length > 0 ? (
          <View>
            <Text style={styles.additivesCount}>
              This product contains {productInfo.additivesN} additives
            </Text>
            
            {productInfo.additives.map((item, index) => {
              const additiveName = getAdditiveNameFromTag(item);
              // Try to find enhanced description from knowledge panels
              const panelId = `additive_${item.toLowerCase()}`;
              const enhancedInfo = additiveDetails[panelId];
              
              let additiveTitle = additiveName;
              let additiveDescription = "Food additive"; // Default description
              let additiveLevel = "info"; // Default level
              
              // Use enhanced info if available
              if (enhancedInfo) {
                additiveTitle = enhancedInfo.title || additiveTitle;
                additiveDescription = enhancedInfo.description || additiveDescription;
                additiveLevel = enhancedInfo.level || additiveLevel;
              }
              
              return (
                <View 
                  key={`additive-${index}`} 
                  style={[
                    styles.additiveItem,
                    additiveLevel === 'warning' && styles.additiveWarning,
                    additiveLevel === 'alert' && styles.additiveAlert,
                  ]}
                >
                  <Text style={styles.additiveName}>{additiveTitle}</Text>
                  <Text style={styles.additiveDescription}>{additiveDescription}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyMessage}>No additives found in this product</Text>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nutrition':
        return renderNutritionTab();
      case 'ingredients':
        return renderIngredientsTab();
      case 'additives':
        return renderAdditivesTab();
      default:
        return null;
    }
  };

  const renderProductDetails = () => (
    <View style={styles.productInfoContainer}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {productInfo.image ? (
            <Image
              source={{ uri: productInfo.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>
        <View style={styles.scoresContainer}>
          {productInfo.nutritionGrades && (
            <View
              style={[
                styles.scoreBox,
                { backgroundColor: getNutriScoreColor(productInfo.nutritionGrades) },
              ]}
            >
              <Text style={styles.scoreLabel}>Nutri-Score</Text>
              <Text style={styles.scoreValue}>
                {productInfo.nutritionGrades.toUpperCase()}
              </Text>
            </View>
          )}
          {productInfo.novaGroup && (
            <View style={styles.novaContainer}>
              <Text style={styles.novaLabel}>Nova Group</Text>
              <Text style={styles.novaValue}>{productInfo.novaGroup}</Text>
              <Text style={styles.novaDescription}>
                {getNovaGroupDescription(productInfo.novaGroup)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.productName}>{productInfo.name}</Text>
      <Text style={styles.productBrand}>{productInfo.brand}</Text>
      {productInfo.allergens.length > 0 && (
        <View style={styles.allergensWarning}>
          <Text style={styles.allergensTitle}>Allergens:</Text>
          <Text style={styles.allergensText}>
            {productInfo.allergens
              .map((allergen) => getAdditiveNameFromTag(allergen))
              .join(', ')}
          </Text>
        </View>
      )}
      <View style={styles.tabContainer}>
        {['nutrition', 'ingredients', 'additives'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.biggerTabContent}>
        <ScrollView>
          {renderTabContent()}
        </ScrollView>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToMeal}>
          <Text style={styles.buttonText}>Add to Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => {
            setProductInfo(null);
            setScanned(false);
          }}
        >
          <Text style={styles.buttonText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.permissionText}>Loading permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes.
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <ImageBackground
          source={theme.backgroundImage.source}
          resizeMode={theme.backgroundImage.defaultResizeMode}
          style={{ flex: 1 }} // <-- assure le fond sur tout l'écran
        >
    <View style={styles.container}>
      {!productInfo && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerEnabled={true}
        />
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading product information...</Text>
        </View>
      )}
      {productInfo && (
        <ScrollView style={styles.scrollView}>
          {renderProductDetails()}
        </ScrollView>
      )}
      {scanned && !productInfo && !loading && (
        <TouchableOpacity
          onPress={() => setScanned(false)}
          style={styles.scanAgain}
        >
          <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  background: {
    flex: 1,
    backgroundColor: '#101924',
  },

  permissionText: { 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 20, 
    fontSize: 16, 
    paddingHorizontal: 20 
  },
  scanAgain: { 
    position: 'absolute', 
    bottom: 50, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    backgroundColor: 'rgba(0, 0, 255, 0.7)', 
    borderRadius: 25 
  },
  scanAgainText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: 'white', 
    marginTop: 10, 
    fontSize: 16 
  },
  scrollView: { 
    flex: 1, 
    width: '100%' 
  },
  productInfoContainer: { 
    
    padding: theme.spacing.md 
  },
  header: { 
    flexDirection: 'row', 
    marginBottom: theme.spacing.md 
  },
  imageContainer: { 
    width: '50%', 
    aspectRatio: 1, 
    backgroundColor: theme.colors.card, 
    borderRadius: 10, 
    overflow: 'hidden', 
    marginRight: 10 
  },
  productImage: { 
    width: '100%', 
    height: '100%' 
  },
  noImageContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0f0f0' 
  },
  noImageText: { 
    color: '#999', 
    textAlign: 'center' 
  },
  scoresContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scoreBox: { 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 10, 
    alignItems: 'center', 
    minWidth: 100 
  },
  scoreLabel: { 
    color: 'white', 
    fontSize: 14 
  },
  scoreValue: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  novaContainer: { 
    backgroundColor: '#eee', 
    borderRadius: 10, 
    padding: 10, 
    alignItems: 'center' 
  },
  novaLabel: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  novaValue: { 
    fontSize: 18 
  },
  novaDescription: { 
    fontSize: 12, 
    textAlign: 'center' 
  },
  productName: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  productBrand: { 
    fontSize: 16, 
    color: theme.colors.white, 
    marginBottom: 15 
  },
  allergensWarning: { 
    backgroundColor: '#fff3cd', 
    borderWidth: 1, 
    borderColor: '#ffeeba', 
    borderRadius: 5, 
    padding: 10, 
    marginBottom: 15 
  },
  allergensTitle: { 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  allergensText: { 
    color: '#856404' 
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 15 
  },
  tabButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 20, 
    backgroundColor: '#ccc' 
  },
  activeTabButton: { 
    backgroundColor: theme.colors.primary 
  },
  tabButtonText: { 
    color: '#333', 
    fontSize: 16 
  },
  activeTabButtonText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  biggerTabContent: { 
    height: 450, 
    backgroundColor: theme.colors.card, 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabContentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 12,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: '#555',
  },
  emptyMessage: {
    fontSize: 14,
    color: theme.colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  // Nutrition tab styles
  nutritionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  nutritionTable: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nutritionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    backgroundColor: theme.colors.card,
  },
  nutritionRowFirst: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  nutritionRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  nutritionLabel: { 
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '400',
  },
  nutritionValue: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#444',
  },
  // Ingredients tab styles
  ingredientsText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: 15,
  },
  ingredientsListContainer: {
    marginTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
    marginRight: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  // Additives tab styles
  additivesCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  additiveItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  additiveWarning: {
    borderLeftColor: '#FFC107', // Yellow for warning
  },
  additiveAlert: {
    borderLeftColor: '#F44336', // Red for alert
  },
  additiveName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  additiveDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 30 
  },
  addButton: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 25, 
    flex: 1, 
    marginRight: 10, 
    alignItems: 'center' 
  },
  scanAgainButton: { 
    backgroundColor: '#2196F3', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 25, 
    flex: 1, 
    marginLeft: 10, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});

export default BarcodeScannerScreen;
