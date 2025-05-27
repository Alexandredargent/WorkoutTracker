import { shadow } from 'react-native-paper';

const colors = {
  primary: '#0e6f8f', // menthe néon
  card: '#ffffff', // bleu nuit profond pour les cartes
  background: '#0A0F1C', // fond général //#f2f4f7 blanc
  text: '#0e6f8f', // texte principal
  muted: '#888',
  accent: '#00B6E0', // bleu électrique
  error: '#E91E63',
  border: '#00B6E0',
  shadow: '#000',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const fonts = {
  title: 'Iceland_400Regular',
};

const typography = {
  sectionTitleLogo: {
    fontSize: 100,
    fontFamily: fonts.title,
    fontWeight: '600',
    color: '#f7f8fa',
    textAlign: 'center',
    // Ombre portée
  textShadowColor: '#000205',
  textShadowOffset: { width: 4, height: 4 },
  textShadowRadius: 15,
  
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    fontSize: 16,
    color: colors.muted,
  },
};

const card = {
  backgroundColor: colors.card,
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  padding: spacing.md,
  borderRadius: 12,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

const sectionHeader = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#101924',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  borderRadius: 8,
  position: 'relative',
};

const button = {
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
};

const input = {
  backgroundColor: '#1B2430',
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  fontSize: 16,
  color: colors.text,
  minWidth: 80,
  height: 40,
};
const link = {
    color: '#e4e9eb',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#000205',
    backgroundColor: '#101924',
    textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 15,
  };
const modal = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.primary,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    color: colors.text,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#1B2430',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
};

const nutritionSummaryCard = {
  backgroundColor: colors.card,
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  marginBottom: 0,
  borderRadius: 12,
  padding: spacing.md,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

const progressBarBackground = {
  width: '100%',
  height: 10,
  backgroundColor: '#333',
  borderRadius: 5,
  marginBottom: 8,
  marginTop: 2,
  overflow: 'hidden',
};

const progressBarFill = {
  height: '100%',
  borderRadius: 5,
};

const backgroundImage = {
  source: require('../assets/appLogov2.png'),
  style: {
    flex: 1,
  },
  defaultResizeMode: 'cover',
};

export default {
  colors,
  spacing,
  typography,
  card,
  fonts,
  sectionHeader,
  button,
  input,
  modal,
  link,
  nutritionSummaryCard,
  progressBarBackground,
  progressBarFill,
  backgroundImage,
};